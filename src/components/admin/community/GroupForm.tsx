import { type FormEvent, useId, useState } from "react";
import { TextInput } from "@/components/ui-kit";
import type { ApiAdminGroup, ApiContentStatus } from "@/lib/api";
import { adminGroups } from "@/services/admin/community";
import { describedBy, optionalInt } from "../admin-format";
import { Field, TextArea } from "../admin-ui";
import { FormActions, FormGrid, ImageWithAltField, StatusField } from "./community-form";
import { initialImage, saveAltText, trimOrNull, useSave } from "./community-form-model";

/** A group or chapter. Leave the member count empty unless it is actually known. */
export function GroupForm({
  group,
  onDone,
  onCancel,
}: {
  group: ApiAdminGroup | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const id = useId();
  const f = (name: string) => `${id}-${name}`;
  const [values, setValues] = useState({
    name: group?.name ?? "",
    slug: group?.slug ?? "",
    region: group?.region ?? "",
    rideCadence: group?.rideCadence ?? "",
    memberCount:
      group?.memberCount !== null && group?.memberCount !== undefined
        ? String(group.memberCount)
        : "",
    description: group?.description ?? "",
    status: group?.status ?? ("DRAFT" as ApiContentStatus),
  });
  const [image, setImage] = useState(initialImage(group?.cover ?? null));
  const { errors, message, saving, save } = useSave();
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clientErrors: Record<string, string> = {};
    const memberCount = optionalInt(values.memberCount);
    if (values.name.trim().length < 2) clientErrors["name"] = "Enter the group's name.";
    if (Number.isNaN(memberCount) || (memberCount !== null && memberCount < 0))
      clientErrors["memberCount"] = "Enter a whole number, or leave it empty.";
    void save(clientErrors, async () => {
      const input = {
        name: values.name.trim(),
        ...(values.slug.trim() ? { slug: values.slug.trim().toLowerCase() } : {}),
        region: trimOrNull(values.region),
        rideCadence: trimOrNull(values.rideCadence),
        memberCount,
        description: trimOrNull(values.description),
        coverMediaId: image.choice?.id ?? null,
        status: values.status,
      };
      await saveAltText(image, group?.cover?.id ?? null);
      if (group) await adminGroups.update(group.id, input);
      else await adminGroups.create(input);
      onDone();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
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
        <Field
          id={f("slug")}
          label="URL slug"
          error={errors["slug"]}
          hint={group ? "Changing it changes the page URL." : "Leave empty to generate it."}
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
          id={f("region")}
          label="Rides from"
          error={errors["region"]}
          hint="Optional, e.g. “Pune, Maharashtra”"
        >
          <TextInput
            id={f("region")}
            value={values.region}
            onChange={(e) => set("region", e.target.value)}
            maxLength={120}
            {...describedBy(f("region"), errors["region"], "hint")}
          />
        </Field>
        <Field
          id={f("cadence")}
          label="How often it rides"
          error={errors["rideCadence"]}
          hint="Optional, e.g. “Sunday mornings”"
        >
          <TextInput
            id={f("cadence")}
            value={values.rideCadence}
            onChange={(e) => set("rideCadence", e.target.value)}
            maxLength={80}
            {...describedBy(f("cadence"), errors["rideCadence"], "hint")}
          />
        </Field>
        <Field
          id={f("members")}
          label="Member count"
          error={errors["memberCount"]}
          hint="Only if actually known. Leave empty to hide it."
        >
          <TextInput
            id={f("members")}
            inputMode="numeric"
            value={values.memberCount}
            onChange={(e) => set("memberCount", e.target.value)}
            {...describedBy(f("members"), errors["memberCount"], "hint")}
          />
        </Field>
        <Field
          id={f("description")}
          label="Description"
          error={errors["description"]}
          className="md:col-span-2"
          hint="Optional. Blank lines start new paragraphs."
        >
          <TextArea
            id={f("description")}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={5000}
            rows={5}
            {...describedBy(f("description"), errors["description"], "hint")}
          />
        </Field>
        <ImageWithAltField
          id={f("alt")}
          label="Cover image"
          category="GROUP"
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
        submitLabel={group ? "Save group" : "Create group"}
        onCancel={onCancel}
      />
    </form>
  );
}
