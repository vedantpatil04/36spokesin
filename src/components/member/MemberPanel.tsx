import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bordered block used across My 36 Spokes. */
export function MemberPanel({
  title,
  children,
  className,
  action,
  headingLevel = "h2",
}: {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <section className={cn("rounded-sm border border-border bg-card p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <Heading className="text-lg">{title}</Heading>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Sub-page heading inside the member shell (the shell owns the h1). */
export function MemberPageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
