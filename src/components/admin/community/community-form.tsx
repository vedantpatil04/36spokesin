import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button, TextInput } from "@/components/ui-kit";
import type { ApiContentStatus, ApiMediaCategory } from "@/lib/api";
import { SingleImageField } from "../SingleImageField";
import { StatusRadios } from "../StatusRadios";
import { CONTENT_STATUS_OPTIONS } from "../admin-options";
import { Field } from "../admin-ui";
import type { ImageState } from "./community-form-model";

export function ImageWithAltField({
  id,
  label,
  category,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  category: ApiMediaCategory;
  value: ImageState;
  onChange: (value: ImageState) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <SingleImageField
        label={label}
        category={category}
        value={value.choice}
        onChange={(choice) =>
          onChange({
            choice,
            altText: choice ? value.altText : "",
            initialAltText: value.initialAltText,
          })
        }
        {...(disabled !== undefined ? { disabled } : {})}
      />
      {value.choice ? (
        <Field
          id={id}
          label="Image description (alt text)"
          hint="Describe what the photo shows for screen-reader users."
        >
          <TextInput
            id={id}
            value={value.altText}
            maxLength={300}
            onChange={(event) => onChange({ ...value, altText: event.target.value })}
            aria-describedby={`${id}-hint`}
          />
        </Field>
      ) : null}
    </div>
  );
}

export function StatusField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: ApiContentStatus;
  onChange: (value: ApiContentStatus) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
      <StatusRadios
        name={name}
        value={value}
        options={CONTENT_STATUS_OPTIONS}
        onChange={onChange}
      />
    </div>
  );
}

export function FormActions({
  saving,
  message,
  submitLabel,
  onCancel,
}: {
  saving: boolean;
  message: string | null;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 border-t border-border pt-5">
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto min-h-10"
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button type="submit" className="w-full sm:w-auto min-h-10" disabled={saving}>
        {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        {submitLabel}
      </Button>
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}

/** Two-column form grid used by every community editor. */
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}
