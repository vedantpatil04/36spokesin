import { type FormEvent, useId, useState } from "react";
import { TextInput } from "@/components/ui-kit";
import type { ApiAdminRiderSpotlight, ApiContentStatus } from "@/lib/api";
import { adminRiderSpotlights } from "@/services/admin/community";
import { describedBy } from "../admin-format";
import { Field, TextArea } from "../admin-ui";
import { FormActions, FormGrid, ImageWithAltField, StatusField } from "./community-form";
import { initialImage, saveAltText, trimOrNull, useSave } from "./community-form-model";

/** A rider spotlight. Nothing here is read from the rider's account. */
export function RiderSpotlightForm({
  spotlight,
  onDone,
  onCancel,
}: {
  spotlight: ApiAdminRiderSpotlight | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const id = useId();
  const f = (name: string) => `${id}-${name}`;
  const [values, setValues] = useState({
    name: spotlight?.name ?? "",
    bike: spotlight?.bike ?? "",
    location: spotlight?.location ?? "",
    favouriteRide: spotlight?.favouriteRide ?? "",
    shortStory: spotlight?.shortStory ?? "",
    status: spotlight?.status ?? ("DRAFT" as ApiContentStatus),
  });
  const [image, setImage] = useState(initialImage(spotlight?.image ?? null));
  const { errors, message, saving, save } = useSave();
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clientErrors: Record<string, string> = {};
    if (values.name.trim().length < 2) clientErrors["name"] = "Enter the rider's name.";
    void save(clientErrors, async () => {
      const input = {
        name: values.name.trim(),
        bike: trimOrNull(values.bike),
        location: trimOrNull(values.location),
        favouriteRide: trimOrNull(values.favouriteRide),
        shortStory: trimOrNull(values.shortStory),
        imageMediaId: image.choice?.id ?? null,
        status: values.status,
      };
      await saveAltText(image, spotlight?.image?.id ?? null);
      if (spotlight) await adminRiderSpotlights.update(spotlight.id, input);
      else await adminRiderSpotlights.create(input);
      onDone();
    });
  };

  const text = (key: "bike" | "location" | "favouriteRide", label: string, max: number) => (
    <Field id={f(key)} label={label} error={errors[key]} hint="Optional">
      <TextInput
        id={f(key)}
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        maxLength={max}
        {...describedBy(f(key), errors[key], "hint")}
      />
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Publish only what the rider has agreed to share. Empty fields are hidden on the site.
      </p>
      <FormGrid>
        <Field id={f("name")} label="Name" error={errors["name"]}>
          <TextInput
            id={f("name")}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={120}
            {...describedBy(f("name"), errors["name"])}
          />
        </Field>
        {text("bike", "Bike", 120)}
        {text("location", "Rides from", 120)}
        {text("favouriteRide", "Favourite ride", 160)}
        <Field
          id={f("story")}
          label="Short story"
          error={errors["shortStory"]}
          className="md:col-span-2"
          hint="Optional. A few sentences."
        >
          <TextArea
            id={f("story")}
            value={values.shortStory}
            onChange={(e) => set("shortStory", e.target.value)}
            maxLength={1200}
            rows={4}
            {...describedBy(f("story"), errors["shortStory"], "hint")}
          />
        </Field>
        <ImageWithAltField
          id={f("alt")}
          label="Photo"
          category="COMMUNITY"
          value={image}
          onChange={setImage}
          disabled={saving}
        />
        <StatusField
          name={f("status")}
          value={values.status}
          onChange={(value) => set("status", value)}
        />
      </FormGrid>
      <FormActions
        saving={saving}
        message={message}
        submitLabel={spotlight ? "Save rider" : "Create rider spotlight"}
        onCancel={onCancel}
      />
    </form>
  );
}
