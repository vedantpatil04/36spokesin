import { describe, expect, it } from "vitest";
import { SocialMediaType } from "../generated/prisma/enums.js";
import {
  inferMediaTypeFromInstagramUrl,
  isValidInstagramUrl,
  normalizeInstagramUrl,
} from "./instagram-url.js";

describe("Instagram URL helpers", () => {
  const reel1 = "https://www.instagram.com/reel/Ddgs-VpKlSy/?stkn=MWYxdDU0ajJrN3p0eQ==";
  const reel2 = "https://www.instagram.com/reel/Ddf_jSxInDn/?stkn=MTA0aGZ2YW9hbjlicw==";
  const post3 = "https://www.instagram.com/p/Dderu-dyxUP/?stkn=MWc0Znp5b2ttdzBlaQ==";

  it("validates valid Instagram post and reel URLs", () => {
    expect(isValidInstagramUrl(reel1)).toBe(true);
    expect(isValidInstagramUrl(reel2)).toBe(true);
    expect(isValidInstagramUrl(post3)).toBe(true);
    expect(isValidInstagramUrl("https://instagram.com/reel/abc123_45/")).toBe(true);
    expect(isValidInstagramUrl("http://www.instagram.com/p/abc123_45")).toBe(true);
    expect(isValidInstagramUrl("https://www.instagram.com/reels/abc123_45/")).toBe(true);
  });

  it("rejects non-Instagram or invalid paths", () => {
    expect(isValidInstagramUrl("https://facebook.com/p/123")).toBe(false);
    expect(isValidInstagramUrl("https://www.instagram.com/explore")).toBe(false);
    expect(isValidInstagramUrl("https://www.instagram.com/36spokes")).toBe(false);
    expect(isValidInstagramUrl("not-a-url")).toBe(false);
  });

  it("normalizes Instagram URLs and strips tracking query params while preserving tokens", () => {
    const rawWithTracking = `${reel1}&utm_source=ig_web_copy_link&igsh=XYZ123`;
    const normalized = normalizeInstagramUrl(rawWithTracking);
    expect(normalized).toBe(reel1);

    const httpUrl = "http://instagram.com/p/Dderu-dyxUP";
    expect(normalizeInstagramUrl(httpUrl)).toBe("https://www.instagram.com/p/Dderu-dyxUP/");

    const reelsUrl = "https://www.instagram.com/reels/Ddgs-VpKlSy/";
    expect(normalizeInstagramUrl(reelsUrl)).toBe("https://www.instagram.com/reel/Ddgs-VpKlSy/");
  });

  it("infers mediaType correctly from the URL", () => {
    expect(inferMediaTypeFromInstagramUrl(reel1)).toBe(SocialMediaType.VIDEO);
    expect(inferMediaTypeFromInstagramUrl(reel2)).toBe(SocialMediaType.VIDEO);
    expect(inferMediaTypeFromInstagramUrl(post3)).toBe(SocialMediaType.IMAGE);
    expect(inferMediaTypeFromInstagramUrl("https://www.instagram.com/p/test/")).toBe(
      SocialMediaType.IMAGE,
    );
  });
});
