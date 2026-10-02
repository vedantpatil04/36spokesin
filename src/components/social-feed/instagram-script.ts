/**
 * Singleton script loader and embed processor for Instagram official embeds.
 */

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: (element?: HTMLElement | null) => void;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadInstagramEmbedScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.instgrm?.Embeds) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    // If the script tag is already in DOM, await it
    const existing = document.getElementById("instagram-embed-script") as HTMLScriptElement | null;
    if (existing) {
      if (window.instgrm?.Embeds) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", (e) => reject(e), { once: true });
      // Polling fallback
      const interval = setInterval(() => {
        if (window.instgrm?.Embeds) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
      return;
    }

    const script = document.createElement("script");
    script.id = "instagram-embed-script";
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = (err) => {
      console.warn("Failed to load Instagram embed.js:", err);
      reject(err);
    };

    document.body.appendChild(script);
  });

  return scriptPromise;
}

export function processInstagramEmbeds(element?: HTMLElement | null): void {
  if (typeof window === "undefined") return;

  loadInstagramEmbedScript()
    .then(() => {
      try {
        if (window.instgrm?.Embeds?.process) {
          if (element) {
            window.instgrm.Embeds.process(element);
          } else {
            window.instgrm.Embeds.process();
          }
        }
      } catch (err) {
        console.warn("Error calling instgrm.Embeds.process():", err);
      }
    })
    .catch((err) => {
      console.warn("Instagram script unavailable for process():", err);
    });
}
