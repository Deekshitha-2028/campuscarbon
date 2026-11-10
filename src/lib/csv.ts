import type { MonthlyResult, Totals } from "./calc";
import { factorCitation, type ResolvedFactor } from "./emissionFactors";

function cell(v: string | number | null): string {
  if (v === null) return "";
  const s = typeof v === "number" ? (Number.isFinite(v) ? String(Math.round(v * 1000) / 1000) : "") : v;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function resultsCsv(opts: {
  buildingName: string;
  locationName: string;
  areaM2: number;
  efficiency: number;
  performanceRatio: number;
  factor: ResolvedFactor;
  monthly: MonthlyResult[];
  totals: Totals;
}): string {
  const { monthly, totals } = opts;
  const lines: (string | number | null)[][] = [
    ["CampusCarbon: Tumakuru results"],
    ["Building", opts.buildingName],
    ["Location", opts.locationName],
    ["Usable rooftop area (m²)", opts.areaM2],
    ["Panel efficiency", opts.efficiency],
    ["Performance ratio", opts.performanceRatio],
    [factorCitation(opts.factor)],
    ["Estimates for education. Not an engineering or financial design."],
    [],
    [
      "Month",
      "Consumption (kWh)",
      "Consumption missing",
      "Radiation H (kWh/m²)",
      "Solar generation (kWh)",
      "CO₂ without solar (kg)",
      "CO₂ avoided (kg)",
      "Net grid (kWh)",
      "Net CO₂ (kg)",
      "Offset (%)",
    ],
    ...monthly.map((r) => [
      r.label,
      r.consumptionKWh,
      r.consumptionMissing ? "yes" : "no",
      r.radiationKWhM2,
      r.solarKWh,
      r.co2Kg,
      r.co2AvoidedKg,
      r.netGridKWh,
      r.netCo2Kg,
      r.offsetPct,
    ]),
    [
      "Total",
      totals.consumptionKWh,
      String(totals.missingMonths),
      totals.radiationKWhM2,
      totals.solarKWh,
      totals.co2Kg,
      totals.co2AvoidedKg,
      totals.netGridKWh,
      totals.netCo2Kg,
      totals.offsetPct,
    ],
    [],
    ["Installed capacity (kWp)", totals.kWp],
    ["Area for 100% offset (m²)", totals.areaFor100],
    ["Trees equivalent of CO₂ avoided (approx., 21 kg/tree/yr)", totals.trees],
  ];
  return lines.map((l) => l.map(cell).join(",")).join("\n");
}

export function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF" + text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "building"
  );
}

/** Print in the light theme regardless of the current theme. */
export function printLight() {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  if (wasDark) root.classList.remove("dark");
  const restore = () => {
    if (wasDark) root.classList.add("dark");
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
