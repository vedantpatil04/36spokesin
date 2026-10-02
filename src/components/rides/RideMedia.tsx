import type { ReactNode } from "react";
import { Media } from "@/components/ui-kit";
import { rideDateParts } from "@/lib/ride-format";
import { cn } from "@/lib/utils";
import type { Ride } from "@/types";

/** The photo's own shape, kept between 4:3 and 16:9 so an odd upload can't take over the layout. */
function photoRatio(ride: Pick<Ride, "image" | "hasImage">): string {
  if (!ride.hasImage) return "16/9";
  const ratio = ride.image.width / ride.image.height;
  if (!Number.isFinite(ratio) || ratio > 16 / 9) return "16/9";
  return ratio < 4 / 3 ? "4/3" : `${ride.image.width}/${ride.image.height}`;
}

/**
 * A ride's photo. A ride without one gets a plain plate carrying its own date
 * instead of a stand-in graphic.
 */
export function RideMedia({
  ride,
  ratio: requestedRatio = "16/9",
  sizes,
  className,
  imgClassName,
  priority = false,
  children,
}: {
  ride: Pick<Ride, "name" | "image" | "hasImage" | "startsAt">;
  /** A CSS aspect ratio, or "photo" to follow the uploaded image. */
  ratio?: string;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  children?: ReactNode;
}) {
  const ratio = requestedRatio === "photo" ? photoRatio(ride) : requestedRatio;
  if (ride.hasImage) {
    return (
      <Media
        asset={ride.image}
        alt={ride.name}
        ratio={ratio}
        priority={priority}
        {...(className !== undefined ? { className } : {})}
        {...(imgClassName !== undefined ? { imgClassName } : {})}
        {...(sizes !== undefined ? { sizes } : {})}
      >
        {children}
      </Media>
    );
  }

  const { day, month, year } = rideDateParts(ride.startsAt);
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-surface-2 to-surface",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      {/* The card repeats the date as text, so the plate is decorative. */}
      <div aria-hidden className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
        <span className="font-display text-5xl leading-none text-foreground/70 md:text-6xl">
          {day}
        </span>
        <span className="mt-2 font-display text-xs uppercase tracking-[0.24em] text-muted-foreground">
          {month} {year}
        </span>
      </div>
      {children}
    </div>
  );
}
