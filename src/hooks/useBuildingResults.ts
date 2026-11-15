import { useMemo } from "react";
import type { CalcInput, SavedBuilding } from "@/lib/buildings";
import { evaluateInput, pickRadiation } from "@/lib/results";
import { useArchive } from "./useSolarData";

/** Results for one building, using live Open-Meteo data with the saved snapshot as fallback. */
export function useBuildingResults(input: CalcInput, saved?: SavedBuilding | null) {
  const archive = useArchive(input.locationId);
  const live = archive.data?.data.monthly;
  const picked = useMemo(() => pickRadiation(input, live, saved?.radiation), [input, live, saved?.radiation]);
  const evaluation = useMemo(() => evaluateInput(input, picked.radiation), [input, picked.radiation]);
  const fetchedAt =
    picked.source === "live" ? (archive.data?.fetchedAt ?? null) : picked.source === "snapshot" ? (saved?.radiationFetchedAt ?? null) : null;
  return { archive, evaluation, radiation: picked.radiation, source: picked.source, fetchedAt };
}
