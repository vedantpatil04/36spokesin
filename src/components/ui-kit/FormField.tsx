import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
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

export interface PasswordInputProps extends ComponentProps<"input"> {
  containerClassName?: string;
}

/** Password input with toggleable show/hide eye button. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { className, containerClassName, disabled, type: _ignoredType, ...props },
    ref,
  ) {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className={cn("relative mt-2", containerClassName)}>
        <input
          ref={ref}
          {...props}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={cn(fieldControlClasses, "mt-0 pr-11", className)}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          onMouseDown={(e) => {
            // Keep input focused when toggling password visibility
            e.preventDefault();
          }}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute right-0 top-0 bottom-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm disabled:pointer-events-none disabled:opacity-50"
        >
          {showPassword ? (
            <EyeOff className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Eye className="size-4 shrink-0" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export const TextInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(function TextInput(
  { className, type, ...props },
  ref,
) {
  if (type === "password") {
    return <PasswordInput ref={ref} className={className} {...props} />;
  }
  return <input ref={ref} type={type} className={cn(fieldControlClasses, className)} {...props} />;
});
TextInput.displayName = "TextInput";

export const SelectInput = forwardRef<HTMLSelectElement, ComponentProps<"select">>(
  function SelectInput({ className, ...props }, ref) {
    return <select ref={ref} className={cn(fieldControlClasses, className)} {...props} />;
  },
);
SelectInput.displayName = "SelectInput";
