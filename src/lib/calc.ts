/**
 * Pure, typed calculation functions for CampusCarbon.
 * Every function returns a finite number (never NaN or Infinity).
 */

export const MJ_PER_KWH = 3.6;
export const KG_CO2_PER_TREE_PER_YEAR = 21; // approximation
export const STC_IRRADIANCE_KW_PER_M2 = 1; // 1 kW/m² standard test conditions

export const DEFAULT_EFFICIENCY = 0.2;
export const DEFAULT_PR = 0.75;
export const EFFICIENCY_RANGE = { min: 0.15, max: 0.23 } as const;
export const PR_RANGE = { min: 0.65, max: 0.85 } as const;
export const MONTHLY_KWH_WARNING = 500_000;

/** Coerce anything to a finite, non-negative number (0 when invalid). */
export function safe(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : 0;
}

/** Scope 2 location-based footprint: CO₂ (kg) = kWh × grid factor (kg CO₂/kWh). */
export function kWhToCO2(kWh: number, factorKgPerKWh: number): number {
  return safe(kWh) * safe(factorKgPerKWh);
}

/** Open-Meteo shortwave_radiation_sum is MJ/m²; 1 kWh = 3.6 MJ. */
export function mjToKWh(mj: number): number {
  return safe(mj) / MJ_PER_KWH;
}

/** Solar generation: E (kWh) = H (kWh/m²) × A (m²) × η × PR. */
export function solarEnergy(
  H_kWhPerM2: number,
  areaM2: number,
  efficiency: number,
  performanceRatio: number,
): number {
  return safe(H_kWhPerM2) * safe(areaM2) * safe(efficiency) * safe(performanceRatio);
}

/** Offset share (%) = min(100, solar ÷ consumption × 100). Zero consumption with any solar = 100. */
export function offsetShare(solarKWh: number, consumptionKWh: number): number {
  const s = safe(solarKWh);
  const c = safe(consumptionKWh);
  if (c === 0) return s > 0 ? 100 : 0;
  return Math.min(100, (s / c) * 100);
}

/** CO₂ avoided = solar kWh × grid factor. */
export function co2Avoided(solarKWh: number, factorKgPerKWh: number): number {
  return kWhToCO2(solarKWh, factorKgPerKWh);
}

/** Grid kWh still bought after solar (never negative; no export modelled). */
export function netGridKWh(consumptionKWh: number, solarKWh: number): number {
  return Math.max(0, safe(consumptionKWh) - safe(solarKWh));
}

/** Approximate number of trees needed to absorb this much CO₂ in a year. */
export function treesEquivalent(kgCO2: number): number {
  return safe(kgCO2) / KG_CO2_PER_TREE_PER_YEAR;
}

/** Installed capacity (kWp) = area × η × 1 kW/m². */
export function installedCapacityKWp(areaM2: number, efficiency: number): number {
  return safe(areaM2) * safe(efficiency) * STC_IRRADIANCE_KW_PER_M2;
}

/** Rooftop area (m²) needed so annual solar equals annual consumption. */
export function areaFor100Offset(
  annualConsumptionKWh: number,
  annualH_kWhPerM2: number,
  efficiency: number,
  performanceRatio: number,
): number {
  const perM2 = solarEnergy(annualH_kWhPerM2, 1, efficiency, performanceRatio);
  if (perM2 === 0) return 0;
  return safe(annualConsumptionKWh) / perM2;
}

/* ------------------------------------------------------------------ */
/* Monthly aggregation of daily Open-Meteo data                        */
/* ------------------------------------------------------------------ */

export interface DailyWeather {
  date: string; // YYYY-MM-DD
  radiationMJ: number | null; // MJ/m²/day
  sunshineSeconds: number | null;
  cloudCoverMean: number | null; // %
  temperatureMean: number | null; // °C
}

export interface MonthlyRadiation {
  key: string; // YYYY-MM
  year: number;
  month: number; // 1-12
  label: string; // e.g. "Nov 2025"
  daysWithData: number;
  daysInMonth: number;
  radiationKWhM2: number; // monthly total kWh/m²
  peakSunHours: number; // average kWh/m²/day (= peak sun hours)
  cloudCoverMean: number | null;
  temperatureMean: number | null;
  sunshineHoursPerDay: number | null;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(year: number, month: number): string {
  return `${MONTH_SHORT[month - 1]} ${year}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Aggregate daily values into monthly totals.
 * If some days are missing, the monthly total is scaled from the mean of available days
 * so a partial month is not under-counted.
 */
export function aggregateMonthly(daily: DailyWeather[]): MonthlyRadiation[] {
  const groups = new Map<string, DailyWeather[]>();
  for (const d of daily) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) continue;
    const key = d.date.slice(0, 7);
    const arr = groups.get(key);
    if (arr) arr.push(d);
    else groups.set(key, [d]);
  }
  const out: MonthlyRadiation[] = [];
  for (const [key, days] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const year = Number(key.slice(0, 4));
    const month = Number(key.slice(5, 7));
    const dim = daysInMonth(year, month);
    const rad = days.map((d) => d.radiationMJ).filter(isNum).map((mj) => mjToKWh(mj));
    const avgDaily = mean(rad) ?? 0;
    const sunshine = days.map((d) => d.sunshineSeconds).filter(isNum).map((s) => s / 3600);
    out.push({
      key,
      year,
      month,
      label: monthLabel(year, month),
      daysWithData: rad.length,
      daysInMonth: dim,
      radiationKWhM2: avgDaily * dim,
      peakSunHours: avgDaily,
      cloudCoverMean: mean(days.map((d) => d.cloudCoverMean).filter(isNum)),
      temperatureMean: mean(days.map((d) => d.temperatureMean).filter(isNum)),
      sunshineHoursPerDay: mean(sunshine),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Month windows                                                       */
/* ------------------------------------------------------------------ */

export interface MonthSlot {
  key: string;
  year: number;
  month: number;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * The last 12 complete months, given "today". The archive lags a few days, so the
 * reference point is today − lagDays; the month containing it is excluded unless it
 * has fully ended.
 */
export function last12CompleteMonths(today: Date, lagDays = 7): {
  months: MonthSlot[];
  startDate: string;
  endDate: string;
} {
  const ref = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  ref.setUTCDate(ref.getUTCDate() - lagDays);
  let y = ref.getUTCFullYear();
  let m = ref.getUTCMonth() + 1; // 1-12
  const isLastDay = ref.getUTCDate() === daysInMonth(y, m);
  if (!isLastDay) {
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  const months: MonthSlot[] = [];
  for (let i = 11; i >= 0; i--) {
    let mm = m - i;
    let yy = y;
    while (mm <= 0) {
      mm += 12;
      yy -= 1;
    }
    months.push({ key: `${yy}-${pad(mm)}`, year: yy, month: mm, label: monthLabel(yy, mm) });
  }
  const first = months[0];
  const last = months[11];
  return {
    months,
    startDate: `${first.year}-${pad(first.month)}-01`,
    endDate: isoDate(new Date(Date.UTC(last.year, last.month - 1, daysInMonth(last.year, last.month)))),
  };
}

/**
 * Find radiation for each month slot: exact YYYY-MM match first, otherwise the same
 * calendar month from the available record (useful for older saved inputs).
 */
export function alignRadiation(
  slots: { key: string; month: number }[],
  radiation: MonthlyRadiation[],
): (MonthlyRadiation | null)[] {
  return slots.map((s) => {
    const exact = radiation.find((r) => r.key === s.key);
    if (exact) return exact;
    const same = radiation.filter((r) => r.month === s.month);
    return same.length ? same[same.length - 1] : null;
  });
}

/* ------------------------------------------------------------------ */
/* Full results                                                        */
/* ------------------------------------------------------------------ */

export interface ResultInputs {
  months: { key: string; label: string; month: number; kWh: number | null }[];
  areaM2: number;
  efficiency: number;
  performanceRatio: number;
  factor: number;
}

export interface MonthlyResult {
  key: string;
  label: string;
  consumptionKWh: number;
  consumptionMissing: boolean;
  radiationKWhM2: number | null;
  solarKWh: number | null;
  co2Kg: number;
  co2AvoidedKg: number | null;
  netGridKWh: number;
  netCo2Kg: number;
  offsetPct: number | null;
}

export interface Totals {
  consumptionKWh: number;
  co2Kg: number;
  solarKWh: number;
  radiationKWhM2: number;
  offsetPct: number;
  co2AvoidedKg: number;
  netGridKWh: number;
  netCo2Kg: number;
  trees: number;
  kWp: number;
  areaFor100: number;
  missingMonths: number;
  monthsWithoutRadiation: number;
  hasSolar: boolean;
}

export function computeResults(
  input: ResultInputs,
  radiation: (MonthlyRadiation | null)[] | null,
): { monthly: MonthlyResult[]; totals: Totals } {
  const monthly: MonthlyResult[] = input.months.map((m, i) => {
    const rad = radiation?.[i] ?? null;
    const consumption = safe(m.kWh ?? 0);
    const H = rad ? rad.radiationKWhM2 : null;
    const solar = H === null ? null : solarEnergy(H, input.areaM2, input.efficiency, input.performanceRatio);
    const co2 = kWhToCO2(consumption, input.factor);
    const net = netGridKWh(consumption, solar ?? 0);
    return {
      key: m.key,
      label: m.label,
      consumptionKWh: consumption,
      consumptionMissing: m.kWh === null || !Number.isFinite(m.kWh),
      radiationKWhM2: H,
      solarKWh: solar,
      co2Kg: co2,
      co2AvoidedKg: solar === null ? null : co2Avoided(Math.min(solar, consumption), input.factor),
      netGridKWh: net,
      netCo2Kg: kWhToCO2(net, input.factor),
      offsetPct: solar === null ? null : offsetShare(solar, consumption),
    };
  });

  const sum = (f: (r: MonthlyResult) => number) => monthly.reduce((a, r) => a + f(r), 0);
  const consumptionKWh = sum((r) => r.consumptionKWh);
  const solarKWh = sum((r) => r.solarKWh ?? 0);
  const radiationKWhM2 = sum((r) => r.radiationKWhM2 ?? 0);
  const netGrid = sum((r) => r.netGridKWh);
  const co2AvoidedKg = co2Avoided(solarKWh, input.factor);

  return {
    monthly,
    totals: {
      consumptionKWh,
      co2Kg: kWhToCO2(consumptionKWh, input.factor),
      solarKWh,
      radiationKWhM2,
      offsetPct: offsetShare(solarKWh, consumptionKWh),
      co2AvoidedKg,
      netGridKWh: netGrid,
      netCo2Kg: kWhToCO2(netGrid, input.factor),
      trees: treesEquivalent(co2AvoidedKg),
      kWp: installedCapacityKWp(input.areaM2, input.efficiency),
      areaFor100: areaFor100Offset(consumptionKWh, radiationKWhM2, input.efficiency, input.performanceRatio),
      missingMonths: monthly.filter((r) => r.consumptionMissing).length,
      monthsWithoutRadiation: monthly.filter((r) => r.radiationKWhM2 === null).length,
      hasSolar: monthly.some((r) => r.solarKWh !== null),
    },
  };
}
