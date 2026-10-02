import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useId, useState } from "react";
import { SelectInput, TextInput } from "@/components/ui-kit";
import type { ApiAdminStory, ApiContentStatus } from "@/lib/api";
import { adminStories } from "@/services/admin/community";
import { listAdminDestinations } from "@/services/admin/travel";
import { describedBy } from "../admin-format";
import { Checkbox, Field, TextArea } from "../admin-ui";
import { FormActions, FormGrid, ImageWithAltField, StatusField } from "./community-form";
import { initialImage, saveAltText, trimOrNull, useSave } from "./community-form-model";

/** A rider story: plain text with blank lines between paragraphs. */
export function StoryForm({
  story,
  onDone,
  onCancel,
}: {
  story: ApiAdminStory | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const id = useId();
  const f = (name: string) => `${id}-${name}`;
  const destinations = useQuery({
    queryKey: ["admin", "destinations", "", ""],
    queryFn: () => listAdminDestinations(),
  });
  const [values, setValues] = useState({
    title: story?.title ?? "",
    slug: story?.slug ?? "",
    excerpt: story?.excerpt ?? "",
    content: story?.content ?? "",
    authorName: story?.authorName ?? "",
    destinationId: story?.destinationId ?? "",
    featured: story?.featured ?? false,
    status: story?.status ?? ("DRAFT" as ApiContentStatus),
  });
  const [image, setImage] = useState(initialImage(story?.cover ?? null));
  const { errors, message, saving, save } = useSave();
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clientErrors: Record<string, string> = {};
    if (values.title.trim().length < 2) clientErrors["title"] = "Enter a title.";
    void save(clientErrors, async () => {
      const input = {
        title: values.title.trim(),
        ...(values.slug.trim() ? { slug: values.slug.trim().toLowerCase() } : {}),
        excerpt: trimOrNull(values.excerpt),
        content: trimOrNull(values.content),
        authorName: trimOrNull(values.authorName),
        destinationId: values.destinationId || null,
        coverMediaId: image.choice?.id ?? null,
        featured: values.featured,
        status: values.status,
      };
      await saveAltText(image, story?.cover?.id ?? null);
      if (story) await adminStories.update(story.id, input);
      else await adminStories.create(input);
      onDone();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <FormGrid>
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
          hint={story ? "Changing it changes the page URL." : "Leave empty to generate it."}
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
          id={f("author")}
          label="Credit"
          error={errors["authorName"]}
          hint="Optional. The name shown as “By …”."
        >
          <TextInput
            id={f("author")}
            value={values.authorName}
            onChange={(e) => set("authorName", e.target.value)}
            maxLength={120}
            {...describedBy(f("author"), errors["authorName"], "hint")}
          />
        </Field>
        <Field
          id={f("destination")}
          label="Destination"
          error={errors["destinationId"]}
          hint="Optional. Linked on the story once the destination is published."
        >
          <SelectInput
            id={f("destination")}
            value={values.destinationId}
            onChange={(e) => set("destinationId", e.target.value)}
            {...describedBy(f("destination"), errors["destinationId"], "hint")}
          >
            <option value="">None</option>
            {(destinations.data ?? []).map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name}
                {destination.status === "PUBLISHED" ? "" : ` (${destination.status.toLowerCase()})`}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field
          id={f("excerpt")}
          label="Excerpt"
          error={errors["excerpt"]}
          className="md:col-span-2"
          hint="Optional. One or two sentences for listings."
        >
          <TextArea
            id={f("excerpt")}
            value={values.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            maxLength={400}
            rows={2}
            className="min-h-16"
            {...describedBy(f("excerpt"), errors["excerpt"], "hint")}
          />
        </Field>
        <Field
          id={f("content")}
          label="Story"
          error={errors["content"]}
          className="md:col-span-2"
          hint="Blank lines start new paragraphs."
        >
          <TextArea
            id={f("content")}
            value={values.content}
            onChange={(e) => set("content", e.target.value)}
            maxLength={50000}
            rows={12}
            {...describedBy(f("content"), errors["content"], "hint")}
          />
        </Field>
        <ImageWithAltField
          id={f("alt")}
          label="Cover image"
          category="STORY"
          value={image}
          onChange={setImage}
          disabled={saving}
        />
        <div className="space-y-5">
          <Checkbox
            id={f("featured")}
            label="Featured"
            description="Listed first on Community and Stories."
            checked={values.featured}
            onChange={(checked) => set("featured", checked)}
          />
          <StatusField
            name={f("status")}
            value={values.status}
            onChange={(value) => set("status", value)}
          />
        </div>
      </FormGrid>
      <FormActions
        saving={saving}
        message={message}
        submitLabel={story ? "Save story" : "Create story"}
        onCancel={onCancel}
      />
    </form>
  );
}
