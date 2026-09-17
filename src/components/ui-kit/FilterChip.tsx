import { createLink } from "@tanstack/react-router";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const chipClasses = (active: boolean) =>
  cn(
    "inline-flex h-10 shrink-0 items-center rounded-full border px-4 font-display text-xs uppercase tracking-[0.16em] transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border text-muted-foreground hover:text-foreground",
  );

/** Scrollable row of filter chips. */
export function FilterChipRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <nav
      aria-label={label}
      className={cn("no-scrollbar flex gap-2 overflow-x-auto pb-1", className)}
    >
      {children}
    </nav>
  );
}

const ChipAnchor = forwardRef<HTMLAnchorElement, ComponentProps<"a"> & { active: boolean }>(
  function ChipAnchor({ active, className, ...props }, ref) {
    return <a ref={ref} className={cn(chipClasses(active), className)} {...props} />;
  },
);

/** A filter chip that navigates. Spread `filterLinkBehavior` onto it. */
export const FilterChipLink = createLink(ChipAnchor);
