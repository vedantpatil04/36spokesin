import type { ID, ISODate, Slug } from "./common";
import type { MediaAsset } from "./media";

export type Story = {
  slug: Slug;
  title: string;
  /** Author display name. */
  rider: string;
  riderId?: ID;
  /** Destination display name. */
  destination: string;
  destinationSlug?: Slug;
  publishedAt: ISODate;
  readMinutes: number;
  excerpt: string;
  /** Paragraphs. Phase 3 replaces this with CMS rich text. */
  body: string[];
  image: MediaAsset;
};
