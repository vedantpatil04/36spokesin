import { useQuery } from "@tanstack/react-query";
import { Badge, type BadgeTone } from "@/components/ui-kit";
import type { ApiAdminRide, ApiAdminRideBooking } from "@/lib/api";
import { listRideBookings } from "@/services/admin/travel";
import { describeError } from "@/services/request-helpers";
import { dateTime, tableClasses } from "../admin-format";
import { AdminPanel, InlineError } from "../admin-ui";

function bookingLabel(booking: ApiAdminRideBooking): string {
  if (booking.status === "REGISTERED") return "Confirmed";
  if (booking.status === "CANCELLED") return "Cancelled";
  if (booking.paymentStatus === "PROOF_SUBMITTED") return "Payment under review";
  return booking.paymentStatus === "REJECTED" ? "Payment rejected" : "Payment required";
}

function bookingTone(booking: ApiAdminRideBooking): BadgeTone {
  if (booking.status === "REGISTERED") return "success";
  return booking.paymentStatus === "PROOF_SUBMITTED" && booking.status !== "CANCELLED"
    ? "primary"
    : "warning";
}

/** Who is booked on a ride: what the crew needs to run it, read from the booking records. */
export function RideBookingsPanel({ ride }: { ride: ApiAdminRide }) {
  const bookings = useQuery({
    queryKey: ["admin", "ride", ride.id, "bookings"],
    queryFn: () => listRideBookings(ride.id),
  });
  const seats = bookings.data?.reduce((sum, booking) => sum + booking.seats, 0);

  return (
    <AdminPanel
      id="ride-bookings"
      title="Bookings"
      description={
        seats === undefined
          ? "Riders booked on this ride."
          : `${seats} of ${ride.capacity} seats taken, including seats held for payment. Cancelled bookings are kept and hold no seat.`
      }
    >
      {bookings.isPending ? (
        <p className="text-sm text-muted-foreground">Loading bookings…</p>
      ) : bookings.isError ? (
        <InlineError message={describeError(bookings.error)} />
      ) : bookings.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
      ) : (
        <>
          {/* Mobile Stacked Bookings Cards (< md) */}
          <div className="space-y-3 md:hidden">
            {bookings.data.map((booking) => (
              <article
                key={booking.id}
                className="rounded-sm border border-border bg-card p-3.5 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{booking.riderName}</p>
                    <p className="text-xs text-muted-foreground break-words">
                      {[booking.riderEmail, booking.contactPhone, booking.bikeLabel]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Badge tone={bookingTone(booking)}>{bookingLabel(booking)}</Badge>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-2.5 text-xs">
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                      Booking ID
                    </dt>
                    <dd className="mt-0.5 font-mono text-foreground">{booking.reference}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                      Seats
                    </dt>
                    <dd className="mt-0.5 font-medium text-foreground">{booking.seats}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                      Booked on
                    </dt>
                    <dd className="mt-0.5 text-muted-foreground">
                      {dateTime.format(new Date(booking.createdAt))}
                    </dd>
                  </div>
                  {booking.status === "REGISTERED" && booking.paymentStatus !== "NOT_REQUIRED" ? (
                    <div>
                      <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        Payment
                      </dt>
                      <dd className="mt-0.5 text-muted-foreground">
                        {booking.paymentStatus === "PAID"
                          ? "Verified"
                          : "No payment recorded"}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {booking.note ? (
                  <div className="mt-2.5 rounded bg-surface/50 p-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Note: </span>
                    {booking.note}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className={`${tableClasses.wrapper} hidden md:block`}>
            <table className={tableClasses.table}>
              <thead className={tableClasses.head}>
                <tr>
                  {["Rider", "Ride", "Seats", "Booking ID", "Status", "Booked"].map((column) => (
                    <th key={column} scope="col" className={tableClasses.th}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.data.map((booking) => (
                  <tr key={booking.id} className={tableClasses.row}>
                    <td className={tableClasses.td}>
                      <p className="text-foreground">{booking.riderName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[booking.riderEmail, booking.contactPhone, booking.bikeLabel]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {booking.note ? (
                        <p className="mt-1 max-w-sm whitespace-pre-line text-xs text-muted-foreground">
                          Note: {booking.note}
                        </p>
                      ) : null}
                    </td>
                    <td className={tableClasses.td}>{ride.title}</td>
                    <td className={tableClasses.td}>{booking.seats}</td>
                    <td className={`${tableClasses.td} font-mono text-xs`}>{booking.reference}</td>
                    <td className={tableClasses.td}>
                      <Badge tone={bookingTone(booking)}>{bookingLabel(booking)}</Badge>
                      {booking.status === "REGISTERED" && booking.paymentStatus !== "NOT_REQUIRED" ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {booking.paymentStatus === "PAID"
                            ? "Payment verified"
                            : "No payment recorded"}
                        </p>
                      ) : null}
                    </td>
                    <td className={`${tableClasses.td} whitespace-nowrap`}>
                      {dateTime.format(new Date(booking.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminPanel>
  );
}
