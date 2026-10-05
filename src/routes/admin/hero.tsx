import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  Sliders,
  Smartphone,
  Trash2,
  Upload,
  Video as VideoIcon,
} from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { tableClasses } from "@/components/admin/admin-format";
import {
  AdminPageHeader,
  AdminPanel,
  Field,
  InlineError,
  ProductStatusBadge,
  TextArea,
} from "@/components/admin/admin-ui";
import { ErrorState, Skeleton } from "@/components/states";
import { Button, SelectInput, TextInput } from "@/components/ui-kit";
import {
  archiveHeroSlide,
  createHeroSlide,
  listAdminHeroSlides,
  reorderHeroSlides,
  updateHeroSlide,
  type HeroSlideInput,
} from "@/services/admin/site";
import { uploadImage, uploadVideo } from "@/services/media-uploads";
import { describeError } from "@/services/request-helpers";
import type { HeroSlide } from "@/types";

export const Route = createFileRoute("/admin/hero")({
  component: AdminHeroPage,
});

const DURATION_PRESETS = [5, 7, 10, 15, 20, 30] as const;

function AdminHeroPage() {
  const queryClient = useQueryClient();
  const slides = useQuery({
    queryKey: ["admin", "hero-slides"],
    queryFn: () => listAdminHeroSlides(),
  });
  const [editing, setEditing] = useState<HeroSlide | "new" | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "hero-slides"] });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Hero slides"
        description="Manage the cinematic hero carousel on the homepage. Configure high-resolution desktop and mobile media, video loops, poster fallbacks, per-slide durations, headlines, and CTAs."
        actions={
          <Button size="sm" onClick={() => setEditing("new")} disabled={editing !== null}>
            <Plus className="size-3.5" aria-hidden />
            New hero slide
          </Button>
        }
      />

      {editing ? (
        <AdminPanel
          title={editing === "new" ? "New hero slide" : "Edit hero slide"}
          description="Enter slide copy, choose between Image or Video, set custom duration & auto-advance modes, and provide responsive mobile media."
        >
          <HeroSlideForm
            key={editing === "new" ? "new" : editing.id}
            slide={editing === "new" ? null : editing}
            nextSortOrder={slides.data?.length ?? 0}
            onDone={() => {
              setEditing(null);
              void refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        </AdminPanel>
      ) : null}

      {slides.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : slides.isError ? (
        <ErrorState
          title="Could not load hero slides"
          description={describeError(slides.error)}
          onRetry={() => void refresh()}
        />
      ) : slides.data && slides.data.length > 0 ? (
        <>
          {/* Mobile Stacked Hero Slide Cards (< md) */}
          <div className="space-y-3 md:hidden">
            {slides.data.map((slide, idx) => (
              <article
                key={slide.id}
                className="rounded-sm border border-border bg-card p-3.5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-sm border border-border bg-surface">
                    {slide.mediaType === "VIDEO" && slide.videoUrl ? (
                      <video
                        src={slide.videoUrl}
                        poster={slide.posterUrl ?? undefined}
                        className="size-full object-cover"
                        muted
                      />
                    ) : slide.imageUrl ? (
                      <img src={slide.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <Sliders className="size-5" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 rounded bg-background/85 px-1 font-mono text-[0.55rem] font-bold uppercase tracking-wider">
                      {slide.mediaType === "VIDEO" ? "VID" : "IMG"}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-foreground line-clamp-1 leading-snug">
                        {slide.title}
                      </h4>
                      <ProductStatusBadge status={slide.status} />
                    </div>
                    {slide.eyebrow ? (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{slide.eyebrow}</p>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {slide.durationSeconds}s
                      </span>
                      <span>·</span>
                      <span>{slide.autoAdvanceMode === "VIDEO_END" ? "Video end" : "Fixed"}</span>
                      {slide.location ? (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[12rem]">📍 {slide.location}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-muted-foreground mr-1">
                      #{slide.sortOrder}
                    </span>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={async () => {
                        const newOrder = slides.data?.map((s) => s.id) ?? [];
                        const currentId = newOrder[idx];
                        const prevId = newOrder[idx - 1];
                        if (currentId && prevId) {
                          newOrder[idx] = prevId;
                          newOrder[idx - 1] = currentId;
                          await reorderHeroSlides(newOrder);
                          void refresh();
                        }
                      }}
                      className="flex size-8 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:text-foreground active:bg-surface-2 disabled:opacity-20"
                      aria-label="Move slide up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === slides.data.length - 1}
                      onClick={async () => {
                        const newOrder = slides.data?.map((s) => s.id) ?? [];
                        const currentId = newOrder[idx];
                        const nextId = newOrder[idx + 1];
                        if (currentId && nextId) {
                          newOrder[idx] = nextId;
                          newOrder[idx + 1] = currentId;
                          await reorderHeroSlides(newOrder);
                          void refresh();
                        }
                      }}
                      className="flex size-8 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:text-foreground active:bg-surface-2 disabled:opacity-20"
                      aria-label="Move slide down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => setEditing(slide)}
                    >
                      <Pencil className="size-3 mr-1" />
                      Edit
                    </Button>
                    {slide.status !== "ARCHIVED" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Archive hero slide "${slide.title}"?`)) {
                            await archiveHeroSlide(slide.id);
                            void refresh();
                          }
                        }}
                        className="flex size-8 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:text-destructive active:bg-surface-2"
                        aria-label="Archive slide"
                        title="Archive slide"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
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
                <th className={tableClasses.th}>Media</th>
                <th className={tableClasses.th}>Headline / Eyebrow</th>
                <th className={tableClasses.th}>Timing & Mode</th>
                <th className={tableClasses.th}>Location</th>
                <th className={tableClasses.th}>CTA</th>
                <th className={tableClasses.th}>Status</th>
                <th className={tableClasses.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slides.data.map((slide, idx) => (
                <tr key={slide.id} className={tableClasses.row}>
                  <td className={tableClasses.td}>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted-foreground mr-1">
                        {slide.sortOrder}
                      </span>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={async () => {
                          const newOrder = slides.data?.map((s) => s.id) ?? [];
                          const currentId = newOrder[idx];
                          const prevId = newOrder[idx - 1];
                          if (currentId && prevId) {
                            newOrder[idx] = prevId;
                            newOrder[idx - 1] = currentId;
                            await reorderHeroSlides(newOrder);
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
                        disabled={idx === slides.data.length - 1}
                        onClick={async () => {
                          const newOrder = slides.data?.map((s) => s.id) ?? [];
                          const currentId = newOrder[idx];
                          const nextId = newOrder[idx + 1];
                          if (currentId && nextId) {
                            newOrder[idx] = nextId;
                            newOrder[idx + 1] = currentId;
                            await reorderHeroSlides(newOrder);
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
                    <div className="relative size-14 overflow-hidden rounded bg-surface border border-border">
                      {slide.imageUrl || slide.posterUrl ? (
                        <img
                          src={slide.imageUrl || slide.posterUrl || ""}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          {slide.mediaType === "VIDEO" ? (
                            <VideoIcon className="size-4" />
                          ) : (
                            <ImageIcon className="size-4" />
                          )}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 bg-background/85 px-1 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider">
                        {slide.mediaType}
                      </span>
                      {slide.mobileUrl ? (
                        <span
                          className="absolute top-0.5 right-0.5 rounded-full bg-primary/90 p-0.5 text-primary-foreground shadow"
                          title="Mobile media configured"
                        >
                          <Smartphone className="size-2.5" />
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className={tableClasses.td}>
                    <p className="font-semibold text-foreground text-sm line-clamp-1">
                      {slide.title}
                    </p>
                    {slide.eyebrow ? <p className="text-xs text-primary">{slide.eyebrow}</p> : null}
                  </td>
                  <td className={tableClasses.td}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                        <Clock className="size-3 text-primary" />
                        <span>{slide.durationSeconds ?? 5}s</span>
                      </div>
                      <span className="inline-block rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground">
                        {slide.autoAdvanceMode === "VIDEO_END" ? "Video End" : "Fixed Duration"}
                      </span>
                    </div>
                  </td>
                  <td className={tableClasses.td}>
                    <span className="text-xs text-muted-foreground">{slide.location || "—"}</span>
                  </td>
                  <td className={tableClasses.td}>
                    <span className="text-xs text-foreground font-mono">
                      {slide.ctaLabel || "—"}
                    </span>
                  </td>
                  <td className={tableClasses.td}>
                    <ProductStatusBadge status={slide.status} />
                  </td>
                  <td className={tableClasses.td}>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(slide)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      {slide.status !== "ARCHIVED" ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Archive hero slide "${slide.title}"?`)) {
                              await archiveHeroSlide(slide.id);
                              void refresh();
                            }
                          }}
                          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Archive slide"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ) : (
        <div className="rounded-sm border border-border bg-card p-12 text-center">
          <Sliders className="mx-auto size-10 text-muted-foreground" />
          <h3 className="mt-3 font-display text-lg uppercase">No hero slides</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a hero slide to feature on the homepage.
          </p>
        </div>
      )}
    </div>
  );
}

function HeroSlideForm({
  slide,
  nextSortOrder,
  onDone,
  onCancel,
}: {
  slide: HeroSlide | null;
  nextSortOrder: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const ids = {
    title: `${uid}-title`,
    eyebrow: `${uid}-eyebrow`,
    description: `${uid}-description`,
    location: `${uid}-location`,
    mediaType: `${uid}-media-type`,
    status: `${uid}-status`,
    imageUrl: `${uid}-image-url`,
    videoUrl: `${uid}-video-url`,
    posterUrl: `${uid}-poster-url`,
    mobileUrl: `${uid}-mobile-url`,
    durationSeconds: `${uid}-duration-seconds`,
    autoAdvanceMode: `${uid}-auto-advance-mode`,
    ctaLabel: `${uid}-cta-label`,
    ctaUrl: `${uid}-cta-url`,
    secondaryCtaLabel: `${uid}-sec-cta-label`,
    secondaryCtaUrl: `${uid}-sec-cta-url`,
  };

  const [title, setTitle] = useState(slide?.title ?? "");
  const [eyebrow, setEyebrow] = useState(slide?.eyebrow ?? "");
  const [description, setDescription] = useState(slide?.description ?? "");
  const [location, setLocation] = useState(slide?.location ?? "");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">(slide?.mediaType ?? "IMAGE");
  const [imageUrl, setImageUrl] = useState(slide?.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(slide?.videoUrl ?? "");
  const [posterUrl, setPosterUrl] = useState(slide?.posterUrl ?? "");
  const [mobileUrl, setMobileUrl] = useState(slide?.mobileUrl ?? "");
  const [durationSeconds, setDurationSeconds] = useState<number>(slide?.durationSeconds ?? 5);
  const [autoAdvanceMode, setAutoAdvanceMode] = useState<"FIXED_DURATION" | "VIDEO_END">(
    slide?.autoAdvanceMode ?? "FIXED_DURATION",
  );
  const [ctaLabel, setCtaLabel] = useState(slide?.ctaLabel ?? "Choose your path");
  const [ctaUrl, setCtaUrl] = useState(slide?.ctaUrl ?? "#choose-your-path");
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState(
    slide?.secondaryCtaLabel ?? "Plan a journey",
  );
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState(slide?.secondaryCtaUrl ?? "/plan");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    slide?.status ?? "PUBLISHED",
  );

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Headline is required.");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const payload: HeroSlideInput = {
        title: title.trim(),
        eyebrow: eyebrow.trim() || null,
        description: description.trim() || null,
        location: location.trim() || null,
        mediaType,
        imageUrl: imageUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
        posterUrl: posterUrl.trim() || null,
        mobileUrl: mobileUrl.trim() || null,
        durationSeconds: Math.max(1, Number(durationSeconds) || 5),
        autoAdvanceMode,
        ctaLabel: ctaLabel.trim() || null,
        ctaUrl: ctaUrl.trim() || null,
        secondaryCtaLabel: secondaryCtaLabel.trim() || null,
        secondaryCtaUrl: secondaryCtaUrl.trim() || null,
        status,
        sortOrder: slide?.sortOrder ?? nextSortOrder,
      };

      if (slide) {
        await updateHeroSlide(slide.id, payload);
      } else {
        await createHeroSlide(payload);
      }
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
    setUploadingImage(true);
    setError(null);
    try {
      const asset = await uploadImage(file, { category: "SITE" });
      if (asset.url) setImageUrl(asset.url);
    } catch (err) {
      setError(`Image upload failed: ${describeError(err)}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setError(null);
    try {
      const asset = await uploadVideo(file, { category: "SITE" });
      if (asset.url) setVideoUrl(asset.url);
    } catch (err) {
      setError(`Video upload failed: ${describeError(err)}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handlePosterFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPoster(true);
    setError(null);
    try {
      const asset = await uploadImage(file, { category: "SITE" });
      if (asset.url) setPosterUrl(asset.url);
    } catch (err) {
      setError(`Poster upload failed: ${describeError(err)}`);
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleMobileFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMobile(true);
    setError(null);
    try {
      const isVideo = file.type.startsWith("video/") || mediaType === "VIDEO";
      const asset = isVideo
        ? await uploadVideo(file, { category: "SITE" })
        : await uploadImage(file, { category: "SITE" });
      if (asset.url) setMobileUrl(asset.url);
    } catch (err) {
      setError(`Mobile upload failed: ${describeError(err)}`);
    } finally {
      setUploadingMobile(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <InlineError message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={ids.eyebrow} label="Eyebrow" hint="e.g. Official 36 Spokes Rider Network">
          <TextInput
            id={ids.eyebrow}
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
          />
        </Field>

        <Field id={ids.location} label="Location" hint="e.g. Zanskar Gorge & Shinkula Pass">
          <TextInput
            id={ids.location}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Field>
      </div>

      <Field id={ids.title} label="Headline *" hint="Primary high-impact statement">
        <TextInput
          id={ids.title}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Field>

      <Field
        id={ids.description}
        label="Description"
        hint="1-2 sentences on the journey or atmosphere"
      >
        <TextArea
          id={ids.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </Field>

      {/* DURATION & AUTO ADVANCE */}
      <div className="space-y-4 rounded border border-border p-4 bg-surface/30">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <h4 className="font-display text-sm uppercase tracking-wider text-foreground">
            Duration & Auto-Advance Control
          </h4>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field
              id={ids.durationSeconds}
              label={`Slide Duration (${durationSeconds}s)`}
              hint="Select a preset or enter custom seconds"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_PRESETS.map((seconds) => (
                    <button
                      key={seconds}
                      type="button"
                      onClick={() => setDurationSeconds(seconds)}
                      className={`rounded px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                        durationSeconds === seconds
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-surface-2 text-muted-foreground hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Custom:</span>
                  <input
                    type="number"
                    id={ids.durationSeconds}
                    min={1}
                    max={120}
                    value={durationSeconds}
                    onChange={(e) =>
                      setDurationSeconds(Math.max(1, parseInt(e.target.value, 10) || 5))
                    }
                    className="w-24 rounded border border-border bg-background px-2.5 py-1 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  <span className="text-xs text-muted-foreground">seconds</span>
                </div>
              </div>
            </Field>
          </div>

          <div>
            <Field
              id={ids.autoAdvanceMode}
              label="Auto-Advance Mode"
              hint={
                mediaType === "VIDEO"
                  ? "Choose fixed duration or advance when the video ends"
                  : "Images always advance when duration completes"
              }
            >
              <SelectInput
                id={ids.autoAdvanceMode}
                value={autoAdvanceMode}
                onChange={(e) =>
                  setAutoAdvanceMode(e.target.value as "FIXED_DURATION" | "VIDEO_END")
                }
              >
                <option value="FIXED_DURATION">Fixed Duration (Timer loops/advances)</option>
                <option value="VIDEO_END" disabled={mediaType !== "VIDEO"}>
                  When Video Ends (Native onEnded trigger)
                </option>
              </SelectInput>
            </Field>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={ids.mediaType} label="Media Type">
          <SelectInput
            id={ids.mediaType}
            value={mediaType}
            onChange={(e) => {
              const val = e.target.value as "IMAGE" | "VIDEO";
              setMediaType(val);
              if (val === "IMAGE" && autoAdvanceMode === "VIDEO_END") {
                setAutoAdvanceMode("FIXED_DURATION");
              }
            }}
          >
            <option value="IMAGE">Image (Photo background)</option>
            <option value="VIDEO">Video (Muted loop / clip)</option>
          </SelectInput>
        </Field>

        <Field id={ids.status} label="Status">
          <SelectInput
            id={ids.status}
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED")}
          >
            <option value="PUBLISHED">Published (Visible on site)</option>
            <option value="DRAFT">Draft (Hidden)</option>
            <option value="ARCHIVED">Archived</option>
          </SelectInput>
        </Field>
      </div>

      {/* MEDIA URLS & UPLOADS */}
      <div className="space-y-4 rounded border border-border p-4 bg-surface/30">
        <h4 className="font-display text-sm uppercase tracking-wider text-foreground">
          Media Assets & Storage
        </h4>

        {mediaType === "IMAGE" ? (
          <div className="space-y-4">
            <Field
              id={ids.imageUrl}
              label="Desktop Image URL"
              hint="Direct URL or upload using the media provider"
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
                  <span>{uploadingImage ? "Uploading..." : "Upload image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFile}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </Field>

            <Field
              id={ids.mobileUrl}
              label="Mobile Image URL (Optional)"
              hint="Dedicated portrait or cropped image for mobile screens"
            >
              <div className="flex gap-2">
                <TextInput
                  id={ids.mobileUrl}
                  value={mobileUrl}
                  onChange={(e) => setMobileUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-2">
                  <Upload className="size-3.5" />
                  <span>{uploadingMobile ? "Uploading..." : "Upload mobile image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMobileFile}
                    disabled={uploadingMobile}
                  />
                </label>
              </div>
            </Field>
          </div>
        ) : (
          <div className="space-y-4">
            <Field
              id={ids.videoUrl}
              label="Desktop Video URL (MP4 / WebM)"
              hint="Direct URL to desktop video asset (1920x1080 recommended)"
            >
              <div className="flex gap-2">
                <TextInput
                  id={ids.videoUrl}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-2">
                  <Upload className="size-3.5" />
                  <span>{uploadingVideo ? "Uploading..." : "Upload video"}</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoFile}
                    disabled={uploadingVideo}
                  />
                </label>
              </div>
            </Field>

            <Field
              id={ids.mobileUrl}
              label="Mobile Video URL (Optional)"
              hint="Mobile-optimized portrait or lightweight video for mobile devices"
            >
              <div className="flex gap-2">
                <TextInput
                  id={ids.mobileUrl}
                  value={mobileUrl}
                  onChange={(e) => setMobileUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-2">
                  <Upload className="size-3.5" />
                  <span>{uploadingMobile ? "Uploading..." : "Upload mobile video"}</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleMobileFile}
                    disabled={uploadingMobile}
                  />
                </label>
              </div>
            </Field>

            <Field
              id={ids.posterUrl}
              label="Poster Image URL"
              hint="Fallback poster image shown before video plays or if video playback fails"
            >
              <div className="flex gap-2">
                <TextInput
                  id={ids.posterUrl}
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-2">
                  <Upload className="size-3.5" />
                  <span>{uploadingPoster ? "Uploading..." : "Upload poster"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePosterFile}
                    disabled={uploadingPoster}
                  />
                </label>
              </div>
            </Field>
          </div>
        )}
      </div>

      {/* CTAS */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={ids.ctaLabel} label="Primary CTA Label">
          <TextInput
            id={ids.ctaLabel}
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
          />
        </Field>
        <Field id={ids.ctaUrl} label="Primary CTA URL" hint="e.g. #choose-your-path, /rides">
          <TextInput id={ids.ctaUrl} value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
        </Field>
        <Field id={ids.secondaryCtaLabel} label="Secondary CTA Label">
          <TextInput
            id={ids.secondaryCtaLabel}
            value={secondaryCtaLabel}
            onChange={(e) => setSecondaryCtaLabel(e.target.value)}
          />
        </Field>
        <Field id={ids.secondaryCtaUrl} label="Secondary CTA URL" hint="e.g. /plan, /about">
          <TextInput
            id={ids.secondaryCtaUrl}
            value={secondaryCtaUrl}
            onChange={(e) => setSecondaryCtaUrl(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
          {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {slide ? "Save changes" : "Create hero slide"}
        </Button>
      </div>
    </form>
  );
}
