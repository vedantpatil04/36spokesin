/**
 * Display formatters. Deterministic across server and client so SSR output
 * hydrates without mismatches.
 */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 34900 → "₹34,900" */
export const formatINR = (value: number) => inr.format(value);

/** 1820 → "1,820" (Indian digit grouping) */
export const formatNumber = (value: number) => value.toLocaleString("en-IN");

/** 1820 → "1,820 km" */
export const formatKm = (value: number) => `${formatNumber(value)} km`;

/** Picks the singular or plural label: (1, "day") → "1 day", (3, "day") → "3 days". */
export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;
