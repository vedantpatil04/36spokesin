import { ExternalLink, Instagram } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { processInstagramEmbeds } from "./instagram-script";

interface InstagramEmbedProps {
  postUrl: string;
  mediaType?: "IMAGE" | "VIDEO";
  caption?: string | null;
  className?: string;
}

export function InstagramEmbed({ postUrl, mediaType, caption, className }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isReel =
    mediaType === "VIDEO" ||
    postUrl.toLowerCase().includes("/reel/") ||
    postUrl.toLowerCase().includes("/reels/");

  useEffect(() => {
    let isMounted = true;
    setIsRendered(false);
    setHasError(false);

    const container = containerRef.current;
    if (!container) return;

    // Observe changes inside the container for Instagram's injected iframe
    const observer = new MutationObserver(() => {
      if (!isMounted) return;
      const iframe = container.querySelector("iframe");
      const blockquote = container.querySelector("blockquote");
      const isInstagramRendered =
        Boolean(iframe) ||
        blockquote?.classList.contains("instagram-media-rendered") ||
        blockquote?.hasAttribute("data-instgrm-rendered");

      if (isInstagramRendered) {
        setIsRendered(true);
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-instgrm-rendered"],
    });

    // Request embed processing
    processInstagramEmbeds(container);

    // Set fallback timeout in case Instagram fails to load or refuses the post
    const timer = setTimeout(() => {
      if (!isMounted) return;
      const iframe = container.querySelector("iframe");
      const blockquote = container.querySelector("blockquote");
      const rendered =
        Boolean(iframe) ||
        blockquote?.classList.contains("instagram-media-rendered") ||
        blockquote?.hasAttribute("data-instgrm-rendered");

      if (!rendered) {
        setHasError(true);
      }
    }, 7000);

    return () => {
      isMounted = false;
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [postUrl]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto flex w-full max-w-[540px] flex-col items-center justify-start overflow-hidden rounded-lg transition-all duration-300",
        className,
      )}
    >
      {/* Loading Skeleton Placeholder before Instagram iframe finishes mounting */}
      {!isRendered && !hasError && (
        <div
          className="flex min-h-[460px] w-full flex-col items-center justify-center rounded-lg border border-border/60 bg-surface/80 p-6 text-center shadow-sm backdrop-blur-xs"
          aria-busy="true"
          aria-label="Loading Instagram post"
        >
          <div className="relative mb-4 flex size-14 items-center justify-center rounded-full bg-surface-2 text-primary">
            <Instagram className="size-7 animate-pulse" aria-hidden />
          </div>
          <p className="font-display text-xs uppercase tracking-[0.2em] text-foreground">
            Instagram {isReel ? "Reel" : "Post"}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">Loading official embed…</p>
          <div className="mt-6 flex w-3/4 flex-col gap-2">
            <div className="h-2 w-full animate-pulse rounded-full bg-border/60" />
            <div className="h-2 w-2/3 self-center animate-pulse rounded-full bg-border/40" />
          </div>
        </div>
      )}

      {/* Official Instagram Embed Markup (hidden visually while loading to prevent unstyled flash) */}
      <div
        className={cn(
          "w-full transition-opacity duration-500",
          isRendered && !hasError ? "block opacity-100" : "hidden opacity-0",
        )}
      >
        <blockquote
          className="instagram-media"
          data-instgrm-captioned
          data-instgrm-permalink={postUrl}
          data-instgrm-version="14"
          style={{
            background: "transparent",
            border: 0,
            borderRadius: "8px",
            boxShadow: "none",
            margin: "0 auto",
            maxWidth: "540px",
            minWidth: "280px",
            padding: 0,
            width: "100%",
          }}
        >
          <div style={{ padding: "16px", textAlign: "center" }}>
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View this post on Instagram
            </a>
          </div>
        </blockquote>
      </div>

      {/* Graceful Fallback Card when Instagram refuses embed or network/embed fails */}
      {hasError && (
        <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-6 text-center shadow-card">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-border/80 bg-surface text-primary shadow-xs">
            <Instagram className="size-7" aria-hidden />
          </div>
          <span className="font-display text-[0.68rem] uppercase tracking-[0.24em] text-primary">
            Instagram {isReel ? "Reel" : "Post"}
          </span>
          <h4 className="mt-2 text-base font-medium text-foreground">
            {caption || "Follow The Ride on Instagram"}
          </h4>
          <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
            This post cannot be embedded directly. View it on Instagram to see full video and
            interactions.
          </p>

          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-5 py-2.5 font-display text-xs uppercase tracking-wider text-primary transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span>View this post on Instagram</span>
            <span aria-hidden>→</span>
          </a>
        </div>
      )}
    </div>
  );
}
