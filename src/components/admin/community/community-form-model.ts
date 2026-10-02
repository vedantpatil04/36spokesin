/** Non-component helpers for the community editors (see community-form.tsx). */
import { useState } from "react";
import type { ApiImage } from "@/lib/api";
import { updateImageAltText } from "@/services/admin/community";
import { describeError } from "@/services/request-helpers";
import type { ImageChoice } from "../SingleImageField";
import { fieldErrors } from "../admin-format";

/** Image picker plus the alt text stored on the uploaded asset. */
export type ImageState = { choice: ImageChoice; altText: string; initialAltText: string };

export const initialImage = (image: ApiImage | null): ImageState => ({
  choice: image ? { id: image.id, url: image.url } : null,
  altText: image?.altText ?? "",
  initialAltText: image?.altText ?? "",
});

/** Saves alt text on the asset when it changed (or when a new image was chosen). */
export async function saveAltText(image: ImageState, previousImageId: string | null) {
  if (!image.choice) return;
  const text = image.altText.trim();
  const changed = image.choice.id !== previousImageId || text !== image.initialAltText.trim();
  if (changed) await updateImageAltText(image.choice.id, text === "" ? null : text);
}

/**
 * Save flow shared by the community forms: client checks, the API call, then
 * field errors mapped back onto the form.
 */
export function useSave() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (clientErrors: Record<string, string>, action: () => Promise<void>) => {
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setMessage("Some fields need attention.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setErrors(fieldErrors(error));
      setMessage(describeError(error));
    } finally {
      setSaving(false);
    }
  };

  return { errors, message, saving, save };
}

export const trimOrNull = (value: string) => (value.trim() === "" ? null : value.trim());

export const isLink = (value: string) =>
  value.trim() === "" || /^https?:\/\/\S+\.\S+/.test(value.trim());
