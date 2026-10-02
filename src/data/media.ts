/**
 * Media library: every image the app uses, grouped by where it belongs.
 *
 * Placeholder photography until Phase 7. To replace an image, change the asset
 * here (src, dimensions, optional srcSet/focalPoint); components read these
 * objects and do not reference files directly.
 */

import aboutHero from "@/assets/about-hero.jpg";
import brandCrest from "@/assets/brand-crest.jpg";
import communityHero from "@/assets/community-hero.jpg";
import communityRiders from "@/assets/community-riders.jpg";
import destLadakh from "@/assets/dest-ladakh.jpg";
import destMeghalaya from "@/assets/dest-meghalaya.jpg";
import destSpiti from "@/assets/dest-spiti.jpg";
import garageWorkshop from "@/assets/garage-workshop.jpg";
import heroRide from "@/assets/hero-ride.jpg";
import productLuggage from "@/assets/product-luggage.jpg";
import productProtect from "@/assets/product-protect.jpg";
import type { MediaAsset, MediaCategory } from "@/types";

/**
 * Shown where a catalogue entry has no uploaded photo yet: a 36-spoke wheel on
 * the surface colour. Inline SVG, so it needs no file in the repository or R2.
 */
const SPOKED_WHEEL_SQUARE =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20800%22%3E%3Crect%20width%3D%22800%22%20height%3D%22800%22%20fill%3D%22%2326221e%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23f3eee6%22%20stroke-opacity%3D%22.13%22%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22400%22%20r%3D%22260%22%20stroke-width%3D%2214%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22400%22%20r%3D%2230%22%20stroke-width%3D%2210%22%2F%3E%3Cpath%20d%3D%22M400%20400L650.0%20400.0%20M400%20400L646.2%20443.4%20M400%20400L634.9%20485.5%20M400%20400L616.5%20525.0%20M400%20400L591.5%20560.7%20M400%20400L560.7%20591.5%20M400%20400L525.0%20616.5%20M400%20400L485.5%20634.9%20M400%20400L443.4%20646.2%20M400%20400L400.0%20650.0%20M400%20400L356.6%20646.2%20M400%20400L314.5%20634.9%20M400%20400L275.0%20616.5%20M400%20400L239.3%20591.5%20M400%20400L208.5%20560.7%20M400%20400L183.5%20525.0%20M400%20400L165.1%20485.5%20M400%20400L153.8%20443.4%20M400%20400L150.0%20400.0%20M400%20400L153.8%20356.6%20M400%20400L165.1%20314.5%20M400%20400L183.5%20275.0%20M400%20400L208.5%20239.3%20M400%20400L239.3%20208.5%20M400%20400L275.0%20183.5%20M400%20400L314.5%20165.1%20M400%20400L356.6%20153.8%20M400%20400L400.0%20150.0%20M400%20400L443.4%20153.8%20M400%20400L485.5%20165.1%20M400%20400L525.0%20183.5%20M400%20400L560.7%20208.5%20M400%20400L591.5%20239.3%20M400%20400L616.5%20275.0%20M400%20400L634.9%20314.5%20M400%20400L646.2%20356.6%22%20stroke-width%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";
const SPOKED_WHEEL_WIDE =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201200%20900%22%3E%3Crect%20width%3D%221200%22%20height%3D%22900%22%20fill%3D%22%2326221e%22%2F%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23f3eee6%22%20stroke-opacity%3D%22.13%22%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22450%22%20r%3D%22310%22%20stroke-width%3D%2214%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22450%22%20r%3D%2230%22%20stroke-width%3D%2210%22%2F%3E%3Cpath%20d%3D%22M600%20450L900.0%20450.0%20M600%20450L895.4%20502.1%20M600%20450L881.9%20552.6%20M600%20450L859.8%20600.0%20M600%20450L829.8%20642.8%20M600%20450L792.8%20679.8%20M600%20450L750.0%20709.8%20M600%20450L702.6%20731.9%20M600%20450L652.1%20745.4%20M600%20450L600.0%20750.0%20M600%20450L547.9%20745.4%20M600%20450L497.4%20731.9%20M600%20450L450.0%20709.8%20M600%20450L407.2%20679.8%20M600%20450L370.2%20642.8%20M600%20450L340.2%20600.0%20M600%20450L318.1%20552.6%20M600%20450L304.6%20502.1%20M600%20450L300.0%20450.0%20M600%20450L304.6%20397.9%20M600%20450L318.1%20347.4%20M600%20450L340.2%20300.0%20M600%20450L370.2%20257.2%20M600%20450L407.2%20220.2%20M600%20450L450.0%20190.2%20M600%20450L497.4%20168.1%20M600%20450L547.9%20154.6%20M600%20450L600.0%20150.0%20M600%20450L652.1%20154.6%20M600%20450L702.6%20168.1%20M600%20450L750.0%20190.2%20M600%20450L792.8%20220.2%20M600%20450L829.8%20257.2%20M600%20450L859.8%20300.0%20M600%20450L881.9%20347.4%20M600%20450L895.4%20397.9%22%20stroke-width%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

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
      "Adventure motorcycle touring on a scenic winding mountain road in the Western Ghats",
      1920,
      1080,
      "site",
    ),
    about: asset(
      aboutHero,
      "Royal Enfield Interceptor 650 and Continental GT 650 on a scenic coastal mountain road",
      1920,
      1080,
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
      "Adventure motorcycle parked along a misty mountain road in Meghalaya",
      1024,
      1365,
      "destinations",
    ),
  },
  products: {
    luggage: asset(
      productLuggage,
      "Aluminium expedition panniers and tail duffel bag mounted on an adventure motorcycle",
      1024,
      1024,
      "products",
    ),
    protect: asset(
      productProtect,
      "Technical adventure touring jacket, dual-sport helmet, and leather gloves on a workshop bench",
      1024,
      1024,
      "products",
    ),
  },
  garage: {
    workshop: asset(
      garageWorkshop,
      "Mechanics servicing an adventure motorcycle on a hydraulic lift in an authentic workshop",
      1536,
      1024,
      "garage",
    ),
  },
  placeholders: {
    product: asset(SPOKED_WHEEL_SQUARE, "No photo yet", 800, 800, "products"),
    bike: asset(SPOKED_WHEEL_WIDE, "No photo yet", 1200, 900, "bikes"),
  },
  riders: {
    community: asset(
      communityHero,
      "36 Spokes community riders gathered together",
      1600,
      1200,
      "riders",
    ),
    pack: asset(
      communityRiders,
      "36 Spokes adventure riders gathered with their motorcycles at a mountain pass",
      1440,
      960,
      "riders",
    ),
  },
} as const;
