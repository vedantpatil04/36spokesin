import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost" | "solid";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-display uppercase tracking-[0.14em] rounded-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-card",
  solid: "bg-foreground text-background hover:opacity-90",
  outline: "border border-border-strong text-foreground hover:bg-surface-2 hover:border-primary",
  ghost: "text-muted-foreground hover:text-foreground",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[0.7rem]",
  md: "h-11 px-5 text-xs",
  lg: "h-13 px-7 text-sm",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string | undefined;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}
