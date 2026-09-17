import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { useEffect } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { cn } from "@/lib/utils";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";
const secondaryButton =
  "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent";

/**
 * Inline, recovery-oriented error. Used for sections and for route errors below
 * the root, so the navbar and footer stay usable.
 */
export function ErrorState({
  title = "This section didn't load",
  description = "Check your connection and try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("rounded-sm border border-destructive/50 bg-card/40 p-6 md:p-8", className)}
    >
      <CircleAlert className="size-5 text-destructive" aria-hidden />
      <h2 className="mt-4 text-xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {onRetry ? (
          <button type="button" onClick={onRetry} className={primaryButton}>
            Try again
          </button>
        ) : null}
        <Link to="/" className={secondaryButton}>
          Go home
        </Link>
      </div>
    </div>
  );
}

function useReportedError(error: unknown, boundary: string) {
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary });
  }, [error, boundary]);
}

/** Default errorComponent for routes: keeps the site shell, offers a retry. */
export function RouteErrorState({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useReportedError(error, "tanstack_route_error_component");
  return (
    <div className="container-page py-16 md:py-24">
      <ErrorState
        title="This page didn't load"
        description="Something went wrong while loading this page. Try again, or head back home."
        onRetry={() => {
          void router.invalidate();
          reset();
        }}
      />
    </div>
  );
}

/** Root errorComponent: full-screen fallback when the app shell itself fails. */
export function AppErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useReportedError(error, "tanstack_root_error_component");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className={primaryButton}
          >
            Try again
          </button>
          <a href="/" className={secondaryButton}>
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
