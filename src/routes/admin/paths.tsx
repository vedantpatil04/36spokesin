import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, LoaderCircle, Pencil, Upload } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { tableClasses } from "@/components/admin/admin-format";
import {
  AdminPageHeader,
  AdminPanel,
  Field,
  InlineError,
  TextArea,
} from "@/components/admin/admin-ui";
import { ErrorState, Skeleton } from "@/components/states";
import { Button, SelectInput, TextInput } from "@/components/ui-kit";
import {
  listAdminPathCards,
  reorderPathCards,
  updatePathCard,
  type AdminPathCard,
  type PathCardInput,
} from "@/services/admin/site";
import { uploadImage } from "@/services/media-uploads";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/paths")({
  component: AdminPathsPage,
});

function AdminPathsPage() {
  const queryClient = useQueryClient();
  const paths = useQuery({
    queryKey: ["admin", "path-cards"],
    queryFn: () => listAdminPathCards(),
  });
  const [editing, setEditing] = useState<AdminPathCard | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "path-cards"] });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Path cards"
        description="Manage the 5 core entry points on the homepage: Rides, Plan, Shop, Garage, and Community. Change imagery, titles, taglines, CTAs and destinations without touching code."
      />

      {editing ? (
        <AdminPanel
          title={`Edit ${editing.title} path`}
          description="Update card imagery, headline, tagline, and button destination."
        >
          <PathCardForm
            key={editing.id}
            card={editing}
            onDone={() => {
              setEditing(null);
              void refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        </AdminPanel>
      ) : null}

      {paths.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : paths.isError ? (
        <ErrorState
          title="Could not load path cards"
          description={describeError(paths.error)}
          onRetry={() => void refresh()}
        />
      ) : paths.data && paths.data.length > 0 ? (
        <>
          {/* Mobile Stacked Path Cards (< md) */}
          <div className="space-y-3 md:hidden">
            {paths.data.map((card, idx) => (
              <article
                key={card.id}
                className="rounded-sm border border-border bg-card p-3.5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-foreground leading-snug">
                      {card.title}
                    </h4>
                    <p className="font-mono text-xs text-muted-foreground">{card.slug}</p>
                  </div>
                  {card.badge ? (
                    <span className="shrink-0 rounded bg-primary/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-primary">
                      {card.badge}
                    </span>
                  ) : null}
                </div>

                {card.tagline ? (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{card.tagline}</p>
                ) : null}

                <div className="mt-2.5 rounded bg-surface/50 p-2 text-xs">
                  <span className="text-muted-foreground">CTA: </span>
                  <span className="font-mono font-medium text-foreground">{card.ctaLabel}</span>
                  <span className="mx-1 text-muted-foreground">→</span>
                  <span className="font-mono text-primary truncate">{card.destinationUrl}</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-muted-foreground mr-1">
                      #{card.sortOrder}
                    </span>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={async () => {
                        const newOrder = paths.data?.map((p) => p.id) ?? [];
                        const currentId = newOrder[idx];
                        const prevId = newOrder[idx - 1];
                        if (currentId && prevId) {
                          newOrder[idx] = prevId;
                          newOrder[idx - 1] = currentId;
                          await reorderPathCards(newOrder);
                          void refresh();
                        }
                      }}
                      className="flex size-8 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:text-foreground active:bg-surface-2 disabled:opacity-20"
                      aria-label="Move path card up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === paths.data.length - 1}
                      onClick={async () => {
                        const newOrder = paths.data?.map((p) => p.id) ?? [];
                        const currentId = newOrder[idx];
                        const nextId = newOrder[idx + 1];
                        if (currentId && nextId) {
                          newOrder[idx] = nextId;
                          newOrder[idx + 1] = currentId;
                          await reorderPathCards(newOrder);
                          void refresh();
                        }
                      }}
                      className="flex size-8 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:text-foreground active:bg-surface-2 disabled:opacity-20"
                      aria-label="Move path card down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => setEditing(card)}
                  >
                    <Pencil className="size-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className={`${tableClasses.wrapper} hidden md:block`}>
            <table className={tableClasses.table}>
              <thead>
                <tr className={tableClasses.head}>
                  <th className={tableClasses.th}>Order</th>
                  <th className={tableClasses.th}>Path</th>
                  <th className={tableClasses.th}>Tagline</th>
                  <th className={tableClasses.th}>CTA</th>
                  <th className={tableClasses.th}>Destination</th>
                  <th className={tableClasses.th}>Badge</th>
                  <th className={tableClasses.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paths.data.map((card, idx) => (
                  <tr key={card.id} className={tableClasses.row}>
                    <td className={tableClasses.td}>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-muted-foreground mr-1">
                          {card.sortOrder}
                        </span>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={async () => {
                            const newOrder = paths.data?.map((p) => p.id) ?? [];
                            const currentId = newOrder[idx];
                            const prevId = newOrder[idx - 1];
                            if (currentId && prevId) {
                              newOrder[idx] = prevId;
                              newOrder[idx - 1] = currentId;
                              await reorderPathCards(newOrder);
                              void refresh();
                            }
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === paths.data.length - 1}
                          onClick={async () => {
                            const newOrder = paths.data?.map((p) => p.id) ?? [];
                            const currentId = newOrder[idx];
                            const nextId = newOrder[idx + 1];
                            if (currentId && nextId) {
                              newOrder[idx] = nextId;
                              newOrder[idx + 1] = currentId;
                              await reorderPathCards(newOrder);
                              void refresh();
                            }
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className={tableClasses.td}>
                      <span className="font-bold text-foreground">{card.title}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        ({card.slug})
                      </span>
                    </td>
                    <td className={tableClasses.td}>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {card.tagline || "—"}
                      </span>
                    </td>
                    <td className={tableClasses.td}>
                      <span className="text-xs font-mono text-foreground">{card.ctaLabel}</span>
                    </td>
                    <td className={tableClasses.td}>
                      <span className="text-xs font-mono text-primary">{card.destinationUrl}</span>
                    </td>
                    <td className={tableClasses.td}>
                      {card.badge ? (
                        <span className="rounded bg-primary/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-primary">
                          {card.badge}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className={tableClasses.td}>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(card)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function PathCardForm({
  card,
  onDone,
  onCancel,
}: {
  card: AdminPathCard;
  onDone: () => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const ids = {
    title: `${uid}-title`,
    destinationUrl: `${uid}-destination-url`,
    tagline: `${uid}-tagline`,
    description: `${uid}-description`,
    ctaLabel: `${uid}-cta-label`,
    badge: `${uid}-badge`,
    status: `${uid}-status`,
    imageUrl: `${uid}-image-url`,
  };

  const [title, setTitle] = useState(card.title);
  const [tagline, setTagline] = useState(card.tagline ?? "");
  const [description, setDescription] = useState(card.description ?? "");
  const [ctaLabel, setCtaLabel] = useState(card.ctaLabel);
  const [destinationUrl, setDestinationUrl] = useState(card.destinationUrl);
  const [badge, setBadge] = useState(card.badge ?? "");
  const [imageUrl, setImageUrl] = useState(card.imageUrl ?? "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(card.status);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload: PathCardInput = {
        title: title.trim(),
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        ctaLabel: ctaLabel.trim(),
        destinationUrl: destinationUrl.trim(),
        badge: badge.trim() || null,
        imageUrl: imageUrl.trim() || null,
        status,
      };

      await updatePathCard(card.id, payload);
      onDone();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const asset = await uploadImage(file, { category: "SITE" });
      if (asset.url) setImageUrl(asset.url);
    } catch (err) {
      setError(`Image upload failed: ${describeError(err)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <InlineError message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={ids.title} label="Path Title *">
          <TextInput
            id={ids.title}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>

        <Field id={ids.destinationUrl} label="Destination URL *" hint="e.g. /rides, /plan">
          <TextInput
            id={ids.destinationUrl}
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            required
          />
        </Field>
      </div>

      <Field id={ids.tagline} label="Tagline" hint="Short tagline shown under the title">
        <TextInput id={ids.tagline} value={tagline} onChange={(e) => setTagline(e.target.value)} />
      </Field>

      <Field id={ids.description} label="Description" hint="Optional descriptor">
        <TextArea
          id={ids.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id={ids.ctaLabel} label="CTA Button Label *">
          <TextInput
            id={ids.ctaLabel}
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            required
          />
        </Field>

        <Field id={ids.badge} label="Badge" hint="e.g. Coming soon, New">
          <TextInput
            id={ids.badge}
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Coming soon"
          />
        </Field>

        <Field id={ids.status} label="Status">
          <SelectInput
            id={ids.status}
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED")}
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </SelectInput>
        </Field>
      </div>

      {/* IMAGE */}
      <Field
        id={ids.imageUrl}
        label="Image URL / Upload"
        hint="Custom background photography for this path"
      >
        <div className="flex gap-2">
          <TextInput
            id={ids.imageUrl}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-2">
            <Upload className="size-3.5" />
            <span>{uploading ? "Uploading..." : "Upload photo"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
              disabled={uploading}
            />
          </label>
        </div>
      </Field>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
          {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Save path changes
        </Button>
      </div>
    </form>
  );
}
