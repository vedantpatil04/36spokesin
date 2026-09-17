import { useId } from "react";
import { Badge } from "@/components/ui-kit";
import { useSelectBike, useSelectedBikeId } from "@/state/garage";
import type { Bike } from "@/types";

/** "Shop for" selector. Writes the shared selected bike, so Garage and Shop stay in step. */
export function BikeFitmentBar({ bikes }: { bikes: Bike[] }) {
  const selectId = useId();
  const selectedBikeId = useSelectedBikeId();
  const selectBike = useSelectBike();
  const bike = bikes.find((entry) => entry.id === selectedBikeId) ?? bikes[0];

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
      <label
        htmlFor={selectId}
        className="flex flex-col gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground md:flex-row md:items-center md:gap-3"
      >
        Shop for
        <select
          id={selectId}
          value={bike?.id ?? ""}
          onChange={(event) => selectBike(event.target.value)}
          className="h-11 rounded-sm border border-input bg-background px-3 font-display text-sm uppercase tracking-[0.1em] text-foreground [color-scheme:dark]"
        >
          {bikes.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.brand} {entry.model}
            </option>
          ))}
        </select>
      </label>
      {bike ? (
        <Badge tone="success">
          <span>
            <span aria-hidden>✓ </span>Fitment shown for {bike.model}
          </span>
        </Badge>
      ) : null}
    </div>
  );
}
