import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { type ImageChoice, SingleImageField } from "@/components/admin/SingleImageField";
import { dateTime, describedBy, fieldErrors } from "@/components/admin/admin-format";
import {
  AdminPageHeader,
  AdminPanel,
  Field,
  InlineError,
  TextArea,
} from "@/components/admin/admin-ui";
import { ErrorState, Skeleton } from "@/components/states";
import { Badge, type BadgeTone, Button, TextInput } from "@/components/ui-kit";
import type { ApiAdminPayment, ApiAdminPaymentSettings } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { minorToRupees } from "@/lib/money";
import { formatRideStart } from "@/lib/ride-format";
import {
  type AdminPaymentFilter,
  approvePayment,
  getPaymentSettings,
  listAdminPayments,
  rejectPayment,
  updatePaymentSettings,
} from "@/services/admin/payments";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsPage,
});

const FILTERS: { value: AdminPaymentFilter; label: string }[] = [
  { value: "pending", label: "Awaiting review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "all", label: "All" },
];

const STATUS: Record<ApiAdminPayment["status"], { label: string; tone: BadgeTone }> = {
  PROOF_SUBMITTED: { label: "Awaiting review", tone: "primary" },
  PAID: { label: "Paid", tone: "success" },
  REJECTED: { label: "Rejected", tone: "warning" },
  CANCELLED: { label: "Booking cancelled", tone: "neutral" },
};

/** Review riders' UPI payment proofs, and set the UPI details they pay to. */
function PaymentsPage() {
  const [filter, setFilter] = useState<AdminPaymentFilter>("pending");
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["admin", "payment-settings"],
    queryFn: getPaymentSettings,
  });
  const payments = useQuery({
    queryKey: ["admin", "payments", filter],
    queryFn: () => listAdminPayments(filter),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        description="Riders pay for paid rides by UPI and upload a screenshot. A booking is confirmed only when you approve its proof here."
      />

      {settings.data && !settings.data.configured ? (
        <p role="alert" className="rounded-sm border border-warning/50 px-4 py-3 text-sm">
          No UPI ID is saved yet, so paid rides can't be booked. Add one under UPI payment details
          below.
        </p>
      ) : null}

      <AdminPanel
        title="Payment proofs"
        actions={
          <div role="group" aria-label="Filter payment proofs" className="flex flex-wrap gap-1">
            {FILTERS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={filter === option.value ? "solid" : "ghost"}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        }
      >
        {payments.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : payments.isError ? (
          <ErrorState title="Payments didn't load" onRetry={() => void payments.refetch()} />
        ) : payments.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {filter === "pending"
              ? "No payment proofs are waiting for review."
              : "Nothing here yet."}
          </p>
        ) : (
          <ul className="space-y-4">
            {payments.data.map((payment) => (
              <li key={payment.id}>
                <PaymentReview payment={payment} onReviewed={() => void refresh()} />
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      {settings.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : settings.isError ? (
        <ErrorState title="Payment details didn't load" onRetry={() => void settings.refetch()} />
      ) : (
        <PaymentSettingsForm
          key={settings.data.updatedAt ?? "new"}
          settings={settings.data}
          onSaved={(saved) => queryClient.setQueryData(["admin", "payment-settings"], saved)}
        />
      )}
    </div>
  );
}

/** One proof: who paid for what, the screenshot, and the decision. */
function PaymentReview({
  payment,
  onReviewed,
}: {
  payment: ApiAdminPayment;
  onReviewed: () => void;
}) {
  const reasonId = useId();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const awaiting = payment.status === "PROOF_SUBMITTED";

  const decide = async (decision: "approve" | "reject") => {
    setPending(decision);
    setError(null);
    try {
      if (decision === "approve") await approvePayment(payment.id);
      else await rejectPayment(payment.id, reason.trim() || null);
      onReviewed();
    } catch (caught) {
      setError(describeError(caught));
      // Someone else decided it, or the rider cancelled: show the current list.
      onReviewed();
    } finally {
      setPending(null);
    }
  };

  const facts = [
    {
      label: "Rider",
      value: payment.rider.name,
      detail: [payment.rider.email, payment.rider.phone],
    },
    {
      label: "Ride",
      value: payment.ride.title,
      detail: [formatRideStart(payment.ride.startsAt)],
    },
    { label: "Booking ID", value: payment.reference, detail: [] },
    { label: "Amount", value: formatINR(minorToRupees(payment.amount)), detail: [] },
    { label: "Submitted", value: dateTime.format(new Date(payment.submittedAt)), detail: [] },
  ];

  return (
    <article className="grid gap-4 rounded-sm border border-border p-4 md:grid-cols-[11rem_1fr]">
      {payment.proofUrl ? (
        <a
          href={payment.proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-md border border-border bg-surface transition hover:border-primary"
        >
          <img
            src={payment.proofUrl}
            alt={`Payment proof for booking ${payment.reference}`}
            className="h-52 w-full object-contain md:h-full md:max-h-64"
          />
          <div className="flex items-center justify-center gap-1.5 border-t border-border/50 bg-muted/40 py-2 text-[0.72rem] text-muted-foreground group-hover:text-foreground">
            <ExternalLink className="size-3 shrink-0" aria-hidden />
            <span>Tap to open full proof</span>
          </div>
        </a>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-sm border border-border text-xs text-muted-foreground">
          No image
        </div>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone={STATUS[payment.status].tone}>{STATUS[payment.status].label}</Badge>
          <Link
            to="/admin/rides/$rideId"
            params={{ rideId: payment.ride.id }}
            hash="ride-bookings"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Ride bookings
          </Link>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-1 text-sm text-foreground">{fact.value}</dd>
              {fact.detail.filter(Boolean).map((line) => (
                <dd key={line} className="break-all text-xs text-muted-foreground">
                  {line}
                </dd>
              ))}
            </div>
          ))}
        </dl>

        {payment.status === "REJECTED" ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Rejected{payment.reviewedAt ? ` ${dateTime.format(new Date(payment.reviewedAt))}` : ""}
            {payment.rejectionReason ? `: ${payment.rejectionReason}` : " (no reason given)"}
          </p>
        ) : payment.status === "PAID" && payment.reviewedAt ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Approved {dateTime.format(new Date(payment.reviewedAt))}
          </p>
        ) : null}

        {awaiting ? (
          <div className="mt-4 border-t border-border pt-4">
            {rejecting ? (
              <div className="space-y-3">
                <Field
                  id={reasonId}
                  label="Reason (optional)"
                  hint="Shown to the rider, who can then send a new proof."
                >
                  <TextInput
                    id={reasonId}
                    value={reason}
                    maxLength={300}
                    onChange={(event) => setReason(event.target.value)}
                    {...describedBy(reasonId, undefined, "hint")}
                  />
                </Field>
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <Button
                    size="md"
                    variant="ghost"
                    className="w-full sm:w-auto min-h-10"
                    disabled={pending !== null}
                    onClick={() => setRejecting(false)}
                  >
                    Back
                  </Button>
                  <Button
                    size="md"
                    className="w-full sm:w-auto min-h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={pending !== null}
                    onClick={() => void decide("reject")}
                  >
                    {pending === "reject" ? (
                      <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                    ) : null}
                    Reject proof
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  size="md"
                  className="w-full sm:w-auto min-h-10"
                  disabled={pending !== null}
                  onClick={() => void decide("approve")}
                >
                  {pending === "approve" ? (
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                  ) : null}
                  Approve payment
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  className="w-full sm:w-auto min-h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={pending !== null}
                  onClick={() => setRejecting(true)}
                >
                  Reject payment
                </Button>
              </div>
            )}
          </div>
        ) : null}
        <div className="mt-3">
          <InlineError message={error} />
        </div>
      </div>
    </article>
  );
}

/** The UPI details riders see on the payment step. */
function PaymentSettingsForm({
  settings,
  onSaved,
}: {
  settings: ApiAdminPaymentSettings;
  onSaved: (settings: ApiAdminPaymentSettings) => void;
}) {
  const id = useId();
  const [upiId, setUpiId] = useState(settings.upiId ?? "");
  const [payeeName, setPayeeName] = useState(settings.payeeName ?? "");
  const [instructions, setInstructions] = useState(settings.instructions ?? "");
  const [qr, setQr] = useState<ImageChoice>(
    settings.qr ? { id: settings.qr.id, url: settings.qr.url } : null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrors({});
    try {
      onSaved(
        await updatePaymentSettings({
          upiId: upiId.trim() || null,
          payeeName: payeeName.trim() || null,
          instructions: instructions.trim() || null,
          qrMediaId: qr?.id ?? null,
        }),
      );
      setMessage({ tone: "ok", text: "Saved" });
    } catch (error) {
      setErrors(fieldErrors(error));
      setMessage({ tone: "error", text: describeError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPanel
      title="UPI payment details"
      description={`What riders see when they pay. A seat is held for ${settings.holdMinutes} minutes while they do.`}
    >
      <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id={`${id}-upi`}
            label="UPI ID"
            error={errors["upiId"] ? "Enter a UPI ID like name@bank." : undefined}
            hint="Paid rides can't be booked while this is empty."
          >
            <TextInput
              id={`${id}-upi`}
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
              className="font-mono"
              autoComplete="off"
              {...describedBy(`${id}-upi`, errors["upiId"], "hint")}
            />
          </Field>
          <Field
            id={`${id}-payee`}
            label="Payee name (optional)"
            hint="The name riders should see in their UPI app."
          >
            <TextInput
              id={`${id}-payee`}
              value={payeeName}
              maxLength={80}
              onChange={(event) => setPayeeName(event.target.value)}
              {...describedBy(`${id}-payee`, undefined, "hint")}
            />
          </Field>
          <Field
            id={`${id}-instructions`}
            label="Payment instructions (optional)"
            className="md:col-span-2"
          >
            <TextArea
              id={`${id}-instructions`}
              value={instructions}
              maxLength={1000}
              rows={3}
              onChange={(event) => setInstructions(event.target.value)}
            />
          </Field>
        </div>
        <SingleImageField label="UPI QR code" category="SITE" value={qr} onChange={setQr} />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Button type="submit" className="w-full sm:w-auto min-h-10" disabled={saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            Save payment details
          </Button>
          {message ? (
            <p
              role="status"
              className={
                message.tone === "error" ? "text-sm text-destructive" : "text-sm text-success"
              }
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </form>
    </AdminPanel>
  );
}
