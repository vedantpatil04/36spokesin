export const MAIN_CONTENT_ID = "main-content";

/** First focusable element on every page. Visible only when focused. */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2.5 focus:font-display focus:text-xs focus:uppercase focus:tracking-[0.16em] focus:text-primary-foreground"
    >
      Skip to content
    </a>
  );
}
