/**
 * Grid emission factors from the Central Electricity Authority (CEA), Ministry of Power,
 * "CO₂ Baseline Database for the Indian Power Sector".
 * Values are the weighted average emission factor for the all-India grid, including renewables.
 */
export interface CeaFactor {
  id: string;
  fy: string;
  value: number; // kg CO₂/kWh
  version: string;
  published?: string;
}

export const CEA_SOURCE = {
  name: "Central Electricity Authority (CEA), Ministry of Power",
  title: "CO₂ Baseline Database for the Indian Power Sector",
  metric: "Weighted average emission factor, all-India grid (including renewables)",
  url: "https://cea.nic.in",
} as const;

export const CEA_FACTORS: readonly CeaFactor[] = [
  { id: "fy2025-26", fy: "2025-26", value: 0.675, version: "v22.0", published: "Aug 2026" },
  { id: "fy2024-25", fy: "2024-25", value: 0.71, version: "v21.0" },
  { id: "fy2023-24", fy: "2023-24", value: 0.727, version: "v20.0" },
  { id: "fy2022-23", fy: "2022-23", value: 0.716, version: "v19.0" },
] as const;

/** The latest CEA factor (first row of the table). */
export const LATEST_FACTOR: CeaFactor = CEA_FACTORS[0]!;
export const DEFAULT_FACTOR_ID = LATEST_FACTOR.id;
export const CUSTOM_FACTOR_ID = "custom";

export interface GridChoice {
  factorId: string; // a CEA id or "custom"
  customFactor: number | null;
}

export interface ResolvedFactor {
  value: number;
  isCustom: boolean;
  fy: string | null;
  version: string | null;
}

export function getCeaFactor(id: string): CeaFactor {
  return CEA_FACTORS.find((f) => f.id === id) ?? LATEST_FACTOR;
}

export function isValidCustomFactor(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 && v <= 2;
}

export function resolveFactor(choice: GridChoice): ResolvedFactor {
  if (choice.factorId === CUSTOM_FACTOR_ID && isValidCustomFactor(choice.customFactor)) {
    return { value: choice.customFactor, isCustom: true, fy: null, version: null };
  }
  const f = getCeaFactor(choice.factorId);
  return { value: f.value, isCustom: false, fy: f.fy, version: f.version };
}

export function factorCitation(f: ResolvedFactor): string {
  const v = f.value.toFixed(3);
  if (f.isCustom) return `Grid factor used: ${v} kg CO₂/kWh, custom factor (user override)`;
  return `Grid factor used: ${v} kg CO₂/kWh, CEA CO₂ Baseline Database ${f.version}, FY ${f.fy}`;
}
