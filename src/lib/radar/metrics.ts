/** Pure rules for Green Radar. No I/O. Thresholds are product rules, not measured accuracy. */

export const CONFIDENCE_THRESHOLD = 0.9;

export type CropCallStatus = "specific" | "group" | "uncertain" | "unclassified" | "covered";

export type CropCall = {
  status: CropCallStatus;
  label: string;
  score: number | null;
};

export function ndvi(nir: number, red: number): number | null {
  const denom = nir + red;
  if (!(denom > 0) || !Number.isFinite(nir) || !Number.isFinite(red)) return null;
  const value = (nir - red) / denom;
  return Number.isFinite(value) ? value : null;
}

/** Species name only at or above the threshold. Covered plots are never guessed. */
export function classifyObservation(input: {
  score: number | null;
  cropName: string | null;
  groupName: string | null;
  covered: boolean;
}): CropCall {
  if (input.covered) {
    return { status: "covered", label: "Greenhouse / covered", score: input.score };
  }
  if (input.score == null || !Number.isFinite(input.score)) {
    return { status: "unclassified", label: "Unclassified", score: null };
  }
  if (input.score >= CONFIDENCE_THRESHOLD && input.cropName) {
    return { status: "specific", label: input.cropName, score: input.score };
  }
  if (input.groupName) {
    return { status: "group", label: input.groupName, score: input.score };
  }
  return { status: "uncertain", label: "Uncertain", score: input.score };
}

export function vegetationPeak(
  series: { date: string; ndvi: number | null }[],
): { date: string; ndvi: number } | null {
  let best: { date: string; ndvi: number } | null = null;
  for (const row of series) {
    if (row.ndvi == null || !Number.isFinite(row.ndvi)) continue;
    if (!best || row.ndvi > best.ndvi) best = { date: row.date, ndvi: row.ndvi };
  }
  return best;
}

/** Implied tonnes per hectare from an official volume and area. Not a forecast. */
export function impliedYield(productionMt: number, areaHa: number): number | null {
  if (!(areaHa > 0) || !Number.isFinite(productionMt) || !Number.isFinite(areaHa)) return null;
  return productionMt / areaHa;
}

export function formatNdvi(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

export function formatHa(value: number): string {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value);
}

export function formatMt(value: number): string {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value);
}
