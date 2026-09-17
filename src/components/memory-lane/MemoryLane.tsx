import { Media } from "@/components/ui-kit";
import type { Memory } from "@/types";
import { formatYearMonth, yearOf } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Roadside milestone marker, modelled on Indian highway kilometre stones:
 * a coloured cap (the year) over a white body (the place).
 */
export function MilestoneMarker({
  date,
  place,
  size = "md",
  className,
}: {
  /** YYYY-MM */
  date: string;
  place: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const large = size === "lg";
  return (
    <span
      className={cn(
        "inline-flex flex-col overflow-hidden rounded-t-full text-center shadow-card ring-1 ring-black/25",
        large ? "w-20" : "w-14",
        className,
      )}
    >
      <time
        dateTime={date}
        className={cn(
          "flex items-end justify-center bg-primary font-display font-semibold leading-none text-primary-foreground",
          large ? "h-11 pb-1 text-lg" : "h-8 pb-0.5 text-[0.8rem]",
        )}
      >
        {yearOf(date)}
      </time>
      <span
        className={cn(
          "bg-foreground font-display uppercase leading-none text-background",
          large
            ? "px-1.5 pb-2 pt-1.5 text-[0.7rem] tracking-[0.12em]"
            : "px-1 pb-1.5 pt-1 text-[0.55rem] tracking-[0.1em]",
        )}
      >
        {place}
      </span>
    </span>
  );
}

/** The lead memory, presented as a large editorial image. */
export function FeaturedMemory({ memory }: { memory: Memory }) {
  return (
    <article className="overflow-hidden rounded-sm border border-border">
      <Media
        asset={memory.image}
        ratio="auto"
        className="h-[28rem] sm:h-[34rem] lg:h-full lg:min-h-[38rem]"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background from-15% via-background/60 via-55% to-background/0 md:from-5% md:via-background/40 md:via-45%" />
        <MilestoneMarker
          date={memory.date}
          place={memory.marker}
          size="lg"
          className="absolute left-5 top-5 md:left-7 md:top-7"
        />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <p className="text-sm text-foreground/75">
            {memory.location}, {formatYearMonth(memory.date)}
          </p>
          <h3 className="mt-2 max-w-lg text-3xl leading-[1.02] md:text-4xl">{memory.title}</h3>
          <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/85">
            {memory.caption}
          </p>
        </div>
      </Media>
    </article>
  );
}

/** One stop on the lane. Rendered inside the ordered list in `MemoryLane`. */
export function MemoryLaneItem({ memory }: { memory: Memory }) {
  return (
    <li className="relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 pb-8 last:pb-0 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-6">
      <div className="flex justify-center">
        <MilestoneMarker date={memory.date} place={memory.marker} />
      </div>
      <article className="flex min-w-0 gap-4 sm:gap-5">
        <Media
          asset={memory.image}
          ratio="4/3"
          className="w-20 shrink-0 self-start rounded-sm border border-border sm:w-36"
        />
        <div className="min-w-0">
          <h3 className="text-lg leading-tight sm:text-xl">{memory.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {memory.location}, {formatYearMonth(memory.date)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{memory.caption}</p>
        </div>
      </article>
    </li>
  );
}

/**
 * Featured memory beside a lane of earlier moments, newest first, so the
 * reader walks back down the road.
 */
export function MemoryLane({ memories }: { memories: Memory[] }) {
  const [featured, ...earlier] = memories;
  if (!featured) return null;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
      <FeaturedMemory memory={featured} />
      {earlier.length > 0 ? (
        <ol
          aria-label="Earlier memories"
          className={cn(
            "relative self-center",
            // Dashed road centre-line running behind the milestones.
            "before:absolute before:bottom-6 before:top-3 before:left-[calc(1.75rem-1px)] before:w-0.5 sm:before:left-[calc(2rem-1px)]",
            "before:bg-[repeating-linear-gradient(to_bottom,var(--color-border-strong)_0_12px,transparent_12px_22px)]",
          )}
        >
          {earlier.map((memory) => (
            <MemoryLaneItem key={memory.id} memory={memory} />
          ))}
        </ol>
      ) : null}
    </div>
  );
}
