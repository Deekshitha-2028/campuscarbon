import { DEFAULT_EFFICIENCY, DEFAULT_PR, last12CompleteMonths, type MonthlyRadiation } from "./calc";
import { DEFAULT_FACTOR_ID, type GridChoice } from "./emissionFactors";
import { createLocalStore } from "./localStore";
import { DEFAULT_LOCATION_ID } from "./locations";

export const BUILDING_TYPES = [
  { id: "hostel", label: "Hostel" },
  { id: "department", label: "Department" },
  { id: "library", label: "Library" },
  { id: "lab", label: "Lab" },
  { id: "admin", label: "Admin block" },
] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number]["id"];

export interface MonthInput {
  key: string; // YYYY-MM
  label: string;
  month: number; // 1-12
  kWh: number | null; // null = missing
}

export interface CalcInput {
  building: { name: string; type: BuildingType; notes: string };
  months: MonthInput[];
  rooftop: { areaM2: number; efficiency: number; performanceRatio: number };
  grid: GridChoice;
  locationId: string;
}

export interface SavedBuilding {
  id: string;
  createdAt: number;
  updatedAt: number;
  input: CalcInput;
  /** Radiation snapshot used when saved, so the result can be reopened offline. */
  radiation: (MonthlyRadiation | null)[] | null;
  radiationFetchedAt: number | null;
}

export function buildingTypeLabel(t: string): string {
  return BUILDING_TYPES.find((b) => b.id === t)?.label ?? "Building";
}

export function emptyMonths(today = new Date()): MonthInput[] {
  return last12CompleteMonths(today).months.map((m) => ({ key: m.key, label: m.label, month: m.month, kWh: null }));
}

export function blankInput(today = new Date()): CalcInput {
  return {
    building: { name: "", type: "hostel", notes: "" },
    months: emptyMonths(today),
    rooftop: { areaM2: 0, efficiency: DEFAULT_EFFICIENCY, performanceRatio: DEFAULT_PR },
    grid: { factorId: DEFAULT_FACTOR_ID, customFactor: null },
    locationId: DEFAULT_LOCATION_ID,
  };
}

/** Sample 300-bed hostel: higher use in hot months (fans, water pumps), dip in vacation months. */
const EXAMPLE_BY_MONTH: Record<number, number> = {
  1: 30500, 2: 32800, 3: 37200, 4: 39800, 5: 27400, 6: 24100,
  7: 31200, 8: 33000, 9: 32100, 10: 30800, 11: 29400, 12: 23600,
};

export function exampleInput(today = new Date()): CalcInput {
  return {
    building: {
      name: "Hostel A (Boys, 300 beds)",
      type: "hostel",
      notes: "Sample data: 3-storey RCC hostel with flat terrace, solar water heaters on the east wing.",
    },
    months: emptyMonths(today).map((m) => ({ ...m, kWh: EXAMPLE_BY_MONTH[m.month] })),
    rooftop: { areaM2: 900, efficiency: DEFAULT_EFFICIENCY, performanceRatio: DEFAULT_PR },
    grid: { factorId: DEFAULT_FACTOR_ID, customFactor: null },
    locationId: DEFAULT_LOCATION_ID,
  };
}

function isCalcInput(v: unknown): v is CalcInput {
  if (!v || typeof v !== "object") return false;
  const o = v as CalcInput;
  return (
    !!o.building &&
    Array.isArray(o.months) &&
    o.months.length === 12 &&
    !!o.rooftop &&
    !!o.grid &&
    typeof o.locationId === "string"
  );
}

/** The calculation currently shown on /results. */
export const currentInputStore = createLocalStore<CalcInput | null>("cc:current", null, (raw) =>
  isCalcInput(raw) ? raw : null,
);

/** Draft of the calculator form so a refresh doesn't lose work. */
export const draftStore = createLocalStore<{ input: CalcInput; step: number } | null>("cc:draft", null, (raw) => {
  const r = raw as { input: unknown; step: unknown } | null;
  return r && isCalcInput(r.input) && typeof r.step === "number" ? (r as { input: CalcInput; step: number }) : null;
});

export const buildingsStore = createLocalStore<SavedBuilding[]>("cc:buildings", [], (raw) =>
  Array.isArray(raw) ? (raw.filter((b) => b && typeof b.id === "string" && isCalcInput(b.input)) as SavedBuilding[]) : [],
);

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function saveBuilding(
  input: CalcInput,
  radiation: (MonthlyRadiation | null)[] | null,
  radiationFetchedAt: number | null,
  existingId?: string,
): SavedBuilding {
  const now = Date.now();
  const list = buildingsStore.get();
  const existing = existingId ? list.find((b) => b.id === existingId) : undefined;
  const saved: SavedBuilding = {
    id: existing?.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    input,
    radiation,
    radiationFetchedAt,
  };
  buildingsStore.set(existing ? list.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...list]);
  return saved;
}

export function renameBuilding(id: string, name: string) {
  buildingsStore.set((list) =>
    list.map((b) =>
      b.id === id ? { ...b, updatedAt: Date.now(), input: { ...b.input, building: { ...b.input.building, name } } } : b,
    ),
  );
}

export function deleteBuilding(id: string) {
  buildingsStore.set((list) => list.filter((b) => b.id !== id));
}
