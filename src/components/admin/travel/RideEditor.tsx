import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { Button, ButtonLink, SelectInput, TextInput } from "@/components/ui-kit";
import type {
  ApiAdminDestination,
  ApiAdminRide,
  ApiAdminTrip,
  ApiDifficulty,
  ApiRideStatus,
  ApiRideType,
} from "@/lib/api";
import { minorToRupees, rupeesToMinor } from "@/lib/money";
import { rideGalleryApi } from "@/services/admin/gallery";
import { type RideInput, createRide, updateRide } from "@/services/admin/travel";
import { describeError } from "@/services/request-helpers";
import { ProductMediaManager } from "../ProductMediaManager";
import { StatusRadios } from "../StatusRadios";
import {
  describedBy,
  fieldErrors,
  fromIstInputs,
  optionalInt,
  orNull,
  toIstInputs,
} from "../admin-format";
import { DIFFICULTY_OPTIONS, RIDE_STATUS_OPTIONS, RIDE_TYPE_OPTIONS } from "../admin-options";
import {
  AdminPageHeader,
  AdminPanel,
  Checkbox,
  Field,
  RideStatusBadge,
  TextArea,
} from "../admin-ui";
import { useCatalogRefresh } from "../use-admin";
import { RideBookingsPanel } from "./RideBookingsPanel";

const PUBLIC: ApiRideStatus[] = ["UPCOMING", "FULL", "COMPLETED", "CANCELLED"];

/** Create (ride = null) or edit a ride: schedule, route, capacity, status and photos. */
export function RideEditor({
  ride,
  destinations,
  trips,
}: {
  ride: ApiAdminRide | null;
  destinations: ApiAdminDestination[];
  trips: ApiAdminTrip[];
}) {
  const id = useId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refresh = useCatalogRefresh();
  const start = ride ? toIstInputs(ride.startsAt) : { date: "", time: "06:00" };
  const [values, setValues] = useState({
    title: ride?.title ?? "",
    slug: ride?.slug ?? "",
    type: ride?.type ?? ("DAY_RIDE" as ApiRideType),
    location: ride?.location ?? "",
    meetingPoint: ride?.meetingPoint ?? "",
    date: start.date,
    time: start.time,
    durationLabel: ride?.durationLabel ?? "",
    routeStart: ride?.routeStart ?? "",
    routeFinish: ride?.routeFinish ?? "",
    waypoints: (ride?.waypoints ?? []).join(", "),
    routeSummary: ride?.routeSummary ?? "",
    distanceKm: ride?.distanceKm != null ? String(ride.distanceKm) : "",
    difficulty: ride?.difficulty ?? ("MODERATE" as ApiDifficulty),
    rideLeader: ride?.rideLeader ?? "",
    capacity: ride ? String(ride.capacity) : "15",
    price: ride?.price != null ? String(minorToRupees(ride.price)) : "",
    status: ride?.status ?? ("DRAFT" as ApiRideStatus),
    featured: ride?.featured ?? false,
    shortDescription: ride?.shortDescription ?? "",
    description: ride?.description ?? "",
    destinationId: ride?.destination?.id ?? "",
    tripId: ride?.trip?.id ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof values>(field: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [field]: value }));
  const f = (name: string) => `${id}-${name}`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problems: Record<string, string> = {};
    const capacity = optionalInt(values.capacity);
    const distanceKm = optionalInt(values.distanceKm);
    const price = values.price.trim() === "" ? null : Number(values.price);
    if (values.title.trim().length < 2) problems["title"] = "Enter a title.";
    if (values.location.trim().length < 2) problems["location"] = "Enter the town or region.";
    if (values.meetingPoint.trim().length < 2)
      problems["meetingPoint"] = "Enter where riders meet.";
    if (!values.date || !values.time) problems["startsAt"] = "Enter the date and start time.";
    if (!capacity || Number.isNaN(capacity) || capacity < 1)
      problems["capacity"] = "Capacity must be 1 or more.";
    if (price !== null && (!Number.isFinite(price) || price < 0))
      problems["price"] = "Enter a price in rupees.";
    if (Number.isNaN(distanceKm)) problems["distanceKm"] = "Whole kilometres.";
    setErrors(problems);
    if (Object.keys(problems).length > 0)
      return setMessage({ tone: "error", text: "Some fields need attention." });

    const input: RideInput = {
      title: values.title.trim(),
      ...(values.slug.trim() ? { slug: values.slug.trim().toLowerCase() } : {}),
      type: values.type,
      location: values.location.trim(),
      meetingPoint: values.meetingPoint.trim(),
      startsAt: fromIstInputs(values.date, values.time),
      durationLabel: orNull(values.durationLabel),
      routeStart: orNull(values.routeStart),
      routeFinish: orNull(values.routeFinish),
      waypoints: values.waypoints
        .split(",")
        .map((stop) => stop.trim())
        .filter(Boolean),
      routeSummary: orNull(values.routeSummary),
      distanceKm,
      difficulty: values.difficulty,
      rideLeader: orNull(values.rideLeader),
      capacity: capacity!,
      price: price === null ? null : rupeesToMinor(price),
      status: values.status,
      featured: values.featured,
      shortDescription: orNull(values.shortDescription),
      description: orNull(values.description),
      destinationId: values.destinationId || null,
      tripId: values.tripId || null,
    };
    setSaving(true);
    setMessage(null);
    try {
      if (ride) {
        const saved = await updateRide(ride.id, input);
        queryClient.setQueryData(["admin", "ride", ride.id], saved);
        await refresh(["admin", "rides"]);
        setMessage({ tone: "ok", text: "Saved" });
      } else {
        const created = await createRide(input);
        await refresh(["admin", "rides"]);
        await navigate({
          to: "/admin/rides/$rideId",
          params: { rideId: created.id },
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Rides"
        title={ride?.title ?? "New ride"}
        {...(ride
          ? { description: `${ride.registeredCount} of ${ride.capacity} riders registered` }
          : { description: "Save the details first; photos can be added straight after." })}
        actions={
          ride ? (
            <>
              <RideStatusBadge status={ride.status} />
              {PUBLIC.includes(ride.status) ? (
                <ButtonLink
                  to="/rides/$slug"
                  params={{ slug: ride.slug }}
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
            <ButtonLink to="/admin/rides" variant="outline">
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
                <Field id={f("title")} label="Title" error={errors["title"]}>
                  <TextInput
                    id={f("title")}
                    value={values.title}
                    onChange={(e) => set("title", e.target.value)}
                    maxLength={160}
                    {...describedBy(f("title"), errors["title"])}
                  />
                </Field>
                <Field
                  id={f("slug")}
                  label="URL slug"
                  error={errors["slug"]}
                  hint={ride ? "Changing it changes the page URL." : "Leave empty to generate it."}
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
                <Field
                  id={f("description")}
                  label="Description"
                  hint={
                    'Blank lines start a new paragraph. For a list, write a heading ending in a colon ("Included:") and start each item with "- ".'
                  }
                  className="md:col-span-2"
                >
                  <TextArea
                    id={f("description")}
                    value={values.description}
                    onChange={(e) => set("description", e.target.value)}
                    maxLength={20000}
                    rows={5}
                    {...describedBy(f("description"), undefined, "hint")}
                  />
                </Field>
              </div>
            </AdminPanel>

            {ride ? (
              <ProductMediaManager
                productId={ride.id}
                productName={ride.title}
                initialImages={ride.images}
                api={rideGalleryApi}
                maxImages={30}
                onChange={() => void refresh(["admin", "rides"])}
              />
            ) : null}

            <AdminPanel title="When and where" description="Times are India time (IST).">
              <div className="grid gap-5 md:grid-cols-2">
                <Field id={f("date")} label="Date" error={errors["startsAt"]}>
                  <TextInput
                    id={f("date")}
                    type="date"
                    value={values.date}
                    onChange={(e) => set("date", e.target.value)}
                    className="[color-scheme:dark]"
                    {...describedBy(f("date"), errors["startsAt"])}
                  />
                </Field>
                <Field id={f("time")} label="Start time">
                  <TextInput
                    id={f("time")}
                    type="time"
                    value={values.time}
                    onChange={(e) => set("time", e.target.value)}
                    className="[color-scheme:dark]"
                  />
                </Field>
                <Field id={f("location")} label="Town or region" error={errors["location"]}>
                  <TextInput
                    id={f("location")}
                    value={values.location}
                    onChange={(e) => set("location", e.target.value)}
                    maxLength={120}
                    placeholder="Pune"
                    {...describedBy(f("location"), errors["location"])}
                  />
                </Field>
                <Field id={f("duration")} label="Duration" hint="e.g. 5 hrs, 2 days">
                  <TextInput
                    id={f("duration")}
                    value={values.durationLabel}
                    onChange={(e) => set("durationLabel", e.target.value)}
                    maxLength={40}
                  />
                </Field>
                <Field
                  id={f("meeting")}
                  label="Meeting point"
                  error={errors["meetingPoint"]}
                  className="md:col-span-2"
                >
                  <TextInput
                    id={f("meeting")}
                    value={values.meetingPoint}
                    onChange={(e) => set("meetingPoint", e.target.value)}
                    maxLength={300}
                    {...describedBy(f("meeting"), errors["meetingPoint"])}
                  />
                </Field>
              </div>
            </AdminPanel>

            <AdminPanel
              title="Route"
              description="Text only for now; maps arrive in a later phase."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field id={f("rstart")} label="Starts at">
                  <TextInput
                    id={f("rstart")}
                    value={values.routeStart}
                    onChange={(e) => set("routeStart", e.target.value)}
                    maxLength={120}
                  />
                </Field>
                <Field id={f("rfinish")} label="Finishes at">
                  <TextInput
                    id={f("rfinish")}
                    value={values.routeFinish}
                    onChange={(e) => set("routeFinish", e.target.value)}
                    maxLength={120}
                  />
                </Field>
                <Field
                  id={f("waypoints")}
                  label="Waypoints"
                  hint="Comma separated, in order."
                  className="md:col-span-2"
                >
                  <TextInput
                    id={f("waypoints")}
                    value={values.waypoints}
                    onChange={(e) => set("waypoints", e.target.value)}
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
                <Field id={f("summary")} label="Route summary" className="md:col-span-2">
                  <TextArea
                    id={f("summary")}
                    value={values.routeSummary}
                    onChange={(e) => set("routeSummary", e.target.value)}
                    maxLength={1000}
                    rows={3}
                  />
                </Field>
              </div>
            </AdminPanel>

            {ride ? <RideBookingsPanel ride={ride} /> : null}
          </div>

          <div className="space-y-6">
            <AdminPanel title="Status">
              <StatusRadios
                name={f("status")}
                value={values.status}
                options={RIDE_STATUS_OPTIONS}
                onChange={(value) => set("status", value)}
              />
            </AdminPanel>
            <AdminPanel title="Riders">
              <div className="space-y-5">
                <Field
                  id={f("capacity")}
                  label="Capacity"
                  error={errors["capacity"]}
                  hint={
                    ride ? `${ride.registeredCount} registered; can't go below that.` : undefined
                  }
                >
                  <TextInput
                    id={f("capacity")}
                    inputMode="numeric"
                    value={values.capacity}
                    onChange={(e) => set("capacity", e.target.value)}
                    {...describedBy(f("capacity"), errors["capacity"], ride ? "hint" : undefined)}
                  />
                </Field>
                <Field
                  id={f("price")}
                  label="Price (₹)"
                  error={errors["price"]}
                  hint="Per rider, in rupees. Leave empty for a free ride."
                >
                  <TextInput
                    id={f("price")}
                    inputMode="decimal"
                    value={values.price}
                    onChange={(e) => set("price", e.target.value)}
                    {...describedBy(f("price"), errors["price"], "hint")}
                  />
                </Field>
                <Field id={f("leader")} label="Ride leader">
                  <TextInput
                    id={f("leader")}
                    value={values.rideLeader}
                    onChange={(e) => set("rideLeader", e.target.value)}
                    maxLength={120}
                  />
                </Field>
              </div>
            </AdminPanel>
            <AdminPanel title="Details">
              <div className="space-y-5">
                <Field id={f("type")} label="Type">
                  <SelectInput
                    id={f("type")}
                    value={values.type}
                    onChange={(e) => set("type", e.target.value as ApiRideType)}
                  >
                    {RIDE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
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
                <Field
                  id={f("destination")}
                  label="Destination"
                  hint="Optional: lists the ride on that destination's page."
                >
                  <SelectInput
                    id={f("destination")}
                    value={values.destinationId}
                    onChange={(e) => set("destinationId", e.target.value)}
                  >
                    <option value="">None</option>
                    {destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field
                  id={f("trip")}
                  label="Trip"
                  hint="Optional: lists the ride on that trip's page."
                >
                  <SelectInput
                    id={f("trip")}
                    value={values.tripId}
                    onChange={(e) => set("tripId", e.target.value)}
                  >
                    <option value="">None</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Checkbox
                  id={f("featured")}
                  label="Featured"
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
            {ride ? "Save changes" : "Create ride"}
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
