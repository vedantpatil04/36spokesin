import { CloudinaryObjectStorage } from "./cloudinary-object-storage.js";

const storage = new CloudinaryObjectStorage(
  {
    cloudName: "spokes-cloud",
    apiKey: "test-api-key",
    apiSecret: "test-api-secret-1234567890123456",
  },
  "http://localhost:3000",
);

describe("CloudinaryObjectStorage", () => {
  it("creates a signed streaming PUT upload URL targeting the API server", async () => {
    const upload = await storage.createPresignedUpload({
      key: "products/2026/09/0f8fad5b-d9cb-469f-a165-70867728950e.jpg",
      contentType: "image/jpeg",
      contentLength: 482133,
      expiresInSeconds: 600,
    });

    expect(upload.method).toBe("PUT");
    expect(upload.headers).toEqual({ "Content-Type": "image/jpeg" });
    expect(upload.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const url = new URL(upload.url);
    expect(url.origin).toBe("http://localhost:3000");
    expect(url.pathname).toBe("/api/v1/media/uploads/content");
    expect(url.searchParams.get("key")).toBe(
      "products/2026/09/0f8fad5b-d9cb-469f-a165-70867728950e.jpg",
    );
    expect(url.searchParams.get("expires")).toBeTruthy();
    expect(url.searchParams.get("sig")).toBeTruthy();

    const expires = Number(url.searchParams.get("expires"));
    const sig = url.searchParams.get("sig")!;
    expect(
      storage.verifyUploadToken(
        "products/2026/09/0f8fad5b-d9cb-469f-a165-70867728950e.jpg",
        expires,
        sig,
      ),
    ).toBe(true);
  });

  it("rejects invalid, tampered or expired upload tokens", () => {
    const key = "products/2026/09/0f8fad5b-d9cb-469f-a165-70867728950e.jpg";
    const future = Date.now() + 60000;
    const expired = Date.now() - 1000;

    // Tampered signature
    expect(storage.verifyUploadToken(key, future, "bad-signature-hex-12345678901234567890")).toBe(
      false,
    );
    // Expired timestamp
    expect(storage.verifyUploadToken(key, expired, "some-sig")).toBe(false);
    // Path traversal in key
    expect(storage.verifyUploadToken("../../secrets.jpg", future, "sig")).toBe(false);
  });

  it("builds public delivery URLs with correct resource types", () => {
    // Image URL
    expect(storage.publicUrl("products/2026/09/sample.webp")).toBe(
      "https://res.cloudinary.com/spokes-cloud/image/upload/products/2026/09/sample.webp",
    );

    // Video URL (mp4)
    expect(storage.publicUrl("site/2026/09/hero.mp4")).toBe(
      "https://res.cloudinary.com/spokes-cloud/video/upload/site/2026/09/hero.mp4",
    );

    // Video URL (webm)
    expect(storage.publicUrl("community/2026/09/ride.webm")).toBe(
      "https://res.cloudinary.com/spokes-cloud/video/upload/community/2026/09/ride.webm",
    );
  });

  it("reports isConfigured as true", () => {
    expect(storage.isConfigured).toBe(true);
  });
});
