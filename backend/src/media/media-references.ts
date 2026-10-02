import type { Prisma } from "../generated/prisma/client.js";

/**
 * Every relation through which a record uses a MediaAsset, with a label for
 * error messages. `satisfies` makes this list exhaustive: adding a relation to
 * MediaAsset in schema.prisma fails compilation until it is listed here, so
 * reference checks can never silently miss a new entity (trips, stories, …).
 */
export const MEDIA_REFERENCES = {
  riderAvatars: "rider profile photo",
  productImages: "product image",
  categoryImages: "product category image",
  bikeModelImages: "bike model image",
  galleryImages: "destination, trip or ride image",
  socialPosts: "social post image",
  founderImages: "founder photo",
  storyCovers: "story cover image",
  riderSpotlightImages: "rider spotlight photo",
  groupCovers: "group cover image",
  heroImages: "hero slide image",
  heroVideos: "hero slide video",
  heroPosters: "hero slide poster",
  heroMobileMedia: "hero slide mobile media",
  pathCardImages: "path card image",
  paymentProofs: "payment proof",
  paymentQrs: "payment QR code",
} as const satisfies Record<keyof Prisma.MediaAssetCountOutputType, string>;

export type MediaReferenceKind = keyof typeof MEDIA_REFERENCES;

export type MediaReferenceCounts = Record<MediaReferenceKind, number>;

/**
 * References an owner's explicit delete may detach instead of being blocked by.
 * Deleting your own profile photo clears it from your profile (Phase 3 contract).
 */
export const DETACHABLE_REFERENCES: readonly MediaReferenceKind[] = [
  "riderAvatars",
  "socialPosts",
  "heroImages",
  "heroVideos",
  "heroPosters",
  "heroMobileMedia",
  "pathCardImages",
];

const REFERENCE_KINDS = Object.keys(MEDIA_REFERENCES) as MediaReferenceKind[];

export const NO_REFERENCES: MediaReferenceCounts = Object.fromEntries(
  REFERENCE_KINDS.map((kind) => [kind, 0]),
) as MediaReferenceCounts;

/** Matches assets that nothing references. */
export const UNREFERENCED_WHERE = Object.fromEntries(
  REFERENCE_KINDS.map((kind) => [kind, { none: {} }]),
) as Prisma.MediaAssetWhereInput;

export const MEDIA_REFERENCE_COUNT_SELECT = {
  _count: {
    select: Object.fromEntries(REFERENCE_KINDS.map((kind) => [kind, true])) as Record<
      MediaReferenceKind,
      true
    >,
  },
} satisfies Prisma.MediaAssetSelect;

export function totalReferences(
  counts: MediaReferenceCounts,
  ignore: readonly MediaReferenceKind[] = [],
) {
  return REFERENCE_KINDS.filter((kind) => !ignore.includes(kind)).reduce(
    (sum, kind) => sum + counts[kind],
    0,
  );
}

/** "Used as 2 product images and 1 bike model image." */
export function describeReferences(
  counts: MediaReferenceCounts,
  ignore: readonly MediaReferenceKind[] = [],
): string {
  const parts = REFERENCE_KINDS.filter((kind) => !ignore.includes(kind) && counts[kind] > 0).map(
    (kind) => `${counts[kind]} ${MEDIA_REFERENCES[kind]}${counts[kind] === 1 ? "" : "s"}`,
  );
  if (parts.length === 0) return "Not in use.";
  const last = parts.pop();
  return `Used as ${parts.length > 0 ? `${parts.join(", ")} and ${last}` : last}.`;
}
