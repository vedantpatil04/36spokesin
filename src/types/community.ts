import type { ID } from "./common";
import type { MediaAsset } from "./media";

/**
 * A founder of 36 Spokes. Only the name is guaranteed: every other field is
 * null until the business supplies it, and the UI omits what is missing.
 */
export type Founder = {
  id: ID;
  name: string;
  role: string | null;
  shortBio: string | null;
  /** Longer story; blank lines start paragraphs. */
  story: string | null;
  quote: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  /** The founder's photo, or the 36 Spokes placeholder when `hasImage` is false. */
  image: MediaAsset;
  hasImage: boolean;
};

/** A rider featured on the Community page, with only what they chose to share. */
export type RiderSpotlight = {
  id: ID;
  name: string;
  bike: string | null;
  location: string | null;
  favouriteRide: string | null;
  shortStory: string | null;
  image: MediaAsset;
  hasImage: boolean;
};
