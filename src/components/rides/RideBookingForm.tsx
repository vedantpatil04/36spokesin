import { Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  Button,
  FormField,
  SelectInput,
  TextInput,
  fieldControlClasses,
} from "@/components/ui-kit";
import { ApiError, type ApiUser } from "@/lib/api";
import { formatRidePrice } from "@/lib/ride-format";
import { cn } from "@/lib/utils";
import { describeError } from "@/services/request-helpers";
import { bookRide } from "@/services/rides";
import { useMyBikes } from "@/state/garage";
import type { GarageBike, Ride, RideRegistration } from "@/types";

/** Same shape the API accepts: digits with an optional +, once spaces and dashes are removed. */
const PHONE = /^\+?[1-9]\d{6,14}$/;
const NOTE_MAX = 500;

const bikeName = (garageBike: GarageBike) =>
  [
    garageBike.nickname ? `${garageBike.nickname}:` : null,
    garageBike.bike.brand,
    garageBike.bike.model,
    garageBike.variantName,
    garageBike.year ? `(${garageBike.year})` : null,
  ]
    .filter(Boolean)
    .join(" ");

/**
 * The booking form for one ride. Who is booking comes from the signed-in
 * account; the rider only adds what the ride crew needs. The API validates and
 * stores the booking, and `onBooked` receives what it saved.
 */
export function RideBookingForm({
  ride,
  user,
  onBooked,
  onAlreadyBooked,
}: {
  ride: Ride;
  user: ApiUser;
  onBooked: (booking: RideRegistration) => void;
  /** The API says this rider already holds a booking (e.g. made in another tab). */
  onAlreadyBooked: () => void;
}) {
  const bikes = useMyBikes();
  const [phone, setPhone] = useState(user.phone ?? "");
  // "" = the rider's main bike until they choose; "none" = not saying.
  const [bikeChoice, setBikeChoice] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; bike?: string; note?: string }>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const bikeId = bikeChoice === "none" ? null : bikeChoice || (bikes[0]?.id ?? null);
  const paid = (ride.price ?? 0) > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const contactPhone = phone.replace(/[\s-]/g, "");
    if (!PHONE.test(contactPhone)) {
      setErrors({ phone: "Enter a phone number with its country code, e.g. +91 98765 43210." });
      return;
    }
    setErrors({});
    setFailure(null);
    setPending(true);
    try {
      onBooked(
        await bookRide(ride.id, {
          contactPhone,
          riderBikeId: bikeId,
          note: note.trim() || null,
        }),
      );
    } catch (error) {
      if (error instanceof ApiError && error.code === "ALREADY_REGISTERED") {
        onAlreadyBooked();
        return;
      }
      if (error instanceof ApiError && error.details.length > 0) {
        const [phoneError] = error.fieldMessages("contactPhone");
        const [bikeError] = error.fieldMessages("riderBikeId");
        const [noteError] = error.fieldMessages("note");
        setErrors({
          ...(phoneError ? { phone: "Enter a phone number with its country code." } : {}),
          ...(bikeError ? { bike: bikeError } : {}),
          ...(noteError ? { note: `Keep the note under ${NOTE_MAX} characters.` } : {}),
        });
      }
      setFailure(describeError(error, "The booking didn't go through. Try again."));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="space-y-6">
      <div className="rounded-sm border border-border bg-surface/60 p-4">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          Booking as
        </p>
        <p className="mt-1.5 font-display text-base uppercase text-foreground">
          {[user.firstName, user.lastName].filter(Boolean).join(" ")}
        </p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <FormField
        id="booking-phone"
        label="Phone"
        hint="So the ride crew can reach you. Include the country code."
      >
        <TextInput
          id="booking-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+91 98765 43210"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "booking-phone-error" : "booking-phone-hint"}
        />
        <FieldError id="booking-phone-error" message={errors.phone} />
      </FormField>

      <FormField id="booking-bike" label="Motorcycle">
        {bikes.length > 0 ? (
          <SelectInput
            id="booking-bike"
            value={bikeChoice || (bikes[0]?.id ?? "none")}
            onChange={(event) => setBikeChoice(event.target.value)}
            aria-invalid={errors.bike ? true : undefined}
            aria-describedby={errors.bike ? "booking-bike-error" : undefined}
          >
            {bikes.map((garageBike) => (
              <option key={garageBike.id} value={garageBike.id}>
                {bikeName(garageBike)}
              </option>
            ))}
            <option value="none">Not decided yet</option>
          </SelectInput>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No bike in your garage yet. You can book without one, or{" "}
            <Link
              to="/my-36-spokes/garage"
              className="text-foreground underline underline-offset-4"
            >
              add your motorcycle
            </Link>{" "}
            first.
          </p>
        )}
        <FieldError id="booking-bike-error" message={errors.bike} />
      </FormField>

      <FormField id="booking-note" label="Note for the crew (optional)">
        <textarea
          id="booking-note"
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={errors.note ? "booking-note-error" : undefined}
          className={cn(fieldControlClasses, "h-auto py-3 leading-relaxed")}
        />
        <FieldError id="booking-note-error" message={errors.note} />
      </FormField>

      <div className="border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-display uppercase text-foreground">{formatRidePrice(ride)}</span>
          {paid ? " · You pay by UPI on the next step; your seat is held while you do." : null}
        </p>
        <Button type="submit" size="lg" className="mt-4 w-full sm:w-auto" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {paid ? "Continue to payment" : "Confirm booking"}
        </Button>
        <p role="alert" className="mt-3 min-h-5 text-sm text-destructive">
          {failure}
        </p>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  return message ? (
    <p id={id} className="mt-1.5 text-xs text-destructive">
      {message}
    </p>
  ) : null;
}
