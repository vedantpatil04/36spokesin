/**
 * Building blocks for the admin CMS. Same tokens and type as the public site,
 * tuned for dense, form-heavy screens on desktop and tablet.
 */
import type { ComponentProps, ReactNode } from "react";
import { Badge, type BadgeTone, fieldControlClasses, fieldLabelClasses } from "@/components/ui-kit";
import type { ApiProductStatus, ApiRideStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
  eyebrow = "Admin",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl break-words">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className,
  id,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("rounded-sm border border-border bg-card p-5 md:p-6", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="font-display text-lg uppercase tracking-[0.08em]">
            {title}
          </h2>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const RIDE_STATUS_TONE: Record<ApiRideStatus, BadgeTone> = {
  DRAFT: "neutral",
  UPCOMING: "success",
  FULL: "primary",
  COMPLETED: "neutral",
  CANCELLED: "warning",
  ARCHIVED: "warning",
};

export function RideStatusBadge({ status }: { status: ApiRideStatus }) {
  return <Badge tone={RIDE_STATUS_TONE[status]}>{status.toLowerCase()}</Badge>;
}

const STATUS_TONE: Record<ApiProductStatus, BadgeTone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

/** Badge for DRAFT / PUBLISHED / ARCHIVED: products, destinations and trips. */
export function ProductStatusBadge({ status }: { status: ApiProductStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status.toLowerCase()}</Badge>;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(fieldControlClasses, "h-auto min-h-24 py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

/** Field with a label, optional hint and an error announced to assistive technology. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={fieldLabelClasses}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
      />
      <span>
        <span className="text-foreground">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function InlineError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
