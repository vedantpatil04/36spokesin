import { imageSize } from "image-size";
import type { AllowedMediaMimeType } from "./media.policy.js";

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  String.fromCharCode(...bytes.subarray(start, end));

/**
 * Identifies the real image format from its leading bytes, ignoring whatever the
 * client declared. Returns null for anything that is not an accepted format.
 */
export function detectImageMimeType(bytes: Uint8Array): AllowedMediaMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && pngSignature.every((byte, index) => bytes[index] === byte)) {
    return "image/png";
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (bytes.length >= 16 && ascii(bytes, 4, 8) === "ftyp") {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const boxSize = Math.min(view.getUint32(0), bytes.length);
    const brands = [ascii(bytes, 8, 12)];
    for (let offset = 16; offset + 4 <= boxSize; offset += 4)
      brands.push(ascii(bytes, offset, offset + 4));
    if (brands.some((brand) => brand === "avif" || brand === "avis")) return "image/avif";
  }
  return null;
}

/**
 * Identifies the real video format from its leading bytes.
 */
export function detectVideoMimeType(bytes: Uint8Array): AllowedMediaMimeType | null {
  if (bytes.length < 4) return null;
  // WebM starts with EBML ID 0x1A 0x45 0xDF 0xA3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "video/webm";
  }
  if (bytes.length >= 8) {
    // MP4 and QuickTime (MOV) with ftyp box
    if (ascii(bytes, 4, 8) === "ftyp") {
      const brand = bytes.length >= 12 ? ascii(bytes, 8, 12) : "";
      if (brand.startsWith("qt")) return "video/quicktime";
      return "video/mp4";
    }
    // QuickTime MOV with other atoms
    const box = ascii(bytes, 4, 8);
    if (box === "moov" || box === "mdat" || box === "wide") {
      return "video/quicktime";
    }
  }
  return null;
}

/**
 * Display dimensions read from the image header, with EXIF rotation applied so a
 * portrait phone photo reports portrait dimensions. Null when the header is not
 * within the inspected bytes.
 */
export function readImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  try {
    const { width, height, orientation } = imageSize(bytes);
    if (!width || !height) return null;
    const rotated = orientation !== undefined && orientation >= 5 && orientation <= 8;
    return rotated ? { width: height, height: width } : { width, height };
  } catch {
    return null;
  }
}
