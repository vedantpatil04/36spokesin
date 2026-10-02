import type { LockableTable } from "../common/database/row-lock.js";
import type { Prisma } from "../generated/prisma/client.js";
import { MediaCategory } from "../generated/prisma/enums.js";

/** Records that own a photo gallery (the GalleryImage table). */
export type GalleryOwner = "destination" | "trip" | "ride";

export const GALLERY_OWNERS: Record<
  GalleryOwner,
  { table: LockableTable; category: MediaCategory; label: string }
> = {
  destination: { table: "destinations", category: MediaCategory.DESTINATION, label: "Destination" },
  trip: { table: "trips", category: MediaCategory.TRIP, label: "Trip" },
  ride: { table: "rides", category: MediaCategory.RIDE, label: "Ride" },
};

export function ownerWhere(owner: GalleryOwner, id: string): Prisma.GalleryImageWhereInput {
  switch (owner) {
    case "destination":
      return { destinationId: id };
    case "trip":
      return { tripId: id };
    case "ride":
      return { rideId: id };
  }
}

export function ownerColumns(
  owner: GalleryOwner,
  id: string,
): Pick<Prisma.GalleryImageUncheckedCreateInput, "destinationId" | "tripId" | "rideId"> {
  return {
    destinationId: owner === "destination" ? id : null,
    tripId: owner === "trip" ? id : null,
    rideId: owner === "ride" ? id : null,
  };
}

/** Include for public/admin reads: the gallery in display order with its assets. */
export const galleryInclude = {
  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  include: { mediaAsset: true },
} satisfies Prisma.GalleryImageFindManyArgs;

export type GalleryImageRow = Prisma.GalleryImageGetPayload<{ include: { mediaAsset: true } }>;
