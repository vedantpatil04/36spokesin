import type { GarageService, SetupCheckItem } from "@/types";

export const garageServices: GarageService[] = [
  { name: "Find Your Bike", note: "Match parts and gear to your exact model and variant." },
  { name: "Maintenance", note: "Pre-trip checks, service schedules and consumables." },
  { name: "Installation", note: "Fitment of luggage, guards, lighting and electronics." },
  { name: "Customization", note: "Ergonomics, seats, suspension and touring setups." },
  { name: "Services", note: "Workshop partners along popular touring routes." },
];

/** Sample trip-ready check. Phase 3 derives this from the rider's registered gear. */
export const setupChecklist: SetupCheckItem[] = [
  { label: "Protection", status: "ready", note: "Crash guards + armoured jacket" },
  { label: "Luggage", status: "missing", note: "No hard panniers registered" },
  { label: "Navigation", status: "ready", note: "Damped mount fitted" },
  { label: "Emergency", status: "missing", note: "No tyre repair kit" },
  { label: "Rain Protection", status: "missing", note: "Rain layer recommended" },
];
