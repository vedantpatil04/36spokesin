/**
 * The booking ID riders and the crew quote, e.g. "36S-000042". Derived from the
 * booking number, so it never needs storing and can't drift from it.
 */
export function bookingReference(number: number): string {
  return `36S-${String(number).padStart(6, "0")}`;
}
