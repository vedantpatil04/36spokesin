import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { Button, ButtonLink, SelectInput, TextInput } from "@/components/ui-kit";
import type { ApiAdminDestination, ApiContentStatus, ApiDifficulty } from "@/lib/api";
import {
  type DestinationInput,
  createDestination,
  updateDestination,
} from "@/services/admin/travel";
import { destinationGalleryApi } from "@/services/admin/gallery";
import { describeError } from "@/services/request-helpers";
import { ProductMediaManager } from "../ProductMediaManager";
import { StatusRadios } from "../StatusRadios";
import { describedBy, fieldErrors, orNull } from "../admin-format";
import { CONTENT_STATUS_OPTIONS, DIFFICULTY_OPTIONS } from "../admin-options";
import {
  AdminPageHeader,
  AdminPanel,
  Checkbox,
  Field,
  ProductStatusBadge,
  TextArea,
} from "../admin-ui";
import { useCatalogRefresh } from "../use-admin";

/** Create (destination = null) or edit a destination; photos once it exists. */
export function DestinationEditor({ destination }: { destination: ApiAdminDestination | null }) {
  const id = useId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refresh = useCatalogRefresh();
  const [values, setValues] = useState({
    name: destination?.name ?? "",
    slug: destination?.slug ?? "",
    region: destination?.region ?? "",
    country: destination?.country ?? "India",
    difficulty: destination?.difficulty ?? ("MODERATE" as ApiDifficulty),
    shortDescription: destination?.shortDescription ?? "",
    description: destination?.description ?? "",
    bestSeason: destination?.bestSeason ?? "",
    durationRecommendation: destination?.durationRecommendation ?? "",
    usefulInfo: destination?.usefulInfo ?? "",
    status: destination?.status ?? ("DRAFT" as ApiContentStatus),
    featured: destination?.featured ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const f = (name: string) => `${id}-${name}`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clientErrors: Record<string, string> = {};
    if (values.name.trim().length < 2) clientErrors["name"] = "Enter a name.";
    if (values.region.trim().length < 2) clientErrors["region"] = "Enter the region.";
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0)
      return setMessage({ tone: "error", text: "Some fields need attention." });

    const input: DestinationInput = {
      name: values.name.trim(),
      ...(values.slug.trim() ? { slug: values.slug.trim().toLowerCase() } : {}),
      region: values.region.trim(),
      country: values.country.trim() || "India",
      difficulty: values.difficulty,
      shortDescription: orNull(values.shortDescription),
      description: orNull(values.description),
      bestSeason: orNull(values.bestSeason),
      durationRecommendation: orNull(values.durationRecommendation),
      usefulInfo: orNull(values.usefulInfo),
      status: values.status,
      featured: values.featured,
    };
    setSaving(true);
    setMessage(null);
    try {
      if (destination) {
        const saved = await updateDestination(destination.id, input);
        queryClient.setQueryData(["admin", "destination", destination.id], saved);
        await refresh(["admin", "destinations"]);
        setMessage({ tone: "ok", text: "Saved" });
      } else {
        const created = await createDestination(input);
        await refresh(["admin", "destinations"]);
        await navigate({
          to: "/admin/destinations/$destinationId",
          params: { destinationId: created.id },
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
        eyebrow="Destinations"
        title={destination?.name ?? "New destination"}
        {...(destination
          ? {}
          : { description: "Save the details first; photos can be added straight after." })}
        actions={
          destination ? (
            <>
              <ProductStatusBadge status={destination.status} />
              {destination.status === "PUBLISHED" ? (
                <ButtonLink
                  to="/travel/$destination"
                  params={{ destination: destination.slug }}
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
            <ButtonLink to="/admin/destinations" variant="outline">
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
                    maxLength={120}
                    {...describedBy(f("name"), errors["name"])}
                  />
                </Field>
                <Field
                  id={f("slug")}
                  label="URL slug"
                  error={errors["slug"]}
                  hint={
                    destination
                      ? "Changing it changes the page URL."
                      : "Leave empty to generate it."
                  }
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
                <Field id={f("region")} label="Region" error={errors["region"]}>
                  <TextInput
                    id={f("region")}
                    value={values.region}
                    onChange={(e) => set("region", e.target.value)}
                    maxLength={120}
                    placeholder="Himachal Pradesh"
                    {...describedBy(f("region"), errors["region"])}
                  />
                </Field>
                <Field id={f("country")} label="Country" error={errors["country"]}>
                  <TextInput
                    id={f("country")}
                    value={values.country}
                    onChange={(e) => set("country", e.target.value)}
                    maxLength={80}
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
                  hint="Blank lines start new paragraphs."
                  className="md:col-span-2"
                >
                  <TextArea
                    id={f("description")}
                    value={values.description}
                    onChange={(e) => set("description", e.target.value)}
                    maxLength={20000}
                    rows={8}
                  />
                </Field>
              </div>
            </AdminPanel>

            {destination ? (
              <ProductMediaManager
                productId={destination.id}
                productName={destination.name}
                initialImages={destination.images}
                api={destinationGalleryApi}
                maxImages={30}
                onChange={() => void refresh(["admin", "destinations"])}
              />
            ) : null}

            <AdminPanel
              title="Useful information"
              description="Shown beside the description on the destination page."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field id={f("season")} label="Best season">
                  <TextInput
                    id={f("season")}
                    value={values.bestSeason}
                    onChange={(e) => set("bestSeason", e.target.value)}
                    maxLength={120}
                    placeholder="June to September"
                  />
                </Field>
                <Field id={f("duration")} label="Recommended duration">
                  <TextInput
                    id={f("duration")}
                    value={values.durationRecommendation}
                    onChange={(e) => set("durationRecommendation", e.target.value)}
                    maxLength={120}
                    placeholder="8–12 days"
                  />
                </Field>
                <Field
                  id={f("info")}
                  label="Notes for riders"
                  hint="Permits, altitude, fuel, network."
                  className="md:col-span-2"
                >
                  <TextArea
                    id={f("info")}
                    value={values.usefulInfo}
                    onChange={(e) => set("usefulInfo", e.target.value)}
                    maxLength={10000}
                    rows={5}
                  />
                </Field>
              </div>
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
            {destination ? "Save changes" : "Create destination"}
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
