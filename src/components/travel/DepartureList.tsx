import { Badge, ButtonLink } from "@/components/ui-kit";
import { formatDateRange } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import type { Departure, DepartureStatus } from "@/types";

const statusLabel: Record<DepartureStatus, string> = {
  open: "Open",
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
              {departure.price !== null
                ? `${formatINR(departure.price)} per rider`
                : "Price on request"}{" "}
              <span aria-hidden>·</span> {departure.seatsTotal} seats
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={departure.status === "open" ? "neutral" : "warning"}>
              {statusLabel[departure.status]}
            </Badge>
            {departure.status === "open" ? (
              <ButtonLink to="/join" size="sm">
                Reserve a seat
              </ButtonLink>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
