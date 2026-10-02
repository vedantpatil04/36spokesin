import type { ID, ISODate, Slug } from "./common";
import type { MediaAsset } from "./media";

export type Story = {
  /** Present for stories from the API. */
  id?: ID;
  slug: Slug;
  title: string;
  /** Credited author's display name; null when the story carries no credit. */
  rider: string | null;
  riderId?: ID;
  /** Destination display name; null when the story isn't tied to one. */
  destination: string | null;
  destinationSlug?: Slug | null;
  /** Publication date, `YYYY-MM-DD` in India time. */
  publishedAt: ISODate;
  readMinutes: number;
  excerpt: string | null;
  /** Paragraphs. Empty in listings; filled on the story page. */
  body: string[];
  image: MediaAsset;
  /** False when `image` is the no-photo placeholder. */
  hasImage?: boolean;
  featured?: boolean;
};
