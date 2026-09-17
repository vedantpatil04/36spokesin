import type { CSSProperties } from "react";
import type { MediaAsset } from "@/types";

/** Same image, described for a specific context (e.g. a card for a named product). */
export function withAlt(asset: MediaAsset, alt: string): MediaAsset {
  return { ...asset, alt };
}

/** `object-position` for an asset's focal point, so crops keep the subject in frame. */
export function focalPointStyle(asset: MediaAsset): CSSProperties | undefined {
  if (!asset.focalPoint) return undefined;
  const { x, y } = asset.focalPoint;
  return { objectPosition: `${Math.round(x * 100)}% ${Math.round(y * 100)}%` };
}
