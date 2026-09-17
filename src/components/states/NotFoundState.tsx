import { Link } from "@tanstack/react-router";
import { ButtonLink } from "@/components/ui-kit";

/** Site-wide 404, rendered inside the shell. */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

/** 404 for a missing entity (bike, product, trip…), pointing back to its listing. */
export function EntityNotFound({
  entity,
  backTo,
  backLabel,
}: {
  /** Lower-case noun, e.g. "trip". */
  entity: string;
  /** The listing that contains this kind of entity. */
  backTo: "/garage" | "/shop" | "/travel/destinations" | "/travel/trips" | "/rides" | "/stories";
  backLabel: string;
}) {
  return (
    <div className="container-page py-20 md:py-28">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-4 max-w-2xl text-4xl leading-[1.02] sm:text-5xl">
        We couldn't find that {entity}
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
        The link may be old, or the {entity} may have been removed.
      </p>
      <ButtonLink to={backTo} variant="outline" className="mt-8">
        {backLabel}
      </ButtonLink>
    </div>
  );
}
