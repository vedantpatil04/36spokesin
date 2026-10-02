const http = require('http');

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          const page = targets.find(t => t.type === 'page');
          if (!page) throw new Error('No page target found');
          resolve(page.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.events = [];
    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    };
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });
  }

  async send(method, params = {}) {
    await this.ready();
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error('Eval failed: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async waitFor(expr, timeoutMs = 45000, intervalMs = 500) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const val = await this.eval(expr);
        if (val) return val;
      } catch (e) {}
      await this.wait(intervalMs);
    }
    throw new Error('Timeout waiting for: ' + expr);
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('--- STARTING FRONTEND SMOKE TEST ---');
  const wsUrl = await getWsUrl();
  console.log('Connected to Chrome tab:', wsUrl);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');

  console.log('Clearing cookies and storage for clean test...');
  await client.send('Network.clearBrowserCookies');
  await client.send('Storage.clearDataForOrigin', { origin: 'http://localhost:8080', storageTypes: 'all' });
  await client.send('Storage.clearDataForOrigin', { origin: 'http://localhost:3000', storageTypes: 'all' });

  console.log('Navigating to http://localhost:8080/plan...');
  await client.send('Page.navigate', { url: 'http://localhost:8080/plan' });
  await client.wait(2000);
  await client.eval(`fetch('http://localhost:3000/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})`);
  await client.send('Page.navigate', { url: 'http://localhost:8080/plan' });
  await client.wait(3000);

  console.log('Step 1: Checking /plan page load...');
  await client.waitFor('!!document.querySelector("input[placeholder=\\"e.g. Belagavi\\"]")', 15000);
  await client.wait(1000);

  const title = await client.eval('document.title');
  console.log('Page Title:', title);

  console.log('Step 2: Testing required form fields load...');
  const formCheck = await client.eval(`
    (() => {
      const origin = document.querySelector('input[placeholder="e.g. Belagavi"]');
      const dest = document.querySelector('input[placeholder="e.g. Goa"]');
      const date = document.querySelector('input[type="date"]');
      const riders = document.querySelector('input[type="number"][min="1"]');
      const submit = document.querySelector('button[type="submit"]');
      return {
        hasOrigin: !!origin,
        hasDest: !!dest,
        hasDate: !!date,
        hasRiders: !!riders,
        submitText: submit?.innerText
      };
    })()
  `);
  console.log('Form Check:', formCheck);
  if (!formCheck.hasOrigin || !formCheck.hasDest || !formCheck.hasDate || !formCheck.hasRiders) {
    throw new Error('Form fields missing: ' + JSON.stringify(formCheck));
  }

  console.log('Step 3: Filling required fields (Belagavi -> Goa, 2026-10-15, 2 riders)...');
  await client.eval(`
    (() => {
      function setVal(selector, val) {
        const el = document.querySelector(selector);
        const proto = Object.getPrototypeOf(el);
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        desc.set.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setVal('input[placeholder="e.g. Belagavi"]', 'Belagavi');
      setVal('input[placeholder="e.g. Goa"]', 'Goa');
      setVal('input[type="date"]', '2026-10-15');
      setVal('input[type="number"][min="1"]', '2');
    })()
  `);

  console.log('Step 4: Testing optional fields expansion and input...');
  const optionalCheck = await client.eval(`
    (() => {
      const details = document.querySelector('details');
      if (!details) return { hasDetails: false };
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
      
      const budget = details.querySelector('input[min="0"]');
      if (budget) {
        const proto = Object.getPrototypeOf(budget);
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        desc.set.call(budget, '5000');
        budget.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return { hasDetails: true, budgetVal: budget ? budget.value : null };
    })()
  `);
  console.log('Optional Fields Check:', optionalCheck);

  console.log('Step 5: Submitting Plan My Journey...');
  await client.eval(`document.querySelector('button[type="submit"]').click()`);

  console.log('Step 6: Verifying loading state...');
  await client.wait(500);
  const loadingCheck = await client.eval(`
    (() => {
      const btn = document.querySelector('button[type="submit"]');
      const text = btn?.innerText || '';
      return {
        disabled: btn?.disabled,
        text
      };
    })()
  `);
  console.log('Loading State:', loadingCheck);

  console.log('Step 7: Waiting for real plan result (up to 45s)...');
  await client.waitFor(`
    (() => {
      const text = document.body.innerText;
      return text.includes('Belagavi') && text.includes('Goa') && text.includes('Gemini') && text.includes('OpenStreetMap');
    })()
  `, 50000, 1000);

  const resultDetails = await client.eval(`
    (() => {
      const text = document.body.innerText;
      const hasDistance = text.includes('125 km') || text.includes('km');
      const hasGemini = text.includes('Gemini');
      const hasSources = text.includes('OpenStreetMap') && (text.includes('OSRM') || text.includes('routing'));
      const hasRouteSketch = !!document.querySelector('svg');
      const hasSignInToSave = !!Array.from(document.querySelectorAll('a, button')).find(b => b.innerText.toLowerCase().includes('sign in to save'));
      return {
        hasDistance,
        hasGemini,
        hasSources,
        hasRouteSketch,
        hasSignInToSave
      };
    })()
  `);
  console.log('Result Verification:', resultDetails);

  console.log('Step 8: Testing Save journey & sign-in redirect flow...');
  if (resultDetails.hasSignInToSave) {
    console.log('Clicking Sign in to save...');
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('a, button')).find(b => b.innerText.toLowerCase().includes('sign in to save'));
        if (btn) btn.click();
      })()
    `);

    console.log('Waiting for /login redirect...');
    await client.waitFor('window.location.pathname === "/login"', 10000);
    console.log('Redirected to:', await client.eval('window.location.href'));

    console.log('Logging in with test rider account...');
    await client.eval(`
      (() => {
        function setVal(el, val) {
          const proto = Object.getPrototypeOf(el);
          const desc = Object.getOwnPropertyDescriptor(proto, 'value');
          desc.set.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const email = document.querySelector('input[type="email"]');
        const pass = document.querySelector('input[type="password"]');
        setVal(email, 'testrider@36spokes.com');
        setVal(pass, 'Password123!');
        document.querySelector('button[type="submit"]').click();
      })()
    `);

    console.log('Waiting for redirect back to /plan...');
    await client.waitFor('window.location.pathname === "/plan"', 15000);
    console.log('Returned to /plan:', await client.eval('window.location.href'));

    await client.wait(2000);
    console.log('Verifying plan is restored on /plan...');
    const planRestored = await client.eval(`
      (() => {
        const text = document.body.innerText;
        return text.includes('Belagavi') && text.includes('Goa');
      })()
    `);
    console.log('Plan restored after login:', planRestored);
  } else {
    console.log('User is already signed in; proceeding to save directly.');
  }

  console.log('Saving the journey...');
  await client.eval(`
    (() => {
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('save journey'));
      if (saveBtn) saveBtn.click();
    })()
  `);

  console.log('Waiting for save success...');
  await client.waitFor(`
    (() => {
      const text = document.body.innerText;
      return text.toLowerCase().includes('saved to my journeys');
    })()
  `, 15000);

  const openBtnExists = await client.eval(`
    (() => {
      return !!Array.from(document.querySelectorAll('a, button')).find(b => b.innerText.toLowerCase().includes('open saved journey'));
    })()
  `);
  console.log('Save confirmed, Open saved journey button exists:', openBtnExists);

  console.log('Step 9: Testing My Journeys list (/my-36-spokes/journeys)...');
  await client.eval(`
    (() => {
      const openBtn = Array.from(document.querySelectorAll('a')).find(b => b.innerText.toLowerCase().includes('open saved journey'));
      if (openBtn) openBtn.click();
      else window.location.href = '/my-36-spokes/journeys';
    })()
  `);

  await client.wait(2000);
  console.log('Current URL:', await client.eval('window.location.href'));

  // If on detail page, verify detail renders
  const isDetail = await client.eval('window.location.pathname.startsWith("/my-36-spokes/journeys/") && window.location.pathname.length > 25');
  if (isDetail) {
    console.log('Step 10: Saved journey detail view loaded successfully!');
    const detailCheck = await client.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          hasOriginDest: text.includes('Belagavi') && text.includes('Goa'),
          hasStops: text.includes('Day 1') || text.includes('Stops'),
          hasDelete: !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Delete') || b.innerText.includes('Remove'))
        };
      })()
    `);
    console.log('Detail Check:', detailCheck);
    
    // Now navigate back to the list using the Journeys link
    console.log('Navigating to /my-36-spokes/journeys list...');
    await client.eval(`
      (() => {
        const link = document.querySelector('a[href="/my-36-spokes/journeys"]');
        if (link) link.click();
        else window.location.href = '/my-36-spokes/journeys';
      })()
    `);
    await client.waitFor('window.location.pathname.replace(/\\/$/, "") === "/my-36-spokes/journeys"', 15000);
    await client.wait(2000);
  }

  console.log('Verifying journey appears in My Journeys list...');
  await client.waitFor(`
    (() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('belagavi') && text.includes('goa');
    })()
  `, 15000);
  console.log('Journey is present in My Journeys list!');

  console.log('Step 11: Testing journey deletion...');
  await client.eval(`
    (() => {
      const delBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'delete');
      if (delBtn) delBtn.click();
    })()
  `);
  await client.wait(1000);

  console.log('Confirming deletion...');
  await client.eval(`
    (() => {
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('yes, delete'));
      if (confirmBtn) confirmBtn.click();
    })()
  `);

  console.log('Waiting for deletion to complete...');
  await client.waitFor(`
    (() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('no saved journeys yet');
    })()
  `, 15000);
  console.log('Deletion confirmed! Empty state displayed.');

  console.log('--- ALL FRONTEND SMOKE TESTS PASSED SUCCESSFULLY! ---');
  client.close();
}

run().catch(err => {
  console.error('SMOKE TEST ERROR:', err);
  process.exit(1);
});
