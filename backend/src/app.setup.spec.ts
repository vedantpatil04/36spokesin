import { describe, expect, it } from "vitest";
import { isOriginAllowed } from "./app.setup.js";

describe("isOriginAllowed", () => {
  const allowed = new Set([
    "http://localhost:8080",
    "https://36spokesin.vercel.app",
    "https://www.36spokes.in",
  ]);

  it("allows exact match origins", () => {
    expect(isOriginAllowed("http://localhost:8080", allowed)).toBe(true);
    expect(isOriginAllowed("https://36spokesin.vercel.app", allowed)).toBe(true);
    expect(isOriginAllowed("https://www.36spokes.in", allowed)).toBe(true);
  });

  it("allows Vercel preview branch deployments for 36spokesin", () => {
    expect(isOriginAllowed("https://36spokesin-git-main-user.vercel.app", allowed)).toBe(true);
    expect(isOriginAllowed("https://36spokesin-abc1234.vercel.app", allowed)).toBe(true);
  });

  it("rejects unauthorized origins", () => {
    expect(isOriginAllowed("https://evil-36spokesin.vercel.app", allowed)).toBe(false);
    expect(isOriginAllowed("https://otherapp.vercel.app", allowed)).toBe(false);
    expect(isOriginAllowed("http://malicious.com", allowed)).toBe(false);
  });
});
