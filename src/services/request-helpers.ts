import { ApiError } from "@/lib/api";

/** Resolves to null when the API answers 404, so routes can turn it into `notFound()`. */
export async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** A message safe to show next to a control: field details when present, else the API's message. */
export function describeError(
  error: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  if (error instanceof ApiError) {
    const fieldMessages = error.details.flatMap((detail) => detail.messages);
    return fieldMessages.length > 0 ? fieldMessages.join(" ") : error.message;
  }
  return fallback;
}
