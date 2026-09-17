import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/** Shown instead of a blank area when a list has nothing in it. Always suggests a next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  headingLevel = "h3",
}: {
  icon?: IconType | undefined;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  className?: string | undefined;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-sm border border-dashed border-border-strong bg-card/40 p-6 md:p-8",
        className,
      )}
    >
      {Icon ? <Icon className="size-5 text-primary" aria-hidden /> : null}
      <Heading className={cn("text-xl", Icon && "mt-4")}>{title}</Heading>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}
