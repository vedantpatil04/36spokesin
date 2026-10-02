import { cn } from "@/lib/utils";

/** Status picker as labelled radio cards (same look as the product editor). */
export function StatusRadios<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string; hint: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Status</legend>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-sm border p-3 text-sm transition-colors",
              value === option.value
                ? "border-primary bg-surface"
                : "border-border hover:border-border-strong",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-0.5 accent-[var(--primary)]"
            />
            <span>
              <span className="block text-foreground">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
