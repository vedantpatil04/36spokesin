import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { type ImageChoice, SingleImageField } from "@/components/admin/SingleImageField";
import { tableClasses } from "@/components/admin/admin-format";
import {
  AdminPageHeader,
  AdminPanel,
  Field,
  InlineError,
  TextArea,
} from "@/components/admin/admin-ui";
import { useCatalogRefresh } from "@/components/admin/use-admin";
import { ErrorState, Skeleton } from "@/components/states";
import { Badge, Button, SelectInput, TextInput } from "@/components/ui-kit";
import type { ApiAdminBikeModel, ApiBikeBrand, ApiBikeSegment } from "@/lib/api";
import {
  createBikeBrand,
  createBikeModel,
  createBikeVariant,
  listAdminBikes,
  listBikeBrands,
  updateBikeBrand,
  updateBikeModel,
  updateBikeVariant,
} from "@/services/admin/bikes";
import { describeError } from "@/services/request-helpers";

const SEGMENTS: ApiBikeSegment[] = [
  "ADVENTURE",
  "SCRAMBLER",
  "TOURING",
  "STREET",
  "CRUISER",
  "SPORT",
];
const segmentLabel = (segment: ApiBikeSegment) =>
  segment.charAt(0) + segment.slice(1).toLowerCase();

export const Route = createFileRoute("/admin/bikes")({
  component: BikesAdminPage,
});

function BikesAdminPage() {
  const brands = useQuery({ queryKey: ["admin", "bike-brands"], queryFn: listBikeBrands });
  const bikes = useQuery({ queryKey: ["admin", "bikes"], queryFn: listAdminBikes });
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const editingBike = bikes.data?.find((bike) => bike.id === editing) ?? null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bikes"
        description="The motorcycle catalogue riders pick from in the Garage, and products are matched to. Entries are archived, never deleted, so garages and fitment keep working."
      />

      {brands.isPending || bikes.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : brands.isError || bikes.isError ? (
        <ErrorState
          title="The bike catalogue didn't load"
          onRetry={() => {
            void brands.refetch();
            void bikes.refetch();
          }}
        />
      ) : (
        <>
          {editing ? (
            <AdminPanel
              title={
                editing === "new"
                  ? "New motorcycle"
                  : `Edit ${editingBike?.brand.name ?? ""} ${editingBike?.name ?? ""}`
              }
            >
              <BikeModelForm
                key={editing}
                bike={editingBike}
                brands={brands.data}
                onDone={() => setEditing(null)}
                onCreated={(id) => setEditing(id)}
              />
              {editingBike ? <VariantManager bike={editingBike} /> : null}
            </AdminPanel>
          ) : null}

          <AdminPanel
            title="Models"
            actions={
              <Button
                size="sm"
                onClick={() => setEditing("new")}
                disabled={brands.data.length === 0 || editing !== null}
              >
                <Plus className="size-3.5" aria-hidden />
                New motorcycle
              </Button>
            }
          >
            {bikes.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {brands.data.length === 0
                  ? "Add a brand below, then its models."
                  : "No motorcycles yet."}
              </p>
            ) : (
              <div className={tableClasses.wrapper}>
                <table className={tableClasses.table}>
                  <thead className={tableClasses.head}>
                    <tr>
                      <th scope="col" className={tableClasses.th}>
                        <span className="sr-only">Image</span>
                      </th>
                      <th scope="col" className={tableClasses.th}>
                        Motorcycle
                      </th>
                      <th scope="col" className={tableClasses.th}>
                        Segment
                      </th>
                      <th scope="col" className={tableClasses.th}>
                        Variants
                      </th>
                      <th scope="col" className={`${tableClasses.th} text-right`}>
                        In garages
                      </th>
                      <th scope="col" className={`${tableClasses.th} text-right`}>
                        Fitment
                      </th>
                      <th scope="col" className={tableClasses.th}>
                        Status
                      </th>
                      <th scope="col" className={`${tableClasses.th} text-right`}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bikes.data.map((bike) => (
                      <tr key={bike.id} className={tableClasses.row}>
                        <td className={`${tableClasses.td} w-16`}>
                          <div className="h-10 w-14 overflow-hidden rounded-sm border border-border bg-surface">
                            {bike.image?.url ? (
                              <img src={bike.image.url} alt="" className="size-full object-cover" />
                            ) : null}
                          </div>
                        </td>
                        <td className={tableClasses.td}>
                          <span className="text-xs text-muted-foreground">{bike.brand.name}</span>
                          <span className="block font-semibold">{bike.name}</span>
                        </td>
                        <td className={`${tableClasses.td} text-muted-foreground`}>
                          {segmentLabel(bike.segment)}
                        </td>
                        <td className={`${tableClasses.td} text-muted-foreground`}>
                          {bike.variants.filter((variant) => !variant.archivedAt).length}
                        </td>
                        <td className={`${tableClasses.td} text-right tabular-nums`}>
                          {bike.riderCount}
                        </td>
                        <td className={`${tableClasses.td} text-right tabular-nums`}>
                          {bike.productCount}
                        </td>
                        <td className={tableClasses.td}>
                          {bike.archivedAt ? (
                            <Badge tone="warning">archived</Badge>
                          ) : (
                            <Badge tone="success">active</Badge>
                          )}
                        </td>
                        <td className={tableClasses.td}>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(bike.id)}
                              disabled={editing !== null}
                              aria-label={`Edit ${bike.brand.name} ${bike.name}`}
                            >
                              <Pencil className="size-3.5" aria-hidden />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminPanel>

          <AdminPanel
            title="Brands"
            description="Archiving a brand hides all its models from riders."
          >
            <BikeBrandManager brands={brands.data} />
          </AdminPanel>
        </>
      )}
    </div>
  );
}

const optionalNumber = (value: string, integer: boolean): number | null | "invalid" => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0 || (integer && !Number.isInteger(parsed)))
    return "invalid";
  return parsed;
};

function BikeModelForm({
  bike,
  brands,
  onDone,
  onCreated,
}: {
  bike: ApiAdminBikeModel | null;
  brands: ApiBikeBrand[];
  onDone: () => void;
  onCreated: (id: string) => void;
}) {
  const id = useId();
  const refresh = useCatalogRefresh();
  const [brandId, setBrandId] = useState(
    bike?.brand.id ?? brands.find((brand) => !brand.archivedAt)?.id ?? "",
  );
  const [name, setName] = useState(bike?.name ?? "");
  const [slug, setSlug] = useState(bike?.slug ?? "");
  const [segment, setSegment] = useState<ApiBikeSegment>(bike?.segment ?? "ADVENTURE");
  const [displacement, setDisplacement] = useState(
    bike?.displacementCc ? String(bike.displacementCc) : "",
  );
  const [economy, setEconomy] = useState(
    bike?.fuelEfficiencyKmpl ? String(bike.fuelEfficiencyKmpl) : "",
  );
  const [tank, setTank] = useState(bike?.tankLitres ? String(bike.tankLitres) : "");
  const [description, setDescription] = useState(bike?.description ?? "");
  const [variants, setVariants] = useState("");
  const [image, setImage] = useState<ImageChoice>(
    bike?.image ? { id: bike.image.id, url: bike.image.url } : null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const displacementCc = optionalNumber(displacement, true);
    const fuelEfficiencyKmpl = optionalNumber(economy, false);
    const tankLitres = optionalNumber(tank, false);
    if (!brandId) return setError("Choose a brand.");
    if (!name.trim()) return setError("Enter the model name.");
    if (
      displacementCc === "invalid" ||
      fuelEfficiencyKmpl === "invalid" ||
      tankLitres === "invalid"
    ) {
      return setError("Engine, economy and tank must be positive numbers.");
    }
    setPending(true);
    setError(null);
    const input = {
      brandId,
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim().toLowerCase() } : {}),
      segment,
      description: description.trim() || null,
      displacementCc,
      fuelEfficiencyKmpl,
      tankLitres,
      imageMediaId: image?.id ?? null,
    };
    try {
      if (bike) {
        await updateBikeModel(bike.id, input);
        await refresh(["admin", "bikes"]);
        onDone();
      } else {
        const created = await createBikeModel({
          ...input,
          variants: variants
            .split(",")
            .map((variant) => variant.trim())
            .filter(Boolean),
        });
        await refresh(["admin", "bikes"]);
        onCreated(created.id);
      }
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  };

  const toggleArchive = async () => {
    if (!bike) return;
    const archiving = !bike.archivedAt;
    if (
      archiving &&
      !window.confirm(
        `Archive the ${bike.brand.name} ${bike.name}? Riders who own it keep it in their garage.`,
      )
    )
      return;
    setPending(true);
    setError(null);
    try {
      await updateBikeModel(bike.id, { archived: archiving });
      await refresh(["admin", "bikes"]);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <Field id={`${id}-brand`} label="Brand">
        <SelectInput
          id={`${id}-brand`}
          value={brandId}
          onChange={(event) => setBrandId(event.target.value)}
        >
          <option value="">Choose a brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
              {brand.archivedAt ? " (archived)" : ""}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field id={`${id}-name`} label="Model">
        <TextInput
          id={`${id}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder="Himalayan 450"
        />
      </Field>
      <Field id={`${id}-segment`} label="Segment">
        <SelectInput
          id={`${id}-segment`}
          value={segment}
          onChange={(event) => setSegment(event.target.value as ApiBikeSegment)}
        >
          {SEGMENTS.map((value) => (
            <option key={value} value={value}>
              {segmentLabel(value)}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field
        id={`${id}-slug`}
        label="URL slug"
        hint={bike ? "Changing it changes /garage/… links." : "Leave empty to generate it."}
      >
        <TextInput
          id={`${id}-slug`}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="font-mono"
          maxLength={120}
        />
      </Field>
      <Field id={`${id}-cc`} label="Engine (cc)">
        <TextInput
          id={`${id}-cc`}
          inputMode="numeric"
          value={displacement}
          onChange={(event) => setDisplacement(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field id={`${id}-kmpl`} label="Economy (km/l)">
          <TextInput
            id={`${id}-kmpl`}
            inputMode="decimal"
            value={economy}
            onChange={(event) => setEconomy(event.target.value)}
          />
        </Field>
        <Field id={`${id}-tank`} label="Tank (L)">
          <TextInput
            id={`${id}-tank`}
            inputMode="decimal"
            value={tank}
            onChange={(event) => setTank(event.target.value)}
          />
        </Field>
      </div>
      <Field id={`${id}-description`} label="Description" className="md:col-span-2">
        <TextArea
          id={`${id}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
          rows={3}
        />
      </Field>
      <SingleImageField
        label="Image"
        category="BIKE"
        value={image}
        onChange={setImage}
        disabled={pending}
      />
      {!bike ? (
        <Field
          id={`${id}-variants`}
          label="Variants"
          hint="Comma separated, e.g. Kaza Brown, Hanle Black"
          className="md:col-span-2 xl:col-span-3"
        >
          <TextInput
            id={`${id}-variants`}
            value={variants}
            onChange={(event) => setVariants(event.target.value)}
          />
        </Field>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {bike ? "Save motorcycle" : "Create motorcycle"}
        </Button>
        {bike ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void toggleArchive()}
            disabled={pending}
          >
            {bike.archivedAt ? "Restore" : "Archive"}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          {bike ? "Close" : "Cancel"}
        </Button>
        <InlineError message={error} />
      </div>
    </form>
  );
}

function VariantManager({ bike }: { bike: ApiAdminBikeModel }) {
  const id = useId();
  const refresh = useCatalogRefresh();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setPending(true);
    setError(null);
    try {
      await action();
      await refresh(["admin", "bikes"]);
      return true;
    } catch (caught) {
      setError(describeError(caught));
      return false;
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="font-display text-sm uppercase tracking-[0.16em]">Variants</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {bike.variants.map((variant) => (
          <li
            key={variant.id}
            className="flex items-center gap-2 rounded-sm border border-border py-1 pl-3 pr-1 text-sm"
          >
            <span className={variant.archivedAt ? "text-muted-foreground line-through" : ""}>
              {variant.name}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              disabled={pending}
              onClick={() =>
                void run(() =>
                  updateBikeVariant(bike.id, variant.id, { archived: !variant.archivedAt }),
                )
              }
            >
              {variant.archivedAt ? "Restore" : "Archive"}
            </Button>
          </li>
        ))}
        {bike.variants.length === 0 ? (
          <li className="text-sm text-muted-foreground">No variants yet.</li>
        ) : null}
      </ul>
      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          void run(() => createBikeVariant(bike.id, { name: name.trim() })).then(
            (ok) => ok && setName(""),
          );
        }}
      >
        <label htmlFor={`${id}-variant`} className="sr-only">
          New variant name
        </label>
        <TextInput
          id={`${id}-variant`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New variant"
          maxLength={60}
          className="mt-0 h-10 max-w-xs"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-10"
          disabled={pending || !name.trim()}
        >
          Add variant
        </Button>
      </form>
      <div className="mt-2">
        <InlineError message={error} />
      </div>
    </div>
  );
}

function BikeBrandManager({ brands }: { brands: ApiBikeBrand[] }) {
  const id = useId();
  const refresh = useCatalogRefresh();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setPending(true);
    setError(null);
    try {
      await action();
      await refresh(["admin", "bike-brands"], ["admin", "bikes"]);
      return true;
    } catch (caught) {
      setError(describeError(caught));
      return false;
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          void run(() => createBikeBrand({ name: name.trim() })).then((ok) => ok && setName(""));
        }}
      >
        <label htmlFor={`${id}-brand`} className="sr-only">
          New brand name
        </label>
        <TextInput
          id={`${id}-brand`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New brand, e.g. Royal Enfield"
          maxLength={60}
          className="mt-0 h-11 max-w-sm"
        />
        <Button type="submit" variant="outline" disabled={pending || !name.trim()}>
          Add brand
        </Button>
      </form>
      <InlineError message={error} />
      <ul className="divide-y divide-border rounded-sm border border-border">
        {brands.map((brand) => (
          <li key={brand.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
            <span
              className={brand.archivedAt ? "flex-1 text-muted-foreground line-through" : "flex-1"}
            >
              {brand.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {brand.modelCount} model{brand.modelCount === 1 ? "" : "s"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                if (
                  !brand.archivedAt &&
                  !window.confirm(`Archive ${brand.name}? Its models disappear from the Garage.`)
                )
                  return;
                void run(() => updateBikeBrand(brand.id, { archived: !brand.archivedAt }));
              }}
            >
              {brand.archivedAt ? "Restore" : "Archive"}
            </Button>
          </li>
        ))}
        {brands.length === 0 ? (
          <li className="px-3 py-2.5 text-sm text-muted-foreground">No brands yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
