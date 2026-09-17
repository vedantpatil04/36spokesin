import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const fieldLabelClasses = "text-xs uppercase tracking-[0.18em] text-muted-foreground";

export const fieldControlClasses =
  "mt-2 h-12 w-full rounded-sm border border-input bg-surface px-3 text-sm text-foreground [color-scheme:dark] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60";

/** Label + control pair. The id links them for assistive technology. */
export function FormField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabelClasses}>
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldControlClasses, className)} {...props} />;
}

export function SelectInput({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldControlClasses, className)} {...props} />;
}
