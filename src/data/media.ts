/**
 * Media library: every image the app uses, grouped by where it belongs.
 *
 * Placeholder photography until Phase 7. To replace an image, change the asset
 * here (src, dimensions, optional srcSet/focalPoint); components read these
 * objects and do not reference files directly.
 */

import brandCrest from "@/assets/brand-crest.jpg";
import communityRiders from "@/assets/community-riders.jpg";
import destLadakh from "@/assets/dest-ladakh.jpg";
import destMeghalaya from "@/assets/dest-meghalaya.jpg";
import destSpiti from "@/assets/dest-spiti.jpg";
import garageWorkshop from "@/assets/garage-workshop.jpg";
import heroRide from "@/assets/hero-ride.jpg";
import productLuggage from "@/assets/product-luggage.jpg";
import productProtect from "@/assets/product-protect.jpg";
import type { MediaAsset, MediaCategory } from "@/types";

const asset = (
  src: string,
  alt: string,
  width: number,
  height: number,
  category: MediaCategory,
): MediaAsset => ({ src, alt, width, height, category });

export const media = {
  brand: {
    crest: asset(brandCrest, "36 Spokes crest", 192, 192, "brand"),
  },
  site: {
    heroRide: asset(
      heroRide,
      "Rider on a loaded adventure motorcycle climbing a Himalayan mountain road at sunrise",
      1920,
      1088,
      "site",
    ),
  },
  destinations: {
    ladakh: asset(
      destLadakh,
      "Snow-lined mountain road with prayer flags in Ladakh",
      1024,
      1280,
      "destinations",
    ),
    spiti: asset(
      destSpiti,
      "Motorcycle on a winding gravel road through the Spiti valley",
      1024,
      1280,
      "destinations",
    ),
    meghalaya: asset(
      destMeghalaya,
      "Motorcycle on a misty forest road in Meghalaya",
      1024,
      1280,
      "destinations",
    ),
  },
  products: {
    luggage: asset(
      productLuggage,
      "Adventure motorcycle fitted with aluminium panniers",
      1024,
      1024,
      "products",
    ),
    protect: asset(
      productProtect,
      "Adventure helmet and armoured riding jacket",
      1024,
      1024,
      "products",
    ),
  },
  garage: {
    workshop: asset(
      garageWorkshop,
      "Mechanic working on an adventure motorcycle in a workshop",
      1440,
      960,
      "garage",
    ),
  },
  riders: {
    community: asset(
      communityRiders,
      "Group of riders and their motorcycles at a mountain viewpoint",
      1440,
      960,
      "riders",
    ),
  },
} as const;
