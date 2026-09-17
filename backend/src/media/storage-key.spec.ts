import { MediaCategory } from "../generated/prisma/enums.js";
import { buildStorageKey, isSafeStorageKey, sanitizeFileName } from "./storage-key.js";

describe("buildStorageKey", () => {
  it("builds category/year/month/uuid.ext from server-side values only", () => {
    const key = buildStorageKey(
      MediaCategory.GARAGE_SERVICE,
      "image/webp",
      new Date("2026-01-05T00:00:00Z"),
      "0f8fad5b-d9cb-469f-a165-70867728950e",
    );
    expect(key).toBe("garage-services/2026/01/0f8fad5b-d9cb-469f-a165-70867728950e.webp");
    expect(isSafeStorageKey(key)).toBe(true);
  });

  it("generates unique keys", () => {
    const keys = new Set(
      Array.from({ length: 50 }, () => buildStorageKey(MediaCategory.RIDER, "image/jpeg")),
    );
    expect(keys.size).toBe(50);
  });

  it("rejects keys that could escape their prefix", () => {
    expect(isSafeStorageKey("riders/2026/01/../../secrets.png")).toBe(false);
    expect(isSafeStorageKey("/riders/2026/01/0f8fad5b-d9cb-469f-a165-70867728950e.png")).toBe(
      false,
    );
    expect(isSafeStorageKey("riders/2026/01/0f8fad5b-d9cb-469f-a165-70867728950e.svg")).toBe(false);
  });
});

describe("sanitizeFileName", () => {
  it.each([
    ["../../etc/passwd", "passwd"],
    ["C:\\Users\\ved\\bike.jpg", "bike.jpg"],
    ["  ladakh\u0000\u0007 trip .png ", "ladakh trip .png"],
    ["...hidden.png", "hidden.png"],
    ["", "upload"],
    ["///", "upload"],
  ])("%j → %j", (input, expected) => {
    expect(sanitizeFileName(input)).toBe(expected);
  });

  it("caps the length", () => {
    expect(sanitizeFileName(`${"a".repeat(500)}.jpg`)).toHaveLength(200);
  });
});
