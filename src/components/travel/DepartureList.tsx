import { Badge, ButtonLink } from "@/components/ui-kit";
import { formatDateRange } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import type { Departure, DepartureStatus } from "@/types";

const statusLabel: Record<DepartureStatus, string> = {
  open: "Open",
  filling: "Filling fast",
  full: "Full",
  closed: "Closed",
};

export function DepartureList({ departures }: { departures: Departure[] }) {
  return (
    <ul className="divide-y divide-border rounded-sm border border-border bg-card">
      {departures.map((departure) => (
        <li
          key={departure.id}
          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-display text-lg uppercase">
              <time dateTime={departure.startDate}>
                {formatDateRange(departure.startDate, departure.endDate)}
              </time>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatINR(departure.price)} per rider <span aria-hidden>·</span>{" "}
              {departure.seatsLeft} of {departure.seatsTotal} seats left
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={departure.status === "filling" ? "warning" : "neutral"}>
              {statusLabel[departure.status]}
            </Badge>
            <ButtonLink to="/join" size="sm">
              Reserve a seat
            </ButtonLink>
          </div>
        </li>
      ))}
    </ul>
  );
}
