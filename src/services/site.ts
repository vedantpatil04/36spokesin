import { garageServices, setupChecklist } from "@/data/garage";
import { pillars } from "@/data/pillars";
import type { GarageService, Pillar, SetupCheckItem } from "@/types";

export async function listPillars(): Promise<Pillar[]> {
  return [...pillars];
}

export async function listGarageServices(): Promise<GarageService[]> {
  return [...garageServices];
}

/** Sample check. Phase 3 computes it per rider from their registered gear. */
export async function getSetupChecklist(): Promise<SetupCheckItem[]> {
  return [...setupChecklist];
}
