import type {
  ApiContentStatus,
  ApiDepartureStatus,
  ApiDifficulty,
  ApiRideStatus,
  ApiRideType,
} from "@/lib/api";

export const DIFFICULTY_OPTIONS: { value: ApiDifficulty; label: string }[] = [
  { value: "EASY", label: "Easy" },
  { value: "MODERATE", label: "Moderate" },
  { value: "CHALLENGING", label: "Challenging" },
  { value: "EXPERT", label: "Expert" },
];

export const CONTENT_STATUS_OPTIONS: { value: ApiContentStatus; label: string; hint: string }[] = [
  { value: "DRAFT", label: "Draft", hint: "Hidden from the public site." },
  { value: "PUBLISHED", label: "Published", hint: "Visible on the public site." },
  { value: "ARCHIVED", label: "Archived", hint: "Removed from the site; kept for history." },
];

export const RIDE_STATUS_OPTIONS: { value: ApiRideStatus; label: string; hint: string }[] = [
  { value: "DRAFT", label: "Draft", hint: "Hidden from the public site." },
  {
    value: "UPCOMING",
    label: "Upcoming",
    hint: "Public; riders can join until it starts or fills.",
  },
  { value: "FULL", label: "Full", hint: "Public; closed to new riders." },
  { value: "COMPLETED", label: "Completed", hint: "Listed under past rides." },
  { value: "CANCELLED", label: "Cancelled", hint: "Public with a cancelled notice; no joining." },
  { value: "ARCHIVED", label: "Archived", hint: "Removed from the site." },
];

export const RIDE_TYPE_OPTIONS: { value: ApiRideType; label: string }[] = [
  { value: "DAY_RIDE", label: "Day ride" },
  { value: "WEEKEND", label: "Weekend" },
  { value: "GROUP_RIDE", label: "Group ride" },
  { value: "EVENT", label: "Event" },
];

export const DEPARTURE_STATUS_OPTIONS: { value: ApiDepartureStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "FULL", label: "Full" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled (hidden)" },
];
