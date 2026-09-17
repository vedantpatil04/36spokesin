import type { ReactNode } from "react";
import { focalPointStyle } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types";

/**
 * Renders a MediaAsset in a fixed-ratio frame.
 *
 * Intrinsic width/height are always emitted so the browser can reserve space,
 * `priority` marks above-the-fold images for eager, high-priority loading, and
 * `srcSet`/`sizes` are passed through when the asset provides candidates.
 */
export function Media({
  asset,
  alt,
  ratio = "4/3",
  sizes,
  className,
  imgClassName,
  priority = false,
  children,
}: {
  asset: MediaAsset;
  /** Overrides the asset's own description for this context. Pass "" for decorative use. */
  alt?: string;
  ratio?: string;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("relative overflow-hidden bg-surface-2", className)}
      style={{ aspectRatio: ratio }}
    >
      <img
        src={asset.src}
        srcSet={asset.srcSet}
        sizes={asset.srcSet ? sizes : undefined}
        alt={alt ?? asset.alt}
        width={asset.width}
        height={asset.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        style={focalPointStyle(asset)}
        className={cn(
          "h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform",
          imgClassName,
        )}
      />
      {children}
    </div>
  );
}
