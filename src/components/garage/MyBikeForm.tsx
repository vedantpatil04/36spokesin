import { LoaderCircle } from "lucide-react";
import { type FormEvent, useId, useMemo, useState } from "react";
import { Button, FormField, SelectInput, TextInput } from "@/components/ui-kit";
import type { Bike, GarageBike, OwnedBikeInput } from "@/types";

const CURRENT_YEAR = new Date().getFullYear();

const toInt = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
};

/** Add or edit a bike in the rider's own garage. The API validates every field again. */
export function MyBikeForm({
  bikes,
  initial,
  pending,
  error,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  bikes: Bike[];
  initial?: GarageBike;
  pending: boolean;
  error: string | null;
  onSubmit: (input: OwnedBikeInput) => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const id = useId();
  const [bikeId, setBikeId] = useState(initial?.bikeId ?? "");
  const [variantId, setVariantId] = useState(initial?.variantId ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [year, setYear] = useState(initial?.year ? String(initial.year) : "");
  const [odometer, setOdometer] = useState(
    initial?.odometerKm !== null && initial?.odometerKm !== undefined
      ? String(initial.odometerKm)
      : "",
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // An archived model stays selectable for the bike that already has it.
  const options = useMemo(() => {
    if (!initial || bikes.some((bike) => bike.id === initial.bikeId)) return bikes;
    return [initial.bike, ...bikes];
  }, [bikes, initial]);
  const chosen = options.find((bike) => bike.id === bikeId) ?? null;
  const variants = chosen?.variants ?? [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedYear = toInt(year);
    const parsedOdometer = toInt(odometer);
    if (!chosen) return setLocalError("Choose your motorcycle.");
    if (
      Number.isNaN(parsedYear) ||
      (parsedYear !== null && (parsedYear < 1950 || parsedYear > CURRENT_YEAR + 1))
    ) {
      return setLocalError(`Enter a year between 1950 and ${CURRENT_YEAR + 1}.`);
    }
    if (Number.isNaN(parsedOdometer) || (parsedOdometer !== null && parsedOdometer < 0)) {
      return setLocalError("Enter the odometer reading in whole kilometres.");
    }
    setLocalError(null);
    onSubmit({
      bikeId: chosen.id,
      variantId: variantId || null,
      nickname: nickname.trim() || null,
      year: parsedYear,
      odometerKm: parsedOdometer,
    });
  };

  const message = localError ?? error;

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      <FormField id={`${id}-bike`} label="Motorcycle">
        <SelectInput
          id={`${id}-bike`}
          value={bikeId}
          onChange={(event) => {
            setBikeId(event.target.value);
            setVariantId("");
          }}
          required
        >
          <option value="">Choose your bike</option>
          {options.map((bike) => (
            <option key={bike.id} value={bike.id}>
              {bike.brand} {bike.model}
            </option>
          ))}
        </SelectInput>
      </FormField>
      <FormField id={`${id}-variant`} label="Variant">
        <SelectInput
          id={`${id}-variant`}
          value={variantId}
          onChange={(event) => setVariantId(event.target.value)}
          disabled={variants.length === 0}
        >
          <option value="">
            {variants.length === 0 ? "No variants listed" : "Not sure / any"}
          </option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name}
            </option>
          ))}
        </SelectInput>
      </FormField>
      <FormField id={`${id}-nickname`} label="Nickname" hint="Optional, e.g. “The Spiti mule”">
        <TextInput
          id={`${id}-nickname`}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={40}
          aria-describedby={`${id}-nickname-hint`}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField id={`${id}-year`} label="Year">
          <TextInput
            id={`${id}-year`}
            inputMode="numeric"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            placeholder={String(CURRENT_YEAR)}
          />
        </FormField>
        <FormField id={`${id}-odometer`} label="Odometer (km)">
          <TextInput
            id={`${id}-odometer`}
            inputMode="numeric"
            value={odometer}
            onChange={(event) => setOdometer(event.target.value)}
          />
        </FormField>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      </div>
    </form>
  );
}
