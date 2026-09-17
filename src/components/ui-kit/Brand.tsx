import { media } from "@/data/media";
import { cn } from "@/lib/utils";

/** The circular crest. Decorative by default because it sits beside the wordmark. */
export function BrandCrest({
  className,
  alt = "",
  loading,
}: {
  className?: string;
  alt?: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <img
      src={media.brand.crest.src}
      width={media.brand.crest.width}
      height={media.brand.crest.height}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cn("rounded-full object-cover", className)}
    />
  );
}

/**
 * "36·SPOKES" as set in the display face. The visual form is hidden from
 * assistive technology, which hears "36 Spokes" instead of "36 dot spokes".
 */
export function BrandWordmark({
  className,
  accentDot = true,
}: {
  className?: string;
  accentDot?: boolean;
}) {
  return (
    <span className={className}>
      <span aria-hidden>36{accentDot ? <span className="text-primary">·</span> : "·"}SPOKES</span>
      <span className="sr-only">36 Spokes</span>
    </span>
  );
}
