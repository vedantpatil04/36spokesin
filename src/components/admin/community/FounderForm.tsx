import { type FormEvent, useId, useState } from "react";
import { TextInput } from "@/components/ui-kit";
import type { ApiAdminFounder, ApiContentStatus } from "@/lib/api";
import { adminFounders } from "@/services/admin/community";
import { describedBy } from "../admin-format";
import { Field, TextArea } from "../admin-ui";
import { FormActions, FormGrid, ImageWithAltField, StatusField } from "./community-form";
import { initialImage, isLink, saveAltText, trimOrNull, useSave } from "./community-form-model";

/**
 * Founder details. Only what the business has supplied should be entered:
 * empty fields are simply left off the public page.
 */
export function FounderForm({
  founder,
  onDone,
  onCancel,
}: {
  founder: ApiAdminFounder | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const id = useId();
  const f = (name: string) => `${id}-${name}`;
  const [values, setValues] = useState({
    name: founder?.name ?? "",
    role: founder?.role ?? "",
    shortBio: founder?.shortBio ?? "",
    quote: founder?.quote ?? "",
    story: founder?.story ?? "",
    instagramUrl: founder?.instagramUrl ?? "",
    linkedinUrl: founder?.linkedinUrl ?? "",
    status: founder?.status ?? ("DRAFT" as ApiContentStatus),
  });
  const [image, setImage] = useState(initialImage(founder?.image ?? null));
  const { errors, message, saving, save } = useSave();
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clientErrors: Record<string, string> = {};
    if (values.name.trim().length < 2) clientErrors["name"] = "Enter the founder's name.";
    if (!isLink(values.instagramUrl))
      clientErrors["instagramUrl"] = "Enter a full link starting with https://";
    if (!isLink(values.linkedinUrl))
      clientErrors["linkedinUrl"] = "Enter a full link starting with https://";
    void save(clientErrors, async () => {
      const input = {
        name: values.name.trim(),
        role: trimOrNull(values.role),
        shortBio: trimOrNull(values.shortBio),
        quote: trimOrNull(values.quote),
        story: trimOrNull(values.story),
        instagramUrl: trimOrNull(values.instagramUrl),
        linkedinUrl: trimOrNull(values.linkedinUrl),
        imageMediaId: image.choice?.id ?? null,
        status: values.status,
      };
      await saveAltText(image, founder?.image?.id ?? null);
      if (founder) await adminFounders.update(founder.id, input);
      else await adminFounders.create(input);
      onDone();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Enter only details the founder has supplied. Empty fields are hidden on the site, never
        shown as blanks.
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
        <Field id={f("role")} label="Role" error={errors["role"]} hint="Optional">
          <TextInput
            id={f("role")}
            value={values.role}
            onChange={(e) => set("role", e.target.value)}
            maxLength={120}
            {...describedBy(f("role"), errors["role"], "hint")}
          />
        </Field>
        <Field
          id={f("bio")}
          label="Short bio"
          error={errors["shortBio"]}
          className="md:col-span-2"
          hint="Optional. Two or three sentences."
        >
          <TextArea
            id={f("bio")}
            value={values.shortBio}
            onChange={(e) => set("shortBio", e.target.value)}
            maxLength={600}
            rows={3}
            {...describedBy(f("bio"), errors["shortBio"], "hint")}
          />
        </Field>
        <Field
          id={f("quote")}
          label="Quote"
          error={errors["quote"]}
          className="md:col-span-2"
          hint="Optional. Without quotation marks."
        >
          <TextArea
            id={f("quote")}
            value={values.quote}
            onChange={(e) => set("quote", e.target.value)}
            maxLength={400}
            rows={2}
            className="min-h-16"
            {...describedBy(f("quote"), errors["quote"], "hint")}
          />
        </Field>
        <Field
          id={f("story")}
          label="Story"
          error={errors["story"]}
          className="md:col-span-2"
          hint="Optional. Blank lines start new paragraphs."
        >
          <TextArea
            id={f("story")}
            value={values.story}
            onChange={(e) => set("story", e.target.value)}
            maxLength={20000}
            rows={8}
            {...describedBy(f("story"), errors["story"], "hint")}
          />
        </Field>
        <Field
          id={f("instagram")}
          label="Instagram link"
          error={errors["instagramUrl"]}
          hint="Optional"
        >
          <TextInput
            id={f("instagram")}
            type="url"
            value={values.instagramUrl}
            onChange={(e) => set("instagramUrl", e.target.value)}
            placeholder="https://www.instagram.com/…"
            {...describedBy(f("instagram"), errors["instagramUrl"], "hint")}
          />
        </Field>
        <Field
          id={f("linkedin")}
          label="LinkedIn link"
          error={errors["linkedinUrl"]}
          hint="Optional"
        >
          <TextInput
            id={f("linkedin")}
            type="url"
            value={values.linkedinUrl}
            onChange={(e) => set("linkedinUrl", e.target.value)}
            placeholder="https://www.linkedin.com/in/…"
            {...describedBy(f("linkedin"), errors["linkedinUrl"], "hint")}
          />
        </Field>
        <ImageWithAltField
          id={f("alt")}
          label="Portrait"
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
        submitLabel={founder ? "Save founder" : "Create founder"}
        onCancel={onCancel}
      />
    </form>
  );
}
