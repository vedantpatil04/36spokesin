import type { ID, ISODate } from "./common";
import type { MediaAsset } from "./media";

export type CommunityEventType =
  "Weekend Ride" | "Community Meetup" | "Workshop" | "Ride & Camp" | "Adventure Departure";

export type CommunityEventLevel = "Open to all riders" | "Beginner friendly" | "Experienced riders";

/**
 * An event hosted by 36 Spokes. Named CommunityEvent rather than Event to avoid
 * shadowing the DOM `Event` type.
 */
export type CommunityEvent = {
  id: ID;
  title: string;
  type: CommunityEventType;
  startDate: ISODate;
  /** Present for multi-day events. */
  endDate?: ISODate;
  location: string;
  meetingPoint: string;
  level: CommunityEventLevel;
  host: string;
  groupId?: ID;
  description: string;
  image: MediaAsset;
};
