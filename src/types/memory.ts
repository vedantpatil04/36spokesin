import type { ID, ISOYearMonth } from "./common";
import type { MediaAsset } from "./media";

export type MemoryKind = "Expedition" | "Ride" | "Workshop" | "Meetup";

/** A moment from the community's past, shown on Memory Lane. */
export type Memory = {
  id: ID;
  date: ISOYearMonth;
  /** Short place name shown on the milestone marker. */
  marker: string;
  title: string;
  location: string;
  caption: string;
  kind: MemoryKind;
  image: MediaAsset;
};
