/** Non-component helpers shared by the admin CMS screens. */

import { ApiError } from "@/lib/api";

/** aria props linking a control to its Field hint or error. */
export function describedBy(id: string, error: string | undefined, hint?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export const tableClasses = {
  wrapper: "overflow-x-auto rounded-sm border border-border",
  table: "w-full min-w-[48rem] border-collapse text-left text-sm",
  head: "bg-surface text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground",
  th: "px-3 py-3 font-normal",
  row: "border-t border-border align-middle hover:bg-surface/60",
  td: "px-3 py-3",
};

export const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** API field errors ("capacity", "departures.2.endDate") keyed by field. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  return Object.fromEntries(
    error.details.map((detail) => [detail.field, detail.messages.join(" ")]),
  );
}

/** "" → null for optional text fields. */
export const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

/** Optional whole number from a text input: "" → null, invalid → NaN. */
export function optionalInt(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

const istParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** ISO instant → { date: "2026-10-04", time: "06:00" } in India time, for date/time inputs. */
export function toIstInputs(iso: string): { date: string; time: string } {
  const parts = Object.fromEntries(
    istParts.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts["year"]}-${parts["month"]}-${parts["day"]}`,
    time: `${parts["hour"]}:${parts["minute"]}`,
  };
}

/** India-time date and time inputs → ISO 8601 with the +05:30 offset. */
export const fromIstInputs = (date: string, time: string) => `${date}T${time}:00+05:30`;
