import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */

type Variant = "primary" | "outline" | "ghost" | "solid";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-display uppercase tracking-[0.14em] rounded-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-card",
  solid: "bg-foreground text-background hover:opacity-90",
  outline: "border border-border-strong text-foreground hover:bg-surface-2 hover:border-primary",
  ghost: "text-muted-foreground hover:text-foreground",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.7rem]",
  md: "h-11 px-5 text-xs",
  lg: "h-13 px-7 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

/* ---------------------------------- Badge ---------------------------------- */

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "neutral" | "primary" | "success" | "warning";
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-border-strong text-muted-foreground",
    primary: "border-primary/50 text-primary",
    success: "border-success/50 text-success",
    warning: "border-warning/50 text-warning",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Section header ----------------------------- */

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ---------------------------------- Section -------------------------------- */

export function Section({
  children,
  className,
  tone = "default",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "surface";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("py-16 md:py-24", tone === "surface" && "bg-surface/60 border-y border-border", className)}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

/* ----------------------------------- Media --------------------------------- */

export function Media({
  src,
  alt,
  ratio = "4/3",
  className,
  imgClassName,
  priority = false,
  children,
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)} style={{ aspectRatio: ratio }}>
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn(
          "h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform",
          imgClassName,
        )}
      />
      {children}
    </div>
  );
}

/* ------------------------------- Scroll rail ------------------------------- */

/** Horizontal swipe rail on small screens, grid on larger screens. */
export function Rail({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2",
        "md:mx-0 md:grid md:snap-none md:overflow-visible md:px-0 md:pb-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RailItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-[78vw] max-w-80 shrink-0 snap-start sm:w-[55vw] md:w-auto md:max-w-none", className)}>
      {children}
    </div>
  );
}
