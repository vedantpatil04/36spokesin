import { Check, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui-kit";
import type { SetupCheckItem } from "@/types";

/**
 * Trip-ready check. `detailed` shows each note with icon status (Garage page);
 * `compact` shows labels with status badges (dashboard cards).
 */
export function SetupChecklist({
  items,
  variant = "detailed",
}: {
  items: SetupCheckItem[];
  variant?: "detailed" | "compact";
}) {
  if (variant === "compact") {
    return (
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span>{item.label}</span>
            {item.status === "ready" ? (
              <Badge tone="success">Ready</Badge>
            ) : (
              <Badge tone="warning">Missing</Badge>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-border">
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-4 py-3.5">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.14em]">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.note}</p>
          </div>
          {item.status === "ready" ? (
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-success">
              <Check className="size-4" aria-hidden /> Ready
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-warning">
              <TriangleAlert className="size-4" aria-hidden /> Missing
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
