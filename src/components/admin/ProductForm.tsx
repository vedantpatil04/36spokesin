import { ArrowDown, ArrowUp, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { Button, SelectInput, TextInput } from "@/components/ui-kit";
import { ApiError } from "@/lib/api";
import type {
  ApiAdminBikeModel,
  ApiBrand,
  ApiCategory,
  ApiProductStatus,
  ApiStockStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ProductInput } from "@/services/admin/catalog";
import { describeError } from "@/services/request-helpers";
import { describedBy } from "./admin-format";
import { AdminPanel, Checkbox, Field, TextArea } from "./admin-ui";
import {
  type FieldErrors,
  type ProductFormValues,
  comparable,
  newRowKey,
  valuesToInput,
} from "./product-form-model";

const STATUS_OPTIONS: { value: ApiProductStatus; label: string; hint: string }[] = [
  { value: "DRAFT", label: "Draft", hint: "Hidden from the shop." },
  { value: "PUBLISHED", label: "Published", hint: "Visible and purchasable in the shop." },
  { value: "ARCHIVED", label: "Archived", hint: "Removed from the shop; history is kept." },
];

const STOCK_OPTIONS: { value: ApiStockStatus; label: string }[] = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "BACKORDER", label: "Available to order (backorder)" },
];

const smallIconButton =
  "flex size-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

/** Maps API field errors ("sku", "compatibility.2.bikeVariantId") onto form fields. */
function apiFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {};
  return Object.fromEntries(
    error.details.map((detail) => [detail.field, detail.messages.join(" ")] as const),
  );
}

/**
 * The product editor form: basic info, pricing, inventory, status,
 * specifications and compatibility, saved together in one request.
 * `mediaSlot` renders the gallery manager (which saves on its own) in place.
 */
export function ProductForm({
  initialValues,
  categories,
  brands,
  bikes,
  imageCount,
  mediaSlot,
  submitLabel,
  onSubmit,
  isNew,
}: {
  initialValues: ProductFormValues;
  categories: ApiCategory[];
  brands: ApiBrand[];
  bikes: ApiAdminBikeModel[];
  imageCount: number | null;
  mediaSlot?: ReactNode;
  submitLabel: string;
  onSubmit: (input: ProductInput) => Promise<ProductFormValues | void>;
  isNew: boolean;
}) {
  const id = useId();
  const [values, setValues] = useState(initialValues);
  const [baseline, setBaseline] = useState(() => comparable(initialValues));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const dirty = comparable(values) !== baseline;

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const bikesByBrand = useMemo(() => {
    const groups = new Map<string, ApiAdminBikeModel[]>();
    for (const bike of bikes)
      groups.set(bike.brand.name, [...(groups.get(bike.brand.name) ?? []), bike]);
    return [...groups.entries()];
  }, [bikes]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const { input, errors: clientErrors } = valuesToInput(values);
    setErrors(clientErrors);
    setFormError(null);
    if (!input) {
      setFormError("Some fields need attention.");
      return;
    }
    setSaving(true);
    try {
      const saved = await onSubmit(input);
      if (saved) {
        setValues(saved);
        setBaseline(comparable(saved));
      } else {
        setBaseline(comparable(values));
      }
      setSavedAt(new Date());
    } catch (error) {
      setErrors(apiFieldErrors(error));
      setFormError(describeError(error));
    } finally {
      setSaving(false);
    }
  };

  const f = (name: string) => `${id}-${name}`;
  const stockBlocked =
    values.status === "PUBLISHED" &&
    (values.stockStatus === "IN_STOCK" || values.stockStatus === "LOW_STOCK") &&
    values.stockQuantity.trim() === "0";

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      aria-describedby={formError ? f("form-error") : undefined}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <AdminPanel title="Basic info">
            <div className="grid gap-5 md:grid-cols-2">
              <Field id={f("name")} label="Name" error={errors["name"]} className="md:col-span-2">
                <TextInput
                  id={f("name")}
                  value={values.name}
                  onChange={(event) => set("name", event.target.value)}
                  maxLength={160}
                  required
                  {...describedBy(f("name"), errors["name"])}
                />
              </Field>
              <Field
                id={f("sku")}
                label="SKU"
                error={errors["sku"]}
                hint="Unique stock code. Saved in capitals."
              >
                <TextInput
                  id={f("sku")}
                  value={values.sku}
                  onChange={(event) => set("sku", event.target.value.toUpperCase())}
                  maxLength={64}
                  className="font-mono"
                  required
                  {...describedBy(f("sku"), errors["sku"], "hint")}
                />
              </Field>
              <Field
                id={f("slug")}
                label="URL slug"
                error={errors["slug"]}
                hint={
                  isNew
                    ? "Leave empty to generate it from the name."
                    : "Changing it changes the product's URL."
                }
              >
                <TextInput
                  id={f("slug")}
                  value={values.slug}
                  onChange={(event) => set("slug", event.target.value.toLowerCase())}
                  placeholder={isNew ? "generated-from-name" : undefined}
                  maxLength={120}
                  className="font-mono"
                  {...describedBy(f("slug"), errors["slug"], "hint")}
                />
              </Field>
              <Field
                id={f("summary")}
                label="Short description"
                error={errors["shortDescription"]}
                hint="One or two sentences for product cards."
                className="md:col-span-2"
              >
                <TextArea
                  id={f("summary")}
                  value={values.shortDescription}
                  onChange={(event) => set("shortDescription", event.target.value)}
                  maxLength={300}
                  rows={2}
                  className="min-h-16"
                  {...describedBy(f("summary"), errors["shortDescription"], "hint")}
                />
              </Field>
              <Field
                id={f("description")}
                label="Full description"
                error={errors["description"]}
                hint="Shown on the product page. Blank lines start new paragraphs."
                className="md:col-span-2"
              >
                <TextArea
                  id={f("description")}
                  value={values.description}
                  onChange={(event) => set("description", event.target.value)}
                  maxLength={10000}
                  rows={7}
                  {...describedBy(f("description"), errors["description"], "hint")}
                />
              </Field>
            </div>
          </AdminPanel>

          {mediaSlot}

          <AdminPanel title="Pricing" description="Amounts in rupees. Stored to the paisa.">
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id={f("price")} label="Price (₹)" error={errors["price"]}>
                <TextInput
                  id={f("price")}
                  inputMode="decimal"
                  value={values.price}
                  onChange={(event) => set("price", event.target.value)}
                  required
                  {...describedBy(f("price"), errors["price"])}
                />
              </Field>
              <Field
                id={f("compare")}
                label="Compare-at price (₹)"
                error={errors["compareAtPrice"]}
                hint="Optional. Shown struck through."
              >
                <TextInput
                  id={f("compare")}
                  inputMode="decimal"
                  value={values.compareAtPrice}
                  onChange={(event) => set("compareAtPrice", event.target.value)}
                  {...describedBy(f("compare"), errors["compareAtPrice"], "hint")}
                />
              </Field>
              <Field id={f("currency")} label="Currency" hint="INR only for now.">
                <TextInput id={f("currency")} value="INR" readOnly disabled />
              </Field>
            </div>
          </AdminPanel>

          <AdminPanel
            title="Specifications"
            description="Label and value rows, optionally grouped under a heading."
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  set("specifications", [
                    ...values.specifications,
                    { key: newRowKey(), groupName: "", label: "", value: "" },
                  ])
                }
              >
                <Plus className="size-3.5" aria-hidden />
                Add row
              </Button>
            }
          >
            {values.specifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No specifications yet.</p>
            ) : (
              <ol className="space-y-3">
                {values.specifications.map((row, index) => {
                  const update = (patch: Partial<typeof row>) =>
                    set(
                      "specifications",
                      values.specifications.map((entry) =>
                        entry.key === row.key ? { ...entry, ...patch } : entry,
                      ),
                    );
                  const move = (offset: number) => {
                    const next = [...values.specifications];
                    const [moved] = next.splice(index, 1);
                    if (moved) next.splice(index + offset, 0, moved);
                    set("specifications", next);
                  };
                  const rowError = errors[`specifications.${index}`];
                  return (
                    <li key={row.key} className="rounded-sm border border-border p-3">
                      <div className="grid gap-2 md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                        <TextInput
                          aria-label={`Row ${index + 1} group (optional)`}
                          placeholder="Group (optional)"
                          value={row.groupName}
                          onChange={(event) => update({ groupName: event.target.value })}
                          maxLength={60}
                          className="mt-0 h-10"
                        />
                        <TextInput
                          aria-label={`Row ${index + 1} label`}
                          placeholder="Label, e.g. Capacity"
                          value={row.label}
                          onChange={(event) => update({ label: event.target.value })}
                          maxLength={80}
                          className="mt-0 h-10"
                          aria-invalid={rowError ? true : undefined}
                        />
                        <TextInput
                          aria-label={`Row ${index + 1} value`}
                          placeholder="Value, e.g. 38 L per side"
                          value={row.value}
                          onChange={(event) => update({ value: event.target.value })}
                          maxLength={300}
                          className="mt-0 h-10"
                          aria-invalid={rowError ? true : undefined}
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            className={smallIconButton}
                            onClick={() => move(-1)}
                            disabled={index === 0}
                            aria-label={`Move row ${index + 1} up`}
                          >
                            <ArrowUp className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={smallIconButton}
                            onClick={() => move(1)}
                            disabled={index === values.specifications.length - 1}
                            aria-label={`Move row ${index + 1} down`}
                          >
                            <ArrowDown className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={smallIconButton}
                            onClick={() =>
                              set(
                                "specifications",
                                values.specifications.filter((entry) => entry.key !== row.key),
                              )
                            }
                            aria-label={`Remove row ${index + 1}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                      {rowError ? (
                        <p className="mt-2 text-xs text-destructive">{rowError}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </AdminPanel>

          <AdminPanel
            title="Compatibility"
            description="Which motorcycles this fits. Riders see a “Fits your bike” badge for these."
          >
            <Checkbox
              id={f("universal")}
              label="Fits any motorcycle"
              description="For rider gear such as helmets, jackets and tool rolls."
              checked={values.universalFit}
              onChange={(checked) => set("universalFit", checked)}
            />
            {values.universalFit ? null : (
              <div className="mt-5">
                {values.compatibility.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No bikes yet. Without any, the product shows no fitment badge.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {values.compatibility.map((row, index) => {
                      const model = bikes.find((bike) => bike.id === row.bikeModelId);
                      const update = (patch: Partial<typeof row>) =>
                        set(
                          "compatibility",
                          values.compatibility.map((entry) =>
                            entry.key === row.key ? { ...entry, ...patch } : entry,
                          ),
                        );
                      const rowError =
                        errors[`compatibility.${index}.bikeModelId`] ??
                        errors[`compatibility.${index}.bikeVariantId`];
                      return (
                        <li key={row.key}>
                          <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                            <SelectInput
                              aria-label={`Bike ${index + 1}`}
                              value={row.bikeModelId}
                              onChange={(event) =>
                                update({ bikeModelId: event.target.value, bikeVariantId: "" })
                              }
                              className="mt-0 h-10"
                              aria-invalid={rowError ? true : undefined}
                            >
                              <option value="">Choose a bike</option>
                              {bikesByBrand.map(([brand, models]) => (
                                <optgroup key={brand} label={brand}>
                                  {models.map((bike) => (
                                    <option key={bike.id} value={bike.id}>
                                      {bike.name}
                                      {bike.archivedAt ? " (archived)" : ""}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </SelectInput>
                            <SelectInput
                              aria-label={`Bike ${index + 1} variant`}
                              value={row.bikeVariantId}
                              onChange={(event) => update({ bikeVariantId: event.target.value })}
                              disabled={!model || model.variants.length === 0}
                              className="mt-0 h-10"
                            >
                              <option value="">All variants</option>
                              {model?.variants.map((variant) => (
                                <option key={variant.id} value={variant.id}>
                                  {variant.name}
                                  {variant.archivedAt ? " (archived)" : ""}
                                </option>
                              ))}
                            </SelectInput>
                            <TextInput
                              aria-label={`Bike ${index + 1} fitment note (optional)`}
                              placeholder="Note (optional)"
                              value={row.note}
                              onChange={(event) => update({ note: event.target.value })}
                              maxLength={200}
                              className="mt-0 h-10"
                            />
                            <button
                              type="button"
                              className={smallIconButton}
                              onClick={() =>
                                set(
                                  "compatibility",
                                  values.compatibility.filter((entry) => entry.key !== row.key),
                                )
                              }
                              aria-label={`Remove bike ${index + 1}`}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          </div>
                          {rowError ? (
                            <p className="mt-1 text-xs text-destructive">{rowError}</p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  disabled={bikes.length === 0}
                  onClick={() =>
                    set("compatibility", [
                      ...values.compatibility,
                      { key: newRowKey(), bikeModelId: "", bikeVariantId: "", note: "" },
                    ])
                  }
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add bike
                </Button>
                {bikes.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Add motorcycles under Bikes first.
                  </p>
                ) : null}
              </div>
            )}
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel title="Status">
            <fieldset>
              <legend className="sr-only">Product status</legend>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-sm border p-3 text-sm transition-colors",
                      values.status === option.value
                        ? "border-primary bg-surface"
                        : "border-border hover:border-border-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name={f("status")}
                      value={option.value}
                      checked={values.status === option.value}
                      onChange={() => set("status", option.value)}
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
            {values.status === "PUBLISHED" && imageCount === 0 ? (
              <p className="mt-3 text-xs text-warning">
                No photos yet: the shop will show a placeholder until you add some.
              </p>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Organisation">
            <div className="space-y-5">
              <Field id={f("category")} label="Category" error={errors["categoryId"]}>
                <SelectInput
                  id={f("category")}
                  value={values.categoryId}
                  onChange={(event) => set("categoryId", event.target.value)}
                  required
                  {...describedBy(f("category"), errors["categoryId"])}
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field id={f("brand")} label="Brand" error={errors["brandId"]} hint="Optional.">
                <SelectInput
                  id={f("brand")}
                  value={values.brandId}
                  onChange={(event) => set("brandId", event.target.value)}
                  {...describedBy(f("brand"), errors["brandId"], "hint")}
                >
                  <option value="">No brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Checkbox
                id={f("featured")}
                label="Featured"
                description="Listed first in the shop."
                checked={values.featured}
                onChange={(checked) => set("featured", checked)}
              />
            </div>
          </AdminPanel>

          <AdminPanel title="Inventory">
            <div className="space-y-5">
              <Field id={f("stock")} label="Quantity on hand" error={errors["stockQuantity"]}>
                <TextInput
                  id={f("stock")}
                  inputMode="numeric"
                  value={values.stockQuantity}
                  onChange={(event) => set("stockQuantity", event.target.value)}
                  {...describedBy(f("stock"), errors["stockQuantity"])}
                />
              </Field>
              <Field id={f("stock-status")} label="Stock status" error={errors["stockStatus"]}>
                <SelectInput
                  id={f("stock-status")}
                  value={values.stockStatus}
                  onChange={(event) => set("stockStatus", event.target.value as ApiStockStatus)}
                >
                  {STOCK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              {stockBlocked ? (
                <p className="text-xs text-warning">
                  Riders can't buy this until the quantity is above 0.
                </p>
              ) : null}
              <Field
                id={f("weight")}
                label="Shipping weight (g)"
                error={errors["weightGrams"]}
                hint="Optional."
              >
                <TextInput
                  id={f("weight")}
                  inputMode="numeric"
                  value={values.weightGrams}
                  onChange={(event) => set("weightGrams", event.target.value)}
                  {...describedBy(f("weight"), errors["weightGrams"], "hint")}
                />
              </Field>
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
        <Button type="submit" className="w-full sm:w-auto min-h-11" disabled={saving || (!isNew && !dirty)}>
          {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </Button>
        <p id={f("form-error")} role="status" className="text-sm">
          {formError ? (
            <span className="text-destructive">{formError}</span>
          ) : dirty ? (
            <span className="text-warning">Unsaved changes</span>
          ) : savedAt ? (
            <span className="text-success">Saved</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
