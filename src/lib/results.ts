import { alignRadiation, computeResults, type MonthlyRadiation } from "./calc";
import type { CalcInput } from "./buildings";
import { resolveFactor } from "./emissionFactors";

/** Run the full calculation for one building input with aligned monthly radiation. */
export function evaluateInput(input: CalcInput, radiation: (MonthlyRadiation | null)[] | null) {
  const factor = resolveFactor(input.grid);
  const r = computeResults(
    {
      months: input.months,
      areaM2: input.rooftop.areaM2,
      efficiency: input.rooftop.efficiency,
      performanceRatio: input.rooftop.performanceRatio,
      factor: factor.value,
    },
    radiation,
  );
  return { ...r, factor };
}

export type Evaluation = ReturnType<typeof evaluateInput>;

/**
 * Choose radiation for a building: live archive data when available, otherwise the
 * snapshot saved with the building, otherwise none.
 */
export function pickRadiation(
  input: CalcInput,
  live: MonthlyRadiation[] | null | undefined,
  snapshot: (MonthlyRadiation | null)[] | null | undefined,
): { radiation: (MonthlyRadiation | null)[] | null; source: "live" | "snapshot" | "none" } {
  if (live && live.length) return { radiation: alignRadiation(input.months, live), source: "live" };
  if (snapshot && snapshot.some(Boolean)) return { radiation: snapshot, source: "snapshot" };
  return { radiation: null, source: "none" };
}
