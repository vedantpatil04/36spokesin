import {
  boundingBox,
  haversineKm,
  locateOnLine,
  measureLine,
  pointAtKm,
  thinLine,
} from "./geometry.js";
import { PlanSigner, stableStringify } from "./plan-signature.js";
import { TtlCache } from "./ttl-cache.js";
import { UpstreamError, fetchJson } from "./upstream.js";

const BELAGAVI = { lat: 15.8497, lon: 74.4977 };
const PANAJI = { lat: 15.4909, lon: 73.8278 };

describe("geometry", () => {
  it("measures great-circle distance", () => {
    // Belagavi to Panaji is about 82 km in a straight line.
    expect(haversineKm(BELAGAVI, PANAJI)).toBeGreaterThan(80);
    expect(haversineKm(BELAGAVI, PANAJI)).toBeLessThan(84);
    expect(haversineKm(BELAGAVI, BELAGAVI)).toBe(0);
  });

  it("scales a line so its end matches the routing service's distance", () => {
    const middle = { lat: 15.67, lon: 74.16 };
    const line = measureLine([BELAGAVI, middle, PANAJI], 150);
    expect(line.km[0]).toBe(0);
    expect(line.km[2]).toBeCloseTo(150, 5);
    expect(line.km[1]).toBeGreaterThan(60);
    expect(line.km[1]).toBeLessThan(90);
  });

  it("places a point on the line by its nearest vertex", () => {
    const middle = { lat: 15.67, lon: 74.16 };
    const line = measureLine([BELAGAVI, middle, PANAJI], 150);
    const near = locateOnLine(line, { lat: 15.68, lon: 74.17 });
    expect(near.kmFromStart).toBe(line.km[1]);
    expect(near.offRouteKm).toBeLessThan(2);
    expect(pointAtKm(line, 149)).toEqual(PANAJI);
  });

  it("thins a line but keeps both ends", () => {
    const points = Array.from({ length: 1000 }, (_, index) => index);
    const thinned = thinLine(points, 50);
    expect(thinned).toHaveLength(50);
    expect(thinned[0]).toBe(0);
    expect(thinned[49]).toBe(999);
    expect(thinLine([1, 2, 3], 50)).toEqual([1, 2, 3]);
  });

  it("finds the bounding box with padding", () => {
    expect(boundingBox([BELAGAVI, PANAJI], 0.1)).toEqual({
      south: PANAJI.lat - 0.1,
      west: PANAJI.lon - 0.1,
      north: BELAGAVI.lat + 0.1,
      east: BELAGAVI.lon + 0.1,
    });
  });
});

describe("TtlCache", () => {
  it("returns a value until it expires, then loads again", async () => {
    let now = 0;
    const cache = new TtlCache<number>(1000, 10, () => now);
    const load = vi.fn(async () => 7);
    expect(await cache.getOrLoad("a", load)).toBe(7);
    expect(await cache.getOrLoad("a", load)).toBe(7);
    expect(load).toHaveBeenCalledTimes(1);
    now = 1001;
    expect(await cache.getOrLoad("a", load)).toBe(7);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("shares one call between overlapping requests and doesn't cache failures", async () => {
    const cache = new TtlCache<string>(1000, 10);
    let release: (value: string) => void = () => undefined;
    const load = vi.fn(() => new Promise<string>((resolve) => (release = resolve)));
    const both = Promise.all([cache.getOrLoad("k", load), cache.getOrLoad("k", load)]);
    release("done");
    expect(await both).toEqual(["done", "done"]);
    expect(load).toHaveBeenCalledTimes(1);

    const failing = vi.fn(async () => {
      throw new Error("down");
    });
    await expect(cache.getOrLoad("x", failing)).rejects.toThrow("down");
    await expect(cache.getOrLoad("x", failing)).rejects.toThrow("down");
    expect(failing).toHaveBeenCalledTimes(2);
  });

  it("drops the oldest entry when full", () => {
    const cache = new TtlCache<number>(1000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
    expect(cache.size).toBe(2);
  });
});

describe("PlanSigner", () => {
  const signer = new PlanSigner("a-server-secret-of-at-least-32-characters");

  it("accepts a plan it signed, whatever order its keys come back in", () => {
    const token = signer.sign({ distanceKm: 186, origin: { name: "Belagavi", lat: 15.8 } });
    expect(signer.verify({ origin: { lat: 15.8, name: "Belagavi" }, distanceKm: 186 }, token)).toBe(
      true,
    );
  });

  it("rejects a plan that was changed, a wrong token and another server's token", () => {
    const plan = { distanceKm: 186, days: [{ day: 1 }] };
    const token = signer.sign(plan);
    expect(signer.verify({ ...plan, distanceKm: 1 }, token)).toBe(false);
    expect(signer.verify(plan, "nope")).toBe(false);
    expect(
      signer.verify(plan, new PlanSigner("another-secret-of-at-least-32-chars").sign(plan)),
    ).toBe(false);
  });

  it("serialises keys in a fixed order", () => {
    expect(stableStringify({ b: 1, a: [{ d: null, c: "x" }] })).toBe(
      '{"a":[{"c":"x","d":null}],"b":1}',
    );
  });
});

describe("fetchJson", () => {
  const request = {
    service: "routing",
    url: "https://example.test/route",
    userAgent: "test",
    timeoutMs: 1000,
  };

  it("identifies the app and parses JSON", async () => {
    const fetchFn = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response('{"ok":true}', { status: 200 }),
    );
    expect(await fetchJson(request, fetchFn as typeof fetch)).toEqual({ ok: true });
    const headers = fetchFn.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers["User-Agent"]).toBe("test");
  });

  it("turns failures into UpstreamError and says which are temporary", async () => {
    const status = async (code: number) =>
      fetchJson(request, (async () => new Response("no", { status: code })) as typeof fetch).catch(
        (error: unknown) => error as UpstreamError,
      );
    const busy = (await status(429)) as UpstreamError;
    expect(busy).toBeInstanceOf(UpstreamError);
    expect(busy.temporary).toBe(true);
    expect(((await status(503)) as UpstreamError).temporary).toBe(true);
    expect(((await status(400)) as UpstreamError).temporary).toBe(false);

    const offline = (await fetchJson(request, (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch).catch((error: unknown) => error)) as UpstreamError;
    expect(offline.status).toBeNull();
    expect(offline.temporary).toBe(true);
  });
});
