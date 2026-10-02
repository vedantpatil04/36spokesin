import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ExternalLink, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { Button, ButtonLink, SelectInput, TextInput } from "@/components/ui-kit";
import type {
  ApiAdminDestination,
  ApiAdminTrip,
  ApiContentStatus,
  ApiDepartureStatus,
  ApiDifficulty,
} from "@/lib/api";
import { minorToRupees, rupeesToMinor } from "@/lib/money";
import { tripGalleryApi } from "@/services/admin/gallery";
import { type TripInput, createTrip, updateTrip } from "@/services/admin/travel";
import { describeError } from "@/services/request-helpers";
import { ProductMediaManager } from "../ProductMediaManager";
import { StatusRadios } from "../StatusRadios";
import { describedBy, fieldErrors, optionalInt, orNull } from "../admin-format";
import {
  CONTENT_STATUS_OPTIONS,
  DEPARTURE_STATUS_OPTIONS,
  DIFFICULTY_OPTIONS,
} from "../admin-options";
import {
  AdminPageHeader,
  AdminPanel,
  Checkbox,
  Field,
  ProductStatusBadge,
  TextArea,
} from "../admin-ui";
import { useCatalogRefresh } from "../use-admin";

type DayRow = {
  key: string;
  title: string;
  description: string;
  routeSummary: string;
  distanceKm: string;
  accommodation: string;
  notes: string;
};
type DepartureRow = {
  key: string;
  id?: string;
  startDate: string;
  endDate: string;
  price: string;
  capacity: string;
  status: ApiDepartureStatus;
};

let rowKey = 0;
const key = () => `row-${(rowKey += 1)}`;

function toDepartureRows(trip: ApiAdminTrip | null): DepartureRow[] {
  return (trip?.departures ?? []).map((departure) => ({
    key: key(),
    id: departure.id,
    startDate: departure.startDate,
    endDate: departure.endDate,
    price: departure.price !== null ? String(minorToRupees(departure.price)) : "",
    capacity: String(departure.capacity),
    status: departure.status,
  }));
}
const iconButton =
  "flex size-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

/** Create (trip = null) or edit a trip: details, itinerary, departures and photos. */
export function TripEditor({
  trip,
  destinations,
}: {
  trip: ApiAdminTrip | null;
  destinations: ApiAdminDestination[];
}) {
  const id = useId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refresh = useCatalogRefresh();
  const [values, setValues] = useState({
    name: trip?.name ?? "",
    slug: trip?.slug ?? "",
    destinationId: trip?.destination.id ?? "",
    durationDays: trip ? String(trip.durationDays) : "",
    distanceKm: trip?.distanceKm != null ? String(trip.distanceKm) : "",
    difficulty: trip?.difficulty ?? ("MODERATE" as ApiDifficulty),
    startingLocation: trip?.startingLocation ?? "",
    endingLocation: trip?.endingLocation ?? "",
    shortDescription: trip?.shortDescription ?? "",
    description: trip?.description ?? "",
    status: trip?.status ?? ("DRAFT" as ApiContentStatus),
    featured: trip?.featured ?? false,
  });
  const [days, setDays] = useState<DayRow[]>(
    (trip?.itinerary ?? []).map((day) => ({
      key: key(),
      title: day.title,
      description: day.description ?? "",
      routeSummary: day.routeSummary ?? "",
      distanceKm: day.distanceKm != null ? String(day.distanceKm) : "",
      accommodation: day.accommodation ?? "",
      notes: day.notes ?? "",
    })),
  );
  const [departures, setDepartures] = useState<DepartureRow[]>(() => toDepartureRows(trip));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof values>(field: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [field]: value }));
  const f = (name: string) => `${id}-${name}`;

  const buildInput = (): { input: TripInput | null; errors: Record<string, string> } => {
    const problems: Record<string, string> = {};
    const durationDays = optionalInt(values.durationDays);
    const distanceKm = optionalInt(values.distanceKm);
    if (values.name.trim().length < 2) problems["name"] = "Enter a name.";
    if (!values.destinationId) problems["destinationId"] = "Choose a destination.";
    if (!durationDays || Number.isNaN(durationDays) || durationDays < 1)
      problems["durationDays"] = "Enter the number of days.";
    if (Number.isNaN(distanceKm)) problems["distanceKm"] = "Whole kilometres.";
    if (values.startingLocation.trim().length < 2)
      problems["startingLocation"] = "Enter where it starts.";
    const itinerary = days.map((day, index) => {
      const dayKm = optionalInt(day.distanceKm);
      if (!day.title.trim()) problems[`itinerary.${index}.title`] = "Each day needs a title.";
      if (Number.isNaN(dayKm)) problems[`itinerary.${index}.distanceKm`] = "Whole kilometres.";
      return {
        title: day.title.trim(),
        description: orNull(day.description),
        routeSummary: orNull(day.routeSummary),
        distanceKm: Number.isNaN(dayKm) ? null : dayKm,
        accommodation: orNull(day.accommodation),
        notes: orNull(day.notes),
      };
    });
    const departureInputs = departures.map((row, index) => {
      const capacity = optionalInt(row.capacity);
      const price = row.price.trim() === "" ? null : Number(row.price);
      if (!row.startDate || !row.endDate)
        problems[`departures.${index}.startDate`] = "Enter both dates.";
      else if (row.endDate < row.startDate)
        problems[`departures.${index}.endDate`] = "Ends before it starts.";
      if (!capacity || Number.isNaN(capacity) || capacity < 1)
        problems[`departures.${index}.capacity`] = "Seats must be 1 or more.";
      if (price !== null && (!Number.isFinite(price) || price < 0))
        problems[`departures.${index}.price`] = "Enter a price in rupees.";
      return {
        ...(row.id ? { id: row.id } : {}),
        startDate: row.startDate,
        endDate: row.endDate,
        price: price === null || !Number.isFinite(price) ? null : rupeesToMinor(price),
        capacity: capacity ?? 0,
        status: row.status,
      };
    });
    if (Object.keys(problems).length > 0) return { input: null, errors: problems };
    return {
      errors: problems,
      input: {
        name: values.name.trim(),
        ...(values.slug.trim() ? { slug: values.slug.trim().toLowerCase() } : {}),
        destinationId: values.destinationId,
        durationDays: durationDays!,
        distanceKm,
        difficulty: values.difficulty,
        startingLocation: values.startingLocation.trim(),
        endingLocation: orNull(values.endingLocation),
        shortDescription: orNull(values.shortDescription),
        description: orNull(values.description),
        status: values.status,
        featured: values.featured,
        itinerary,
        departures: departureInputs,
      },
    };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const { input, errors: problems } = buildInput();
    setErrors(problems);
    if (!input) return setMessage({ tone: "error", text: "Some fields need attention." });
    setSaving(true);
    setMessage(null);
    try {
      if (trip) {
        const saved = await updateTrip(trip.id, input);
        queryClient.setQueryData(["admin", "trip", trip.id], saved);
        // New departures now have ids (and the API sorts by date): take the saved list.
        setDepartures(toDepartureRows(saved));
        await refresh(["admin", "trips"]);
        setMessage({ tone: "ok", text: "Saved" });
      } else {
        const created = await createTrip(input);
        await refresh(["admin", "trips"]);
        await navigate({
          to: "/admin/trips/$tripId",
          params: { tripId: created.id },
          hash: "product-media",
        });
      }
    } catch (error) {
      setErrors(fieldErrors(error));
      setMessage({ tone: "error", text: describeError(error) });
    } finally {
      setSaving(false);
    }
  };

  const moveDay = (index: number, offset: number) =>
    setDays((rows) => {
      const next = [...rows];
      const [moved] = next.splice(index, 1);
      if (moved) next.splice(index + offset, 0, moved);
      return next;
    });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Trips"
        title={trip?.name ?? "New trip"}
        {...(trip
          ? {}
          : { description: "Save the details first; photos can be added straight after." })}
        actions={
          trip ? (
            <>
              <ProductStatusBadge status={trip.status} />
              {trip.status === "PUBLISHED" ? (
                <ButtonLink
                  to="/travel/trips/$slug"
                  params={{ slug: trip.slug }}
                  variant="outline"
                  size="sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  View on site
                </ButtonLink>
              ) : null}
            </>
          ) : (
            <ButtonLink to="/admin/trips" variant="outline">
              Cancel
            </ButtonLink>
          )
        }
      />

      <form onSubmit={(event) => void submit(event)} noValidate>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-6">
            <AdminPanel title="Basic info">
              <div className="grid gap-5 md:grid-cols-2">
                <Field id={f("name")} label="Name" error={errors["name"]}>
                  <TextInput
                    id={f("name")}
                    value={values.name}
                    onChange={(e) => set("name", e.target.value)}
                    maxLength={160}
                    {...describedBy(f("name"), errors["name"])}
                  />
                </Field>
                <Field
                  id={f("slug")}
                  label="URL slug"
                  error={errors["slug"]}
                  hint={trip ? "Changing it changes the page URL." : "Leave empty to generate it."}
                >
                  <TextInput
                    id={f("slug")}
                    value={values.slug}
                    onChange={(e) => set("slug", e.target.value.toLowerCase())}
                    className="font-mono"
                    maxLength={120}
                    {...describedBy(f("slug"), errors["slug"], "hint")}
                  />
                </Field>
                <Field
                  id={f("short")}
                  label="Short description"
                  hint="One line for cards."
                  className="md:col-span-2"
                >
                  <TextArea
                    id={f("short")}
                    value={values.shortDescription}
                    onChange={(e) => set("shortDescription", e.target.value)}
                    maxLength={300}
                    rows={2}
                    className="min-h-16"
                  />
                </Field>
                <Field id={f("description")} label="Description" className="md:col-span-2">
                  <TextArea
                    id={f("description")}
                    value={values.description}
                    onChange={(e) => set("description", e.target.value)}
                    maxLength={20000}
                    rows={6}
                  />
                </Field>
              </div>
            </AdminPanel>

            {trip ? (
              <ProductMediaManager
                productId={trip.id}
                productName={trip.name}
                initialImages={trip.images}
                api={tripGalleryApi}
                maxImages={30}
                onChange={() => void refresh(["admin", "trips"])}
              />
            ) : null}

            <AdminPanel
              title="Itinerary"
              description="Days are numbered in this order."
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDays((rows) => [
                      ...rows,
                      {
                        key: key(),
                        title: "",
                        description: "",
                        routeSummary: "",
                        distanceKm: "",
                        accommodation: "",
                        notes: "",
                      },
                    ])
                  }
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add day
                </Button>
              }
            >
              {days.length === 0 ? (
                <p className="text-sm text-muted-foreground">No days yet.</p>
              ) : (
                <ol className="space-y-3">
                  {days.map((day, index) => {
                    const update = (patch: Partial<DayRow>) =>
                      setDays((rows) =>
                        rows.map((row) => (row.key === day.key ? { ...row, ...patch } : row)),
                      );
                    const titleError = errors[`itinerary.${index}.title`];
                    return (
                      <li key={day.key} className="rounded-sm border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-display text-sm uppercase tracking-[0.14em] text-primary">
                            Day {index + 1}
                          </p>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              className={iconButton}
                              onClick={() => moveDay(index, -1)}
                              disabled={index === 0}
                              aria-label={`Move day ${index + 1} earlier`}
                            >
                              <ArrowUp className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              className={iconButton}
                              onClick={() => moveDay(index, 1)}
                              disabled={index === days.length - 1}
                              aria-label={`Move day ${index + 1} later`}
                            >
                              <ArrowDown className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              className={iconButton}
                              onClick={() =>
                                setDays((rows) => rows.filter((row) => row.key !== day.key))
                              }
                              aria-label={`Remove day ${index + 1}`}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <TextInput
                            aria-label={`Day ${index + 1} title`}
                            placeholder="Title, e.g. Manali to Kaza"
                            value={day.title}
                            onChange={(e) => update({ title: e.target.value })}
                            maxLength={160}
                            className="mt-0 h-10 md:col-span-2"
                            aria-invalid={titleError ? true : undefined}
                          />
                          <TextInput
                            aria-label={`Day ${index + 1} route`}
                            placeholder="Route, e.g. Atal Tunnel · Kunzum La"
                            value={day.routeSummary}
                            onChange={(e) => update({ routeSummary: e.target.value })}
                            maxLength={300}
                            className="mt-0 h-10"
                          />
                          <TextInput
                            aria-label={`Day ${index + 1} distance in km`}
                            placeholder="Distance (km)"
                            inputMode="numeric"
                            value={day.distanceKm}
                            onChange={(e) => update({ distanceKm: e.target.value })}
                            className="mt-0 h-10"
                          />
                          <TextInput
                            aria-label={`Day ${index + 1} accommodation`}
                            placeholder="Stay"
                            value={day.accommodation}
                            onChange={(e) => update({ accommodation: e.target.value })}
                            maxLength={200}
                            className="mt-0 h-10"
                          />
                          <TextInput
                            aria-label={`Day ${index + 1} notes`}
                            placeholder="Notes"
                            value={day.notes}
                            onChange={(e) => update({ notes: e.target.value })}
                            maxLength={2000}
                            className="mt-0 h-10"
                          />
                          <TextArea
                            aria-label={`Day ${index + 1} description`}
                            placeholder="What the day looks like"
                            value={day.description}
                            onChange={(e) => update({ description: e.target.value })}
                            maxLength={5000}
                            rows={2}
                            className="mt-0 min-h-16 md:col-span-2"
                          />
                        </div>
                        {(titleError ?? errors[`itinerary.${index}.distanceKm`]) ? (
                          <p className="mt-2 text-xs text-destructive">
                            {titleError ?? errors[`itinerary.${index}.distanceKm`]}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              )}
            </AdminPanel>

            <AdminPanel
              title="Departures"
              description="Dated runs of this trip. Prices in rupees. Cancelled departures are hidden from the site."
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDepartures((rows) => [
                      ...rows,
                      {
                        key: key(),
                        startDate: "",
                        endDate: "",
                        price: "",
                        capacity: "12",
                        status: "OPEN",
                      },
                    ])
                  }
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add departure
                </Button>
              }
            >
              {departures.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No departures yet. The trip shows "Dates to be announced".
                </p>
              ) : (
                <ul className="space-y-2">
                  {departures.map((row, index) => {
                    const update = (patch: Partial<DepartureRow>) =>
                      setDepartures((rows) =>
                        rows.map((entry) =>
                          entry.key === row.key ? { ...entry, ...patch } : entry,
                        ),
                      );
                    const rowError = ["startDate", "endDate", "price", "capacity"]
                      .map((name) => errors[`departures.${index}.${name}`])
                      .find(Boolean);
                    return (
                      <li key={row.key}>
                        <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_6rem_9rem_auto]">
                          <TextInput
                            type="date"
                            aria-label={`Departure ${index + 1} start date`}
                            value={row.startDate}
                            onChange={(e) => update({ startDate: e.target.value })}
                            className="mt-0 h-10 [color-scheme:dark]"
                          />
                          <TextInput
                            type="date"
                            aria-label={`Departure ${index + 1} end date`}
                            value={row.endDate}
                            onChange={(e) => update({ endDate: e.target.value })}
                            className="mt-0 h-10 [color-scheme:dark]"
                          />
                          <TextInput
                            aria-label={`Departure ${index + 1} price in rupees`}
                            placeholder="Price (₹)"
                            inputMode="decimal"
                            value={row.price}
                            onChange={(e) => update({ price: e.target.value })}
                            className="mt-0 h-10"
                          />
                          <TextInput
                            aria-label={`Departure ${index + 1} seats`}
                            placeholder="Seats"
                            inputMode="numeric"
                            value={row.capacity}
                            onChange={(e) => update({ capacity: e.target.value })}
                            className="mt-0 h-10"
                          />
                          <SelectInput
                            aria-label={`Departure ${index + 1} status`}
                            value={row.status}
                            onChange={(e) =>
                              update({ status: e.target.value as ApiDepartureStatus })
                            }
                            className="mt-0 h-10"
                          >
                            {DEPARTURE_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </SelectInput>
                          <button
                            type="button"
                            className={iconButton}
                            onClick={() =>
                              setDepartures((rows) => rows.filter((entry) => entry.key !== row.key))
                            }
                            aria-label={`Remove departure ${index + 1}`}
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
            </AdminPanel>
          </div>

          <div className="space-y-6">
            <AdminPanel title="Status">
              <StatusRadios
                name={f("status")}
                value={values.status}
                options={CONTENT_STATUS_OPTIONS}
                onChange={(value) => set("status", value)}
              />
            </AdminPanel>
            <AdminPanel title="Details">
              <div className="space-y-5">
                <Field id={f("destination")} label="Destination" error={errors["destinationId"]}>
                  <SelectInput
                    id={f("destination")}
                    value={values.destinationId}
                    onChange={(e) => set("destinationId", e.target.value)}
                    {...describedBy(f("destination"), errors["destinationId"])}
                  >
                    <option value="">Choose a destination</option>
                    {destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.name}
                        {destination.status !== "PUBLISHED"
                          ? ` (${destination.status.toLowerCase()})`
                          : ""}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field id={f("days")} label="Days" error={errors["durationDays"]}>
                    <TextInput
                      id={f("days")}
                      inputMode="numeric"
                      value={values.durationDays}
                      onChange={(e) => set("durationDays", e.target.value)}
                      {...describedBy(f("days"), errors["durationDays"])}
                    />
                  </Field>
                  <Field id={f("km")} label="Distance (km)" error={errors["distanceKm"]}>
                    <TextInput
                      id={f("km")}
                      inputMode="numeric"
                      value={values.distanceKm}
                      onChange={(e) => set("distanceKm", e.target.value)}
                      {...describedBy(f("km"), errors["distanceKm"])}
                    />
                  </Field>
                </div>
                <Field id={f("start")} label="Starts in" error={errors["startingLocation"]}>
                  <TextInput
                    id={f("start")}
                    value={values.startingLocation}
                    onChange={(e) => set("startingLocation", e.target.value)}
                    maxLength={120}
                    {...describedBy(f("start"), errors["startingLocation"])}
                  />
                </Field>
                <Field id={f("end")} label="Ends in">
                  <TextInput
                    id={f("end")}
                    value={values.endingLocation}
                    onChange={(e) => set("endingLocation", e.target.value)}
                    maxLength={120}
                  />
                </Field>
                <Field id={f("difficulty")} label="Difficulty">
                  <SelectInput
                    id={f("difficulty")}
                    value={values.difficulty}
                    onChange={(e) => set("difficulty", e.target.value as ApiDifficulty)}
                  >
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Checkbox
                  id={f("featured")}
                  label="Featured"
                  description="Listed first on Travel."
                  checked={values.featured}
                  onChange={(checked) => set("featured", checked)}
                />
              </div>
            </AdminPanel>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
          <Button type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            {trip ? "Save changes" : "Create trip"}
          </Button>
          {message ? (
            <p
              role="status"
              className={
                message.tone === "error" ? "text-sm text-destructive" : "text-sm text-success"
              }
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
