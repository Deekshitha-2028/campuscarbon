import { EFFICIENCY_RANGE, MONTHLY_KWH_WARNING, PR_RANGE } from "@/lib/calc";
import { blankInput, emptyMonths, type BuildingType, type CalcInput } from "@/lib/buildings";
import { CUSTOM_FACTOR_ID, getCeaFactor } from "@/lib/emissionFactors";
import { createLocalStore } from "@/lib/localStore";

export interface FormState {
  name: string;
  type: BuildingType;
  notes: string;
  locationId: string;
  months: { key: string; label: string; month: number; value: string }[];
  area: string;
  length: string;
  width: string;
  efficiencyPct: string; // e.g. "20"
  pr: string; // e.g. "0.75"
  factorId: string;
  customFactor: string;
}

export const STEPS = ["Building", "Consumption", "Rooftop", "Grid factor"] as const;

const numStr = (n: number | null | undefined) => (n === null || n === undefined || !Number.isFinite(n) ? "" : String(n));

export function toForm(input: CalcInput): FormState {
  return {
    name: input.building.name,
    type: input.building.type,
    notes: input.building.notes,
    locationId: input.locationId,
    months: input.months.map((m) => ({ key: m.key, label: m.label, month: m.month, value: numStr(m.kWh) })),
    area: input.rooftop.areaM2 > 0 ? numStr(input.rooftop.areaM2) : "",
    length: "",
    width: "",
    efficiencyPct: numStr(Math.round(input.rooftop.efficiency * 1000) / 10),
    pr: numStr(input.rooftop.performanceRatio),
    factorId: input.grid.factorId,
    customFactor: numStr(input.grid.customFactor),
  };
}

export function blankForm(): FormState {
  return toForm(blankInput());
}

/** Accept plain decimal numbers only (commas allowed as thousands separators). */
export function parseNumber(s: string): number | null {
  const t = s.replace(/,/g, "").trim();
  if (t === "") return null;
  if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

export interface StepIssues {
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export function validateStep(step: number, f: FormState): StepIssues {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  if (step === 0) {
    if (!f.name.trim()) errors.name = "Give the building a name, e.g. \"Hostel A\".";
    else if (f.name.length > 80) errors.name = "Keep the name under 80 characters.";
    if (f.notes.length > 500) errors.notes = "Notes can be up to 500 characters.";
  }
  if (step === 1) {
    let filled = 0;
    f.months.forEach((m) => {
      const n = parseNumber(m.value);
      if (n === null) return;
      if (Number.isNaN(n)) {
        errors[`m-${m.key}`] = "Numbers only (0 or more).";
        return;
      }
      filled++;
      if (n > MONTHLY_KWH_WARNING) warnings[`m-${m.key}`] = "Over 500,000 kWh in a month. Double-check the bill.";
    });
    if (filled === 0 && Object.keys(errors).length === 0) errors.months = "Enter at least one month's kWh.";
  }
  if (step === 2) {
    const a = parseNumber(f.area);
    if (a === null) errors.area = "Enter the usable rooftop area in m².";
    else if (Number.isNaN(a) || a <= 0) errors.area = "Area must be a number above 0 m².";
    else if (a > 200000) errors.area = "That's over 20 hectares. Enter one building's roof.";
    const e = parseNumber(f.efficiencyPct);
    if (e === null || Number.isNaN(e) || e < EFFICIENCY_RANGE.min * 100 || e > EFFICIENCY_RANGE.max * 100)
      errors.efficiencyPct = "Efficiency must be between 15% and 23%.";
    const p = parseNumber(f.pr);
    if (p === null || Number.isNaN(p) || p < PR_RANGE.min || p > PR_RANGE.max)
      errors.pr = "Performance ratio must be between 0.65 and 0.85.";
  }
  if (step === 3 && f.factorId === CUSTOM_FACTOR_ID) {
    const c = parseNumber(f.customFactor);
    if (c === null || Number.isNaN(c) || c <= 0 || c > 2) errors.customFactor = "Enter a factor between 0 and 2 kg CO₂/kWh.";
  }
  return { errors, warnings };
}

export function toInput(f: FormState): CalcInput {
  const n = (s: string) => {
    const v = parseNumber(s);
    return v === null || Number.isNaN(v) ? null : v;
  };
  const custom = n(f.customFactor);
  return {
    building: { name: f.name.trim(), type: f.type, notes: f.notes.trim() },
    months: f.months.map((m) => ({ key: m.key, label: m.label, month: m.month, kWh: n(m.value) })),
    rooftop: {
      areaM2: n(f.area) ?? 0,
      efficiency: (n(f.efficiencyPct) ?? 20) / 100,
      performanceRatio: n(f.pr) ?? 0.75,
    },
    grid: {
      factorId: f.factorId === CUSTOM_FACTOR_ID ? CUSTOM_FACTOR_ID : getCeaFactor(f.factorId).id,
      customFactor: f.factorId === CUSTOM_FACTOR_ID ? custom : null,
    },
    locationId: f.locationId,
  };
}

/** Make sure the month labels are the current last-12-months window, keeping values by month. */
export function refreshMonths(f: FormState): FormState {
  const fresh = emptyMonths();
  if (fresh.every((m, i) => f.months[i]?.key === m.key)) return f;
  return {
    ...f,
    months: fresh.map((m) => {
      const prev = f.months.find((p) => p.key === m.key) ?? f.months.find((p) => p.month === m.month);
      return { key: m.key, label: m.label, month: m.month, value: prev?.value ?? "" };
    }),
  };
}

export const draftStore = createLocalStore<{ form: FormState; step: number; editId: string | null } | null>(
  "cc:draft",
  null,
  (raw) => {
    const r = raw as { form?: FormState; step?: number; editId?: string | null } | null;
    if (!r || !r.form || !Array.isArray(r.form.months) || r.form.months.length !== 12) return null;
    return { form: r.form, step: typeof r.step === "number" ? r.step : 0, editId: r.editId ?? null };
  },
);
