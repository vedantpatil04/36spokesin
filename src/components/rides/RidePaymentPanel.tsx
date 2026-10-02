import { useQuery } from "@tanstack/react-query";
import { Check, Copy, ImageUp, LoaderCircle } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Badge, Button, ButtonLink } from "@/components/ui-kit";
import { ApiError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { formatRideTime } from "@/lib/ride-format";
import { ACCEPTED_IMAGE_TYPES, uploadImage, validateImageFile } from "@/services/media-uploads";
import { describeError } from "@/services/request-helpers";
import { getPaymentInfo, submitPaymentProof } from "@/services/rides";
import type { Ride, RideRegistration } from "@/types";
import { CancelBookingButton } from "./CancelBookingButton";

/**
 * The payment step of a paid booking. The rider pays by UPI outside the app
 * using the details the crew configured, uploads the screenshot and submits it
 * once. Nothing here says the payment went through: the booking is confirmed
 * only when an admin has verified the proof, and the API alone decides that.
 */
export function RidePaymentPanel({
  ride,
  booking,
  onChanged,
  onStale,
}: {
  ride: Ride;
  booking: RideRegistration;
  onChanged: (booking: RideRegistration) => void;
  /** The API no longer agrees with what is shown (e.g. the seat hold ran out). */
  onStale: () => void;
}) {
  const underReview = booking.status === "payment-under-review";
  const rejected = booking.status === "payment-rejected";
  const heldUntil = booking.holdExpiresAt ? formatRideTime(booking.holdExpiresAt) : null;

  return (
    <div>
      <Badge tone={underReview ? "primary" : "warning"}>
        {underReview
          ? "Payment under review"
          : rejected
            ? "Payment proof rejected"
            : "Payment required"}
      </Badge>
      <h1 className="mt-4 text-3xl leading-[1.05] sm:text-4xl">
        {underReview
          ? "Payment under review"
          : rejected
            ? "Payment proof rejected"
            : "Payment required"}
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {underReview ? (
          <>
            Your payment proof has been submitted and is awaiting verification. Your seat on{" "}
            {ride.name} is held while the crew checks it.
          </>
        ) : rejected ? (
          <>The crew couldn't verify the payment proof you sent for {ride.name}.</>
        ) : (
          <>Your seat on {ride.name} is held while you pay.</>
        )}{" "}
        Booking ID <span className="font-display text-foreground">{booking.reference}</span>.
      </p>

      {rejected && booking.paymentRejectionReason ? (
        <p className="mt-4 rounded-sm border border-warning/50 px-4 py-3 text-sm text-foreground">
          <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            Reason
          </span>
          {booking.paymentRejectionReason}
        </p>
      ) : null}

      {underReview ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink to="/rides/$slug" params={{ slug: ride.slug }} size="lg">
            View ride
          </ButtonLink>
          <ButtonLink to="/my-36-spokes/rides" variant="outline" size="lg">
            My rides
          </ButtonLink>
        </div>
      ) : (
        <PayAndUpload
          ride={ride}
          booking={booking}
          heldUntil={heldUntil}
          resubmitting={rejected}
          onChanged={onChanged}
          onStale={onStale}
        />
      )}

      <CancelBookingButton ride={ride} onCancelled={onChanged} onStale={onStale} />
    </div>
  );
}

function PayAndUpload({
  ride,
  booking,
  heldUntil,
  resubmitting,
  onChanged,
  onStale,
}: {
  ride: Ride;
  booking: RideRegistration;
  heldUntil: string | null;
  resubmitting: boolean;
  onChanged: (booking: RideRegistration) => void;
  onStale: () => void;
}) {
  const inputId = useId();
  const info = useQuery({ queryKey: ["payment-info"], queryFn: getPaymentInfo });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const choose = (chosen: File | undefined) => {
    if (!chosen) return;
    const invalid = validateImageFile(chosen);
    setFailure(invalid);
    setFile(invalid ? null : chosen);
  };

  const submit = async () => {
    if (!file) return;
    setFailure(null);
    setProgress(0);
    try {
      const asset = await uploadImage(file, { category: "PAYMENT_PROOF", onProgress: setProgress });
      onChanged(await submitPaymentProof(ride.id, asset.id));
    } catch (error) {
      // The booking changed underneath (hold ran out, already under review): show what the API has.
      if (error instanceof ApiError && error.status === 409) onStale();
      setFailure(describeError(error, "The payment proof wasn't submitted. Try again."));
    } finally {
      setProgress(null);
    }
  };

  const details = info.data;
  const busy = progress !== null;

  return (
    <>
      <dl className="mt-6 rounded-sm border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            Amount
          </dt>
          <dd className="font-display text-3xl text-foreground">
            {booking.amount !== null ? formatINR(booking.amount) : ""}
          </dd>
        </div>
        {heldUntil ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Seat held until {heldUntil}. {resubmitting ? "Submit a new proof" : "Submit your proof"}{" "}
            before then to keep it.
          </p>
        ) : null}

        {info.isPending ? (
          <p className="mt-5 text-sm text-muted-foreground">Loading payment details…</p>
        ) : info.isError || !details?.configured ? (
          <p role="alert" className="mt-5 text-sm text-destructive">
            The payment details couldn't be shown. Refresh the page, or contact the crew before
            paying.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-[auto_1fr]">
            {details.qrUrl ? (
              <img
                src={details.qrUrl}
                alt="UPI QR code for this payment"
                className="size-44 rounded-sm bg-white object-contain p-2"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                UPI ID
              </p>
              <p className="mt-1 break-all font-mono text-base text-foreground">{details.upiId}</p>
              {details.payeeName ? (
                <p className="mt-1 text-sm text-muted-foreground">Paying {details.payeeName}</p>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(details.upiId ?? "")
                    .then(() => setCopied(true))
                    .catch(() => setCopied(false));
                }}
              >
                {copied ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  <Copy className="size-3.5" aria-hidden />
                )}
                {copied ? "UPI ID copied" : "Copy UPI ID"}
              </Button>
              {details.instructions ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {details.instructions}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </dl>

      <section aria-labelledby={`${inputId}-heading`} className="mt-6">
        <h2 id={`${inputId}-heading`} className="text-xl">
          Payment proof
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          After paying, upload the screenshot from your UPI app. The crew checks it before your
          booking is confirmed.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label
            htmlFor={inputId}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-sm border border-border-strong px-5 font-display text-xs uppercase tracking-[0.14em] text-foreground hover:border-primary"
          >
            <ImageUp className="size-4" aria-hidden />
            {file ? "Choose another" : "Upload screenshot"}
            <input
              id={inputId}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                choose(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {file ? (
            <span className="flex min-w-0 items-center gap-3 text-sm text-muted-foreground">
              {preview ? (
                <img src={preview} alt="" className="size-11 rounded-sm object-cover" />
              ) : null}
              <span className="truncate">{file.name}</span>
            </span>
          ) : null}
        </div>
        <Button
          size="lg"
          className="mt-5 w-full sm:w-auto"
          disabled={!file || busy}
          onClick={() => void submit()}
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {busy
            ? progress !== null && progress < 1
              ? `Uploading ${Math.round(progress * 100)}%`
              : "Submitting"
            : "Submit payment proof"}
        </Button>
        <p role="alert" className="mt-3 min-h-5 text-sm text-destructive">
          {failure}
        </p>
      </section>
    </>
  );
}
