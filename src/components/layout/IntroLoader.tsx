import { useEffect, useState } from "react";
import { BrandCrest, BrandWordmark } from "@/components/ui-kit";

/** Long enough for the mark, wordmark and accent to settle (see `.intro-loader` in styles.css). */
const MIN_VISIBLE_MS = 700;
/** The fade-out. Matches the `.intro-loader` opacity transition. */
const EXIT_MS = 320;

/** Set once the intro has lifted, so it never replays while this page stays loaded. */
let played = false;

/**
 * When the intro came on screen, in ms since the page load began: the first
 * paint, or (in a tab that hasn't painted yet) when the page started arriving.
 */
function shownSince(): number {
  const paint = performance.getEntriesByName("first-contentful-paint")[0];
  if (paint) return paint.startTime;
  const [navigation] = performance.getEntriesByType("navigation");
  return navigation ? (navigation as PerformanceNavigationTiming).responseStart : 0;
}

/**
 * The 36 Spokes intro: the crest inside a ring of 36 spokes that turns into
 * place, the wordmark, an accent line, then the site.
 *
 * It is part of the server-rendered shell, so it is on screen from the first
 * paint of a full page load, and it lifts when the app has hydrated (the page
 * under it is already rendered). It waits for nothing else: no data, no images.
 * In-app navigation never shows it again. If scripts are slow or fail, the CSS
 * lifts it by itself, so it can't stay up.
 */
export function IntroLoader() {
  const [phase, setPhase] = useState<"playing" | "leaving" | "done">(() =>
    played ? "done" : "playing",
  );

  useEffect(() => {
    if (phase === "done") return;
    if (phase === "leaving") {
      played = true;
      const timer = window.setTimeout(() => setPhase("done"), EXIT_MS);
      return () => window.clearTimeout(timer);
    }
    // Only what's left of the intro's own run: an app that took longer than that
    // to start has already used the time, and nothing is added.
    const remaining = Math.max(0, shownSince() + MIN_VISIBLE_MS - performance.now());
    const timer = window.setTimeout(() => setPhase("leaving"), remaining);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div className="intro-loader" data-leaving={phase === "leaving" ? "" : undefined} aria-hidden>
      <div className="intro-loader__lockup">
        <div className="intro-loader__mark">
          <svg viewBox="0 0 104 104" fill="none" className="intro-loader__spokes">
            {/* 36 spokes: one circle, dashed into 36 ticks. */}
            <circle
              cx="52"
              cy="52"
              r="48"
              pathLength="360"
              strokeWidth="5"
              strokeDasharray="1.4 8.6"
              className="stroke-border-strong"
            />
            {/* The one lit spoke, which comes to rest at the top. */}
            <circle
              cx="52"
              cy="52"
              r="48"
              pathLength="360"
              strokeWidth="5"
              strokeDasharray="1.4 358.6"
              transform="rotate(-90 52 52)"
              className="stroke-primary"
            />
          </svg>
          <BrandCrest
            loading="eager"
            className="size-[4.75rem] ring-1 ring-border/80 lg:size-[5.875rem]"
          />
        </div>
        <BrandWordmark className="intro-loader__wordmark font-display text-xl tracking-[0.3em] text-foreground lg:text-2xl" />
        <span className="intro-loader__accent" />
      </div>
    </div>
  );
}
