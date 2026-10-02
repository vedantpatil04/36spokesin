import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { type DragEvent, type PointerEvent, useEffect, useId, useRef, useState } from "react";
import { Badge, Button, TextInput } from "@/components/ui-kit";
import type { ApiProductImage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { type GalleryApi, productGalleryApi } from "@/services/admin/gallery";
import { ACCEPTED_IMAGE_TYPES, uploadImage, validateImageFile } from "@/services/media-uploads";
import { describeError } from "@/services/request-helpers";
import { AdminPanel, InlineError } from "./admin-ui";

const MAX_PARALLEL_UPLOADS = 3;
const MAX_IMAGES = 20;

type Upload = {
  key: string;
  file: File;
  previewUrl: string;
  progress: number;
  phase: "queued" | "uploading" | "attaching" | "failed";
  error: string | null;
  /** Set once the file is in storage, so a failed attach retries without re-uploading. */
  assetId: string | null;
  controller: AbortController;
};

let uploadKey = 0;

const iconButton =
  "flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/**
 * Gallery editor for products, destinations, trips and rides (pass `api`).
 * Every action is saved immediately through the API:
 * files go straight to R2 with a signed URL, are verified by the API, then
 * attached; ordering, primary image, alt text, replacement and removal each
 * persist on their own. The server's response always replaces local state.
 */
export function ProductMediaManager({
  productId,
  productName,
  initialImages,
  onChange,
  api = productGalleryApi,
  maxImages = MAX_IMAGES,
}: {
  /** Id of the record that owns the gallery. */
  productId: string;
  productName: string;
  initialImages: ApiProductImage[];
  onChange: (images: ApiProductImage[]) => void;
  api?: GalleryApi;
  maxImages?: number;
}) {
  const inputId = useId();
  const [images, setImages] = useState(initialImages);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replacing, setReplacing] = useState<{ imageId: string; progress: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;

  // Release preview URLs when the editor closes.
  useEffect(
    () => () => {
      for (const upload of uploadsRef.current) {
        upload.controller.abort();
        URL.revokeObjectURL(upload.previewUrl);
      }
    },
    [],
  );

  const apply = (list: { images: ApiProductImage[] }) => {
    setImages(list.images);
    onChange(list.images);
  };

  const runImageAction = async (
    imageId: string,
    action: () => Promise<{ images: ApiProductImage[] }>,
  ) => {
    setBusyId(imageId);
    setError(null);
    try {
      apply(await action());
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusyId(null);
    }
  };

  // ─── Uploads ───────────────────────────────────────────────────────────

  const patchUpload = (key: string, patch: Partial<Upload>) =>
    setUploads((current) =>
      current.map((upload) => (upload.key === key ? { ...upload, ...patch } : upload)),
    );

  const dropUpload = (key: string) =>
    setUploads((current) => {
      const upload = current.find((entry) => entry.key === key);
      if (upload) URL.revokeObjectURL(upload.previewUrl);
      return current.filter((entry) => entry.key !== key);
    });

  const processUpload = async (upload: Upload) => {
    try {
      let assetId = upload.assetId;
      if (!assetId) {
        patchUpload(upload.key, { phase: "uploading", progress: 0, error: null });
        const asset = await uploadImage(upload.file, {
          category: api.category,
          signal: upload.controller.signal,
          onProgress: (progress) => patchUpload(upload.key, { progress }),
        });
        assetId = asset.id;
      }
      patchUpload(upload.key, { phase: "attaching", assetId });
      apply(await api.attach(productId, { mediaAssetId: assetId }));
      dropUpload(upload.key);
    } catch (caught) {
      if (isAbort(caught)) {
        dropUpload(upload.key);
        return;
      }
      patchUpload(upload.key, { phase: "failed", error: describeError(caught) });
    }
  };

  /** Runs queued uploads a few at a time. */
  const runQueue = async (queue: Upload[]) => {
    const pending = [...queue];
    const worker = async () => {
      for (let next = pending.shift(); next; next = pending.shift()) await processUpload(next);
    };
    await Promise.all(
      Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, pending.length) }, worker),
    );
  };

  const addFiles = (files: FileList | File[]) => {
    setError(null);
    const room =
      maxImages - images.length - uploads.filter((upload) => upload.phase !== "failed").length;
    const list = [...files];
    if (list.length > room) {
      setError(
        `This gallery can have ${maxImages} images. Only the first ${Math.max(room, 0)} were added.`,
      );
    }
    const created = list.slice(0, Math.max(room, 0)).map<Upload>((file) => {
      const invalid = validateImageFile(file);
      return {
        key: `upload-${(uploadKey += 1)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        phase: invalid ? "failed" : "queued",
        error: invalid,
        assetId: null,
        controller: new AbortController(),
      };
    });
    setUploads((current) => [...current, ...created]);
    void runQueue(created.filter((upload) => upload.phase === "queued"));
  };

  const retry = (upload: Upload) => {
    const fresh = {
      ...upload,
      controller: new AbortController(),
      phase: "queued" as const,
      error: null,
    };
    patchUpload(upload.key, fresh);
    void runQueue([fresh]);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
  };

  // ─── Reorder ───────────────────────────────────────────────────────────

  const order = preview ?? images.map((image) => image.id);
  const ordered = order
    .map((id) => images.find((image) => image.id === id))
    .filter((image): image is ApiProductImage => Boolean(image));

  const commitOrder = async (ids: string[]) => {
    setPreview(null);
    if (ids.join() === images.map((image) => image.id).join()) return;
    // Show the new order straight away; the API response confirms it.
    setImages((current) =>
      ids.map((id) => current.find((image) => image.id === id)!).filter(Boolean),
    );
    setBusyId("reorder");
    setError(null);
    try {
      apply(await api.reorder(productId, ids));
    } catch (caught) {
      setImages(images);
      setError(describeError(caught));
    } finally {
      setBusyId(null);
    }
  };

  const moveBy = (id: string, offset: number) => {
    const ids = images.map((image) => image.id);
    const from = ids.indexOf(id);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ...ids.splice(from, 1));
    void commitOrder(ids);
  };

  // Pointer-based dragging works with mouse, pen and touch (tablets).
  const onHandleDown = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (busyId) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragId(id);
    setPreview(images.map((image) => image.id));
  };

  const onHandleMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragId || !preview) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-image-id]")?.dataset["imageId"];
    if (!target || target === dragId) return;
    const next = preview.filter((id) => id !== dragId);
    next.splice(preview.indexOf(target), 0, dragId);
    setPreview(next);
  };

  const onHandleUp = () => {
    if (!dragId) return;
    setDragId(null);
    if (preview) void commitOrder(preview);
  };

  const onHandleCancel = () => {
    setDragId(null);
    setPreview(null);
  };

  // ─── Replace ───────────────────────────────────────────────────────────

  const replace = async (imageId: string, file: File) => {
    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setReplacing({ imageId, progress: 0 });
    setError(null);
    try {
      const asset = await uploadImage(file, {
        category: api.category,
        onProgress: (progress) => setReplacing({ imageId, progress }),
      });
      apply(await api.replace(productId, imageId, asset.id));
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setReplacing(null);
    }
  };

  const locked = busyId !== null || replacing !== null;

  return (
    <AdminPanel
      id="product-media"
      title="Media"
      description="Drag to reorder. The primary image is the card thumbnail and the hero photo on the public page."
    >
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-4 py-8 text-center transition-colors",
          dragOver ? "border-primary bg-surface" : "border-border-strong",
        )}
      >
        <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Drop images here, or</p>
        <label htmlFor={inputId} className="cursor-pointer">
          <span className="inline-flex h-9 items-center rounded-sm border border-border-strong px-3.5 font-display text-[0.7rem] uppercase tracking-[0.14em] hover:border-primary">
            Choose images
          </span>
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP or AVIF, up to 10 MB each. {images.length}/{maxImages} used.
        </p>
      </div>

      {uploads.length > 0 ? (
        <ul className="mt-4 space-y-2" aria-label="Uploads">
          {uploads.map((upload) => (
            <li
              key={upload.key}
              className="flex items-center gap-3 rounded-sm border border-border p-2"
            >
              <img
                src={upload.previewUrl}
                alt=""
                className="size-12 shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{upload.file.name}</p>
                {upload.phase === "failed" ? (
                  <p className="text-xs text-destructive">{upload.error}</p>
                ) : (
                  <>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2"
                      role="progressbar"
                      aria-label={`Uploading ${upload.file.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(upload.progress * 100)}
                    >
                      <div
                        className="h-full bg-primary transition-[width]"
                        style={{ width: `${Math.round(upload.progress * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {upload.phase === "queued"
                        ? "Waiting…"
                        : upload.phase === "attaching"
                          ? "Verifying and adding to the gallery…"
                          : `Uploading ${Math.round(upload.progress * 100)}%`}
                    </p>
                  </>
                )}
              </div>
              {upload.phase === "failed" ? (
                <>
                  {!validateImageFile(upload.file) ? (
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => retry(upload)}
                      aria-label={`Retry ${upload.file.name}`}
                    >
                      <RotateCcw className="size-4" aria-hidden />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => dropUpload(upload.key)}
                    aria-label={`Dismiss ${upload.file.name}`}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </>
              ) : upload.phase !== "attaching" ? (
                <button
                  type="button"
                  className={iconButton}
                  onClick={() =>
                    upload.phase === "queued" ? dropUpload(upload.key) : upload.controller.abort()
                  }
                  aria-label={`Cancel ${upload.file.name}`}
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : (
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        <InlineError message={error} />
      </div>

      {images.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No images yet. The shop shows a placeholder until you add one.
        </p>
      ) : (
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3" aria-busy={locked}>
          {ordered.map((image, index) => {
            const draft = altDrafts[image.id] ?? image.altText ?? "";
            const altChanged = draft.trim() !== (image.altText ?? "");
            const isReplacing = replacing?.imageId === image.id;
            return (
              <li
                key={image.id}
                data-image-id={image.id}
                className={cn(
                  "overflow-hidden rounded-sm border bg-card transition-shadow",
                  image.isPrimary ? "border-primary" : "border-border",
                  dragId === image.id && "opacity-60 ring-2 ring-primary",
                )}
              >
                <div className="relative aspect-square bg-surface">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.altText ?? ""}
                      className="size-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <p className="flex size-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                      Preview unavailable: media storage isn't configured.
                    </p>
                  )}
                  <div className="absolute left-2 top-2 flex items-center gap-1.5">
                    <span className="rounded-sm bg-background/85 px-1.5 py-0.5 font-mono text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {image.isPrimary ? <Badge tone="primary">Primary</Badge> : null}
                  </div>
                  <button
                    type="button"
                    className={cn(
                      iconButton,
                      "absolute right-2 top-2 cursor-grab touch-none active:cursor-grabbing",
                    )}
                    aria-label={`Drag to reorder image ${index + 1}. Or use the arrow buttons.`}
                    onPointerDown={(event) => onHandleDown(event, image.id)}
                    onPointerMove={onHandleMove}
                    onPointerUp={onHandleUp}
                    onPointerCancel={onHandleCancel}
                    disabled={locked && busyId !== "reorder"}
                  >
                    <GripVertical className="size-4" aria-hidden />
                  </button>
                  {isReplacing ? (
                    <div className="absolute inset-x-0 bottom-0 bg-background/85 p-2 text-xs">
                      Replacing… {Math.round((replacing?.progress ?? 0) * 100)}%
                    </div>
                  ) : null}
                </div>
                <div className="space-y-3 p-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => moveBy(image.id, -1)}
                      disabled={locked || index === 0}
                      aria-label={`Move image ${index + 1} earlier`}
                    >
                      <ArrowLeft className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => moveBy(image.id, 1)}
                      disabled={locked || index === ordered.length - 1}
                      aria-label={`Move image ${index + 1} later`}
                    >
                      <ArrowRight className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() =>
                        void runImageAction(image.id, () => api.setPrimary(productId, image.id))
                      }
                      disabled={locked || image.isPrimary}
                      aria-label={`Make image ${index + 1} the primary image`}
                      title="Set as primary"
                    >
                      <Star
                        className={cn("size-4", image.isPrimary && "fill-primary text-primary")}
                        aria-hidden
                      />
                    </button>
                    <label
                      className={cn(
                        iconButton,
                        "cursor-pointer",
                        locked && "pointer-events-none opacity-40",
                      )}
                      title="Replace image"
                    >
                      <RefreshCw className="size-4" aria-hidden />
                      <span className="sr-only">Replace image {index + 1}</span>
                      <input
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(",")}
                        className="sr-only"
                        disabled={locked}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) void replace(image.id, file);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className={cn(
                        iconButton,
                        "ml-auto hover:border-destructive hover:text-destructive",
                      )}
                      onClick={() => {
                        if (window.confirm(`Remove image ${index + 1} from ${productName}?`)) {
                          void runImageAction(image.id, () => api.remove(productId, image.id));
                        }
                      }}
                      disabled={locked}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      {busyId === image.id ? (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  <div>
                    <label
                      htmlFor={`${inputId}-alt-${image.id}`}
                      className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      Alt text
                    </label>
                    <div className="mt-1.5 flex gap-2">
                      <TextInput
                        id={`${inputId}-alt-${image.id}`}
                        value={draft}
                        maxLength={300}
                        placeholder={`e.g. ${productName}, front view`}
                        onChange={(event) =>
                          setAltDrafts((current) => ({
                            ...current,
                            [image.id]: event.target.value,
                          }))
                        }
                        className="mt-0 h-10"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-10"
                        disabled={!altChanged || locked}
                        onClick={() =>
                          void runImageAction(image.id, async () => {
                            const list = await api.update(productId, image.id, {
                              altText: draft.trim() || null,
                            });
                            setAltDrafts(({ [image.id]: _saved, ...rest }) => rest);
                            return list;
                          })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </AdminPanel>
  );
}
