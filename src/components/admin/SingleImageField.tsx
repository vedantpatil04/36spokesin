import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useId, useState } from "react";
import type { ApiMediaCategory } from "@/lib/api";
import { ACCEPTED_IMAGE_TYPES, uploadImage } from "@/services/media-uploads";
import { describeError } from "@/services/request-helpers";

export type ImageChoice = { id: string; url: string | null } | null;

/**
 * One image for a category or bike: upload straight to storage, then hand the
 * asset id to the form. The previous file is released by the API when the
 * record is saved and nothing else uses it.
 */
export function SingleImageField({
  label,
  category,
  value,
  onChange,
  disabled,
}: {
  label: string;
  category: ApiMediaCategory;
  value: ImageChoice;
  onChange: (value: ImageChoice) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (file: File) => {
    setError(null);
    setProgress(0);
    try {
      const asset = await uploadImage(file, { category, onProgress: setProgress });
      onChange({ id: asset.id, url: asset.url });
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-surface">
          {value?.url ? (
            <img src={value.url} alt="" className="size-full object-cover" />
          ) : progress !== null ? (
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={id}
            className="inline-flex h-9 cursor-pointer items-center rounded-sm border border-border-strong px-3.5 font-display text-[0.7rem] uppercase tracking-[0.14em] hover:border-primary"
          >
            {progress !== null
              ? `Uploading ${Math.round(progress * 100)}%`
              : value
                ? "Replace"
                : "Upload"}
            <input
              id={id}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              disabled={disabled || progress !== null}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void choose(file);
              }}
            />
          </label>
          {value ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled || progress !== null}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
