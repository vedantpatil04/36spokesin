import { ArrowLeft, ArrowRight, MapPin, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandCrest, ButtonLink } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/types";

export function CinematicHero({ slides }: { slides: HeroSlide[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [videoError, setVideoError] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  // Responsive mobile media query listener
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 768px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const total = slides?.length ?? 0;
  const currentSlide = total > 0 ? slides[currentIndex] || slides[0] : null;

  // Compute slide-specific duration and mode
  const currentDurationSeconds = currentSlide?.durationSeconds ?? 5;
  const currentDurationMs = Math.max(1000, currentDurationSeconds * 1000);

  const isCurrentVideo =
    currentSlide?.mediaType === "VIDEO" &&
    Boolean(isMobile ? currentSlide.mobileUrl || currentSlide.videoUrl : currentSlide.videoUrl) &&
    !videoError[currentSlide.id];

  const isVideoEndMode = Boolean(isCurrentVideo && currentSlide?.autoAdvanceMode === "VIDEO_END");

  const resetTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setProgress(0);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (total <= 0) return;
      setCurrentIndex((index + total) % total);
      resetTimer();
    },
    [total, resetTimer],
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [goToSlide, currentIndex]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [goToSlide, currentIndex]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const nextState = !prev;
      if (nextState) {
        // Resuming
        startTimeRef.current = Date.now() - (progress / 100) * currentDurationMs;
        activeVideoRef.current?.play().catch(() => {});
      } else {
        // Pausing
        activeVideoRef.current?.pause();
      }
      return nextState;
    });
  }, [currentDurationMs, progress]);

  // Main progress and auto-advance driver
  useEffect(() => {
    if (!isPlaying || prefersReducedMotion || total <= 1 || !currentSlide) {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      return;
    }

    // When in VIDEO_END mode, the video's onTimeUpdate and onEnded events drive progress.
    // However, we run a safety watchdog ticker in case the video takes time to buffer or stalls.
    if (isVideoEndMode) {
      const maxWatchdogMs = Math.max(currentDurationMs, 45000); // 45s safety limit
      const tickWatchdog = () => {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= maxWatchdogMs) {
          nextSlide();
        } else {
          timerRef.current = requestAnimationFrame(tickWatchdog);
        }
      };
      timerRef.current = requestAnimationFrame(tickWatchdog);
      return () => {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
      };
    }

    // FIXED_DURATION mode (for IMAGE slides or FIXED_DURATION video slides)
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / currentDurationMs) * 100, 100);
      setProgress(pct);

      if (elapsed >= currentDurationMs) {
        nextSlide();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [
    isPlaying,
    currentIndex,
    nextSlide,
    prefersReducedMotion,
    total,
    currentDurationMs,
    isVideoEndMode,
    currentSlide,
  ]);

  // Play/pause the active slide video on change
  useEffect(() => {
    if (!activeVideoRef.current) return;
    if (isPlaying) {
      activeVideoRef.current.play().catch(() => {});
    } else {
      activeVideoRef.current.pause();
    }
  }, [currentIndex, isPlaying]);

  // Keyboard navigation: Left/Right arrows, Space for pause/play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === " " && containerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide, togglePlay]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  // Static fallback Hero if no published slides exist
  if (!slides || slides.length === 0 || !currentSlide) {
    return (
      <section
        aria-label="36 Spokes Motorcycle Culture"
        className="relative h-[82svh] min-h-[540px] w-full overflow-hidden bg-background lg:h-[90svh]"
      >
        <div className="absolute inset-0 size-full">
          <img
            src="/brand-logo.jpg"
            alt="36 Spokes Motorcycle Culture"
            className="size-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent sm:from-background sm:via-background/70 sm:to-transparent" />
          <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        </div>
        <div className="relative z-20 flex h-full items-end pb-6 sm:pb-16 lg:pb-20">
          <div className="container-page w-full">
            <div className="max-w-3xl">
              <div className="mb-2 sm:mb-4 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/80 bg-background/80 px-2.5 py-0.5 sm:px-3.5 sm:py-1.5 backdrop-blur-md">
                <BrandCrest className="size-3.5 sm:size-4.5 ring-1 ring-primary/40" />
                <span className="font-display text-[10px] uppercase tracking-[0.2em] text-foreground/90 sm:text-xs sm:tracking-[0.22em]">
                  Official 36 Spokes Network
                </span>
              </div>
              <h1 className="font-display text-[26px] font-bold uppercase leading-[1.02] tracking-[-0.025em] text-foreground max-w-[94%] sm:max-w-none sm:text-6xl sm:leading-[0.95] sm:font-semibold sm:tracking-tight md:text-7xl">
                The road starts where the map runs out
              </h1>
              <p className="mt-2 sm:mt-4 max-w-xl text-[12px] leading-[1.45] text-muted-foreground/90 sm:text-lg sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                Expeditions across the Himalaya, gear matched to the motorcycle in your garage, and
                riders who turn up when you post a route.
              </p>
              <div className="mt-3.5 sm:mt-8 flex flex-wrap gap-2.5 sm:gap-4">
                <ButtonLink
                  to="/rides"
                  size="lg"
                  className="h-10 px-4.5 text-xs sm:h-13 sm:px-7 sm:text-sm"
                >
                  Explore Rides
                </ButtonLink>
                <ButtonLink
                  to="/plan"
                  variant="outline"
                  size="lg"
                  className="h-10 px-4.5 text-xs sm:h-13 sm:px-7 sm:text-sm"
                >
                  Plan Journey
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      aria-label="Featured 36 Spokes Hero Carousel"
      className="group relative h-[82svh] min-h-[540px] w-full overflow-hidden bg-background lg:h-[90svh]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      onMouseEnter={() => {
        if (isPlaying && timerRef.current) cancelAnimationFrame(timerRef.current);
      }}
      onMouseLeave={() => {
        if (isPlaying) {
          startTimeRef.current = Date.now() - (progress / 100) * currentDurationMs;
        }
      }}
    >
      {/* BACKGROUND MEDIA SLIDES */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        const isNear =
          Math.abs(idx - currentIndex) <= 1 || (idx === 0 && currentIndex === total - 1);

        // Select responsive media
        const activeVideoUrl = isMobile && slide.mobileUrl ? slide.mobileUrl : slide.videoUrl;
        const activeImageUrl =
          isMobile && slide.mobileUrl
            ? slide.mobileUrl
            : slide.imageUrl || slide.image?.src || "/brand-logo.jpg";
        const posterSource =
          slide.posterUrl || slide.imageUrl || slide.image?.src || "/brand-logo.jpg";

        const hasVideo =
          slide.mediaType === "VIDEO" && Boolean(activeVideoUrl) && !videoError[slide.id];

        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 size-full transition-opacity duration-1000 ease-in-out",
              isActive ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none",
            )}
          >
            {hasVideo ? (
              <video
                ref={
                  isActive
                    ? (el) => {
                        activeVideoRef.current = el;
                      }
                    : undefined
                }
                src={isNear ? activeVideoUrl || undefined : undefined}
                poster={posterSource}
                autoPlay={isActive}
                muted
                playsInline
                loop={slide.autoAdvanceMode !== "VIDEO_END"}
                preload={isActive ? "auto" : "none"}
                onEnded={() => {
                  if (isActive && isPlaying && slide.autoAdvanceMode === "VIDEO_END") {
                    nextSlide();
                  }
                }}
                onTimeUpdate={(e) => {
                  if (isActive && isPlaying && slide.autoAdvanceMode === "VIDEO_END") {
                    const v = e.currentTarget;
                    if (v.duration && isFinite(v.duration) && v.duration > 0) {
                      setProgress((v.currentTime / v.duration) * 100);
                    }
                  }
                }}
                onError={() => {
                  setVideoError((prev) => ({ ...prev, [slide.id]: true }));
                }}
                className="size-full object-cover"
                aria-label={slide.title}
              />
            ) : (
              <img
                src={activeImageUrl}
                alt={slide.title}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                className={cn(
                  "size-full object-cover transition-transform duration-10000 ease-out",
                  isActive && !prefersReducedMotion ? "scale-105" : "scale-100",
                )}
              />
            )}

            {/* CINEMATIC EDITORIAL GRADIENTS */}
            {/* On mobile: subtle upward gradient focused at the bottom to protect text readability while leaving the top 60% of video bright and clear */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent sm:from-background sm:via-background/60 sm:to-transparent" />
            {/* Horizontal gradient: desktop only (on mobile, a horizontal gradient covers the whole screen and darkens the central video subject) */}
            <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />
            {/* Radial vignette: desktop only */}
            <div className="hidden sm:block absolute inset-0 bg-radial from-transparent via-background/20 to-background/70 pointer-events-none" />
          </div>
        );
      })}

      {/* FOREGROUND EDITORIAL CONTENT */}
      <div className="relative z-20 flex h-full items-end pb-6 sm:pb-16 lg:pb-20">
        <div className="container-page w-full">
          <div key={currentSlide.id} className="max-w-3xl">
            {/* EYEBROW & LOCATION PILL — Reveals at 0ms */}
            <div className="hero-animate-eyebrow mb-2 flex flex-wrap items-center gap-2 sm:mb-5 sm:gap-2.5">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/80 bg-background/80 px-2.5 py-0.5 sm:px-3.5 sm:py-1.5 backdrop-blur-md shadow-xs">
                <BrandCrest className="size-3.5 ring-1 ring-primary/40 sm:size-4.5" />
                <span className="font-display text-[10px] uppercase tracking-[0.2em] text-foreground/90 sm:text-xs sm:tracking-[0.22em]">
                  {currentSlide.eyebrow || "36 Spokes Lifestyle Ecosystem"}
                </span>
              </div>

              {currentSlide.location ? (
                <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-surface/70 px-2.5 py-0.5 font-display text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md sm:inline-flex sm:px-3 sm:py-1 sm:text-[0.7rem]">
                  <MapPin className="size-3 text-primary" aria-hidden />
                  <span>{currentSlide.location}</span>
                </div>
              ) : null}
            </div>

            {/* HEADLINE — Reveals at 100ms with smooth upward motion */}
            <h1 className="hero-animate-headline font-display text-[26px] font-bold uppercase leading-[1.02] tracking-[-0.025em] text-foreground max-w-[94%] sm:max-w-none sm:text-6xl sm:leading-[0.95] sm:font-semibold sm:tracking-tight md:text-7xl lg:text-7xl">
              {currentSlide.title}
            </h1>

            {/* DESCRIPTION — Reveals at 200ms just after headline */}
            {currentSlide.description ? (
              <p className="hero-animate-desc mt-2 sm:mt-5 max-w-xl text-[12px] sm:text-lg leading-[1.45] sm:leading-relaxed text-muted-foreground/90 sm:text-muted-foreground line-clamp-2 sm:line-clamp-none">
                {currentSlide.description}
              </p>
            ) : null}

            {/* CTA ACTION BUTTONS — Reveals at 300ms last in sequence */}
            <div className="hero-animate-cta mt-3.5 flex flex-wrap items-center gap-2.5 sm:mt-8 sm:gap-4">
              {currentSlide.ctaUrl && currentSlide.ctaLabel ? (
                <ButtonLink
                  to={currentSlide.ctaUrl.startsWith("#") ? "/" : currentSlide.ctaUrl}
                  hash={
                    currentSlide.ctaUrl.startsWith("#") ? currentSlide.ctaUrl.slice(1) : undefined
                  }
                  size="lg"
                  className="h-10 px-4.5 text-xs sm:h-13 sm:px-7 sm:text-sm shadow-lift"
                >
                  {currentSlide.ctaLabel}
                  <ArrowRight className="size-3.5 sm:size-4" aria-hidden />
                </ButtonLink>
              ) : null}

              {currentSlide.secondaryCtaUrl && currentSlide.secondaryCtaLabel ? (
                <ButtonLink
                  to={currentSlide.secondaryCtaUrl}
                  variant="outline"
                  size="lg"
                  className="h-10 px-4.5 text-xs sm:h-13 sm:px-7 sm:text-sm border-border/90 bg-background/50 backdrop-blur-sm hover:bg-surface"
                >
                  {currentSlide.secondaryCtaLabel}
                </ButtonLink>
              ) : null}
            </div>
          </div>

          {/* CAROUSEL CONTROLS & VARIABLE DURATION PROGRESS INDICATOR */}
          <div className="mt-5 sm:mt-12 flex flex-col gap-3 sm:gap-4 border-t border-border/50 sm:border-border/60 pt-3 sm:pt-5 sm:flex-row sm:items-center sm:justify-between">
            {/* PROGRESS INDICATOR */}
            <div
              className="flex flex-1 items-center gap-3 max-w-lg"
              role="tablist"
              aria-label="Hero slide progression"
            >
              {slides.map((slide, idx) => {
                const isActive = idx === currentIndex;
                const isPassed = idx < currentIndex;
                const slideDuration = slide.durationSeconds ?? 5;
                const isSlideVideoEnd =
                  slide.mediaType === "VIDEO" && slide.autoAdvanceMode === "VIDEO_END";

                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Slide ${idx + 1}: ${slide.title} (${isSlideVideoEnd ? "Video" : `${slideDuration}s`})`}
                    className={cn(
                      "group/pill relative flex flex-1 flex-col gap-1.5 cursor-pointer text-left transition-all",
                      isActive ? "opacity-100" : "opacity-45 hover:opacity-80",
                    )}
                  >
                    <div className="flex items-center justify-between font-mono text-[9.5px] tracking-wider text-muted-foreground sm:text-[0.68rem]">
                      <span
                        className={cn(
                          "transition-colors",
                          isActive ? "text-primary font-bold" : "",
                        )}
                      >
                        0{idx + 1}
                      </span>
                      <span className="hidden text-[0.62rem] text-muted-foreground/80 sm:inline-block">
                        {isSlideVideoEnd ? "VIDEO" : `${slideDuration}s`}
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-2/80">
                      <div
                        className={cn(
                          "h-full rounded-full bg-primary transition-all ease-linear",
                          isActive
                            ? "duration-75"
                            : isPassed
                              ? "w-full opacity-60"
                              : "w-0 opacity-0",
                        )}
                        style={isActive ? { width: `${progress}%` } : undefined}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ARROWS & PAUSE/PLAY TOGGLE */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="font-display text-[9.5px] tracking-[0.2em] text-muted-foreground mr-2 font-mono sm:text-xs">
                0{currentIndex + 1} / 0{total}
              </span>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause auto-advance" : "Resume auto-advance"}
                className="flex size-8 sm:size-9 items-center justify-center rounded-sm border border-border/80 bg-surface/60 text-muted-foreground backdrop-blur-md transition-colors hover:border-primary hover:text-foreground"
              >
                {isPlaying ? (
                  <Pause className="size-3 sm:size-3.5" aria-hidden />
                ) : (
                  <Play className="size-3 sm:size-3.5" aria-hidden />
                )}
              </button>

              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous slide"
                className="flex size-8 sm:size-9 items-center justify-center rounded-sm border border-border/80 bg-surface/60 text-muted-foreground backdrop-blur-md transition-colors hover:border-primary hover:text-foreground"
              >
                <ArrowLeft className="size-3.5 sm:size-4" aria-hidden />
              </button>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next slide"
                className="flex size-8 sm:size-9 items-center justify-center rounded-sm border border-border/80 bg-surface/60 text-muted-foreground backdrop-blur-md transition-colors hover:border-primary hover:text-foreground"
              >
                <ArrowRight className="size-3.5 sm:size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
