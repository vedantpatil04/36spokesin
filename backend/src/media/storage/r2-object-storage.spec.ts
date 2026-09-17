import { R2ObjectStorage } from "./r2-object-storage.js";

const storage = new R2ObjectStorage({
  accountId: "account123",
  endpoint: "https://account123.r2.cloudflarestorage.com",
  accessKeyId: "AKIAEXAMPLE",
  secretAccessKey: "secret-example",
  bucket: "spokes-media",
  publicBaseUrl: "https://media.36spokes.in",
});

describe("R2ObjectStorage", () => {
  it("pre-signs a PUT that locks the content type and size", async () => {
    const upload = await storage.createPresignedUpload({
      key: "riders/2026/09/0f8fad5b-d9cb-469f-a165-70867728950e.jpg",
      contentType: "image/jpeg",
      contentLength: 482133,
      expiresInSeconds: 600,
    });

    const url = new URL(upload.url);
    expect(url.host).toBe("account123.r2.cloudflarestorage.com");
    expect(url.pathname).toBe(
      "/spokes-media/riders/2026/09/0f8fad5b-d9cb-469f-a165-70867728950e.jpg",
    );
    expect(url.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe("content-length;content-type;host");
    // No SDK checksum parameters, which R2 rejects on browser uploads.
    expect([...url.searchParams.keys()].some((key) => key.toLowerCase().includes("checksum"))).toBe(
      false,
    );
    expect(upload.headers).toEqual({ "Content-Type": "image/jpeg" });
    expect(upload.method).toBe("PUT");
  });

  it("builds public URLs from the configured CDN origin", () => {
    expect(storage.publicUrl("products/2026/09/a.webp")).toBe(
      "https://media.36spokes.in/products/2026/09/a.webp",
    );
  });
});
