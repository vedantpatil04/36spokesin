import { useState } from "react";
import { Media } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import type { MediaAsset, ProductImage } from "@/types";

/**
 * Product photos in the order the admin set. Opens on the primary image; the
 * thumbnails switch the main view. Renders whatever the API returned.
 */
export function ProductGallery({
  images,
  fallback,
  productName,
}: {
  images: ProductImage[];
  fallback: MediaAsset;
  productName: string;
}) {
  const initial = Math.max(
    0,
    images.findIndex((image) => image.isPrimary),
  );
  const [activeIndex, setActiveIndex] = useState(initial);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return (
      <Media
        asset={fallback}
        alt=""
        ratio="1/1"
        className="rounded-sm border border-border"
        priority
      />
    );
  }

  return (
    <div>
      <figure>
        <Media
          asset={active.asset}
          ratio="1/1"
          className="rounded-sm border border-border"
          priority
        />
        {active.caption ? (
          <figcaption className="mt-2 text-xs text-muted-foreground">{active.caption}</figcaption>
        ) : null}
      </figure>
      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label={`${productName} photos`}>
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show photo ${index + 1} of ${images.length}: ${image.asset.alt}`}
                aria-current={index === activeIndex}
                className={cn(
                  "block w-full overflow-hidden rounded-sm border transition-colors",
                  index === activeIndex
                    ? "border-primary"
                    : "border-border opacity-70 hover:border-border-strong hover:opacity-100",
                )}
              >
                <Media asset={image.asset} alt="" ratio="1/1" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
