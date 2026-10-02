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
        <div className={tableClasses.wrapper}>
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
      )}
    </AdminPanel>
  );
}
