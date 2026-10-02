import { detectImageMimeType, detectVideoMimeType, readImageDimensions } from "./image-inspection.js";

const bytes = (...values: (number | string)[]) =>
  Uint8Array.from(
    values.flatMap((value) =>
      typeof value === "string" ? [...value].map((c) => c.charCodeAt(0)) : [value],
    ),
  );

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAEElEQVR4nGO44KAARww4OQAeVg5BTxog1AAAAABJRU5ErkJggg==",
  "base64",
);

describe("detectImageMimeType", () => {
  it("recognises accepted formats by signature", () => {
    expect(detectImageMimeType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toBe("image/jpeg");
    expect(detectImageMimeType(TINY_PNG)).toBe("image/png");
    expect(detectImageMimeType(bytes("RIFF", 0, 0, 0, 0, "WEBPVP8 "))).toBe("image/webp");
    expect(detectImageMimeType(bytes(0, 0, 0, 0x1c, "ftyp", "avif", 0, 0, 0, 0, "avifmif1"))).toBe(
      "image/avif",
    );
    expect(detectImageMimeType(bytes(0, 0, 0, 0x18, "ftyp", "mif1", 0, 0, 0, 0, "avif"))).toBe(
      "image/avif",
    );
  });

  it("rejects everything else, including disguised content", () => {
    expect(detectImageMimeType(bytes('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
    expect(detectImageMimeType(bytes("<html><script>"))).toBeNull();
    expect(detectImageMimeType(bytes("GIF89a", 0, 0, 0, 0))).toBeNull();
    expect(
      detectImageMimeType(bytes(0, 0, 0, 0x18, "ftyp", "heic", 0, 0, 0, 0, "mif1")),
    ).toBeNull();
    expect(detectImageMimeType(new Uint8Array())).toBeNull();
  });
});

describe("readImageDimensions", () => {
  it("reads dimensions from the header", () => {
    expect(readImageDimensions(TINY_PNG)).toEqual({ width: 4, height: 3 });
  });

  it("returns null when the header cannot be parsed", () => {
    expect(readImageDimensions(bytes("not an image at all"))).toBeNull();
    expect(readImageDimensions(TINY_PNG.subarray(0, 12))).toBeNull();
  });
});

describe("detectVideoMimeType", () => {
  it("recognises MP4 video by ftyp header", () => {
    expect(detectVideoMimeType(bytes(0, 0, 0, 0x18, "ftyp", "isom", 0, 0, 0, 0))).toBe(
      "video/mp4",
    );
    expect(detectVideoMimeType(bytes(0, 0, 0, 0x18, "ftyp", "mp42", 0, 0, 0, 0))).toBe(
      "video/mp4",
    );
  });

  it("recognises QuickTime MOV by qt brand or moov/mdat atom", () => {
    expect(detectVideoMimeType(bytes(0, 0, 0, 0x14, "ftyp", "qt  ", 0, 0, 0, 0))).toBe(
      "video/quicktime",
    );
    expect(detectVideoMimeType(bytes(0, 0, 0, 0x10, "moov", 0, 0, 0, 0))).toBe(
      "video/quicktime",
    );
  });

  it("recognises WebM video by EBML signature", () => {
    expect(detectVideoMimeType(bytes(0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0, 0, 0))).toBe(
      "video/webm",
    );
  });

  it("rejects non-video content", () => {
    expect(detectVideoMimeType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBeNull();
    expect(detectVideoMimeType(TINY_PNG)).toBeNull();
    expect(detectVideoMimeType(bytes("hello world"))).toBeNull();
    expect(detectVideoMimeType(new Uint8Array())).toBeNull();
  });
});
