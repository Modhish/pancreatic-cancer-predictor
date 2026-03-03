import { useMemo } from "react";
import { AppResult } from "../hooks/useAppState";

export interface ShapItem {
  feature: string;
  value: number;
  importance: number;
  impact: "positive" | "negative";
}

export interface NormalizedShapEntry extends ShapItem {
  rawIndex: number;
  featureValue: number | null;
}

export interface WaterfallStep extends ShapItem {
  start: number;
  end: number;
}

export interface WaterfallData {
  baseline: number;
  finalValue: number;
  steps: WaterfallStep[];
  min: number;
  max: number;
}

export interface ShapMetaSummary {
  positiveCount: number;
  negativeCount: number;
  topPositive: ShapItem | null;
  topNegative: ShapItem | null;
  delta: number;
  topThree: ShapItem[];
}

export interface BeeswarmGroup {
  feature: string;
  points: NormalizedShapEntry[];
  meanAbs: number;
}

export interface UseShapInsightsResult {
  shapSummary: ShapItem[];
  shapWaterfall: WaterfallData | null;
  shapMeta: ShapMetaSummary | null;
  shapAbsSum: number;
  shapRange: number;
  shapFxDisplay: number | null;
  beeswarmGroups: BeeswarmGroup[];
  featureValueRange: { min: number; max: number };
}

const normalizeEntries = (
  result: AppResult | null,
): NormalizedShapEntry[] => {
  const raw = (result && (result.shap_values || result.shapValues)) || [];
  return raw
    .map((item, idx) => {
      const feature =
        item.feature ||
        item.name ||
        item[0] ||
        `Feature ${idx + 1}`;
      const value = Number(
        item.value ?? item.impact ?? item.shap ?? item[1] ?? 0,
      );
      const featureValue =
        typeof result?.patient_values?.[feature] === "number"
          ? Number(result.patient_values[feature])
          : null;
      const normalized: NormalizedShapEntry = {
        feature,
        value,
        importance: Math.abs(Number(item.importance ?? value)),
        impact: item.impact || (value >= 0 ? "positive" : "negative"),
        rawIndex: idx,
        featureValue,
      };
      return normalized;
    })
    .filter((entry) => Number.isFinite(entry.value));
};

const createBeeswarmGroups = (
  entries: NormalizedShapEntry[],
): BeeswarmGroup[] => {
  const map = new Map<string, NormalizedShapEntry[]>();
  entries.forEach((entry) => {
    const list = map.get(entry.feature) ?? [];
    list.push(entry);
    map.set(entry.feature, list);
  });
  return Array.from(map.entries())
    .map(([feature, points]) => {
      const sorted = points.sort((a, b) => b.value - a.value);
      const meanAbs =
        sorted.reduce((sum, point) => sum + Math.abs(point.value), 0) /
        Math.max(1, sorted.length);
      return {
        feature,
        points: sorted,
        meanAbs,
      };
    })
    .sort((a, b) => b.meanAbs - a.meanAbs);
};

export default function useShapInsights(
  result: AppResult | null,
): UseShapInsightsResult {
  const allEntries = useMemo(() => normalizeEntries(result), [result]);

  const shapSummary: ShapItem[] = useMemo(() => {
    if (!allEntries.length) return [];
    return [...allEntries]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8);
  }, [allEntries]);

  const shapBaseline = useMemo(() => {
    const candidate =
      result?.base_value ??
      result?.baseValue ??
      result?.expected_value ??
      result?.expectedValue ??
      null;
    return typeof candidate === "number" && Number.isFinite(candidate)
      ? candidate
      : null;
  }, [result]);

  const shapWaterfall: WaterfallData | null = useMemo(() => {
    if (!shapSummary.length) return null;

    const totalContribution = shapSummary.reduce(
      (sum, entry) => sum + entry.value,
      0,
    );
    let baseline = shapBaseline;

    if (baseline === null) {
      const fx =
        typeof result?.probability === "number" &&
        Number.isFinite(result.probability)
          ? result.probability
          : null;
      baseline = fx !== null ? fx - totalContribution : 0;
    }

    let running = baseline;
    const steps: WaterfallStep[] = shapSummary.map((entry) => {
      const start = running;
      const end = running + entry.value;
      running = end;
      return { ...entry, start, end };
    });

    const finalValue = running;
    const allValues = [
      baseline,
      finalValue,
      ...steps.flatMap((step) => [step.start, step.end]),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    return {
      baseline,
      finalValue,
      steps,
      min,
      max,
    };
  }, [shapSummary, shapBaseline, result]);

  const shapMeta: ShapMetaSummary | null = useMemo(() => {
    if (!shapSummary.length || !shapWaterfall) {
      return null;
    }
    const positiveDrivers = shapSummary.filter((e) => e.value > 0);
    const negativeDrivers = shapSummary.filter((e) => e.value < 0);
    const topPositive = positiveDrivers[0] || null;
    const topNegative = negativeDrivers[0] || null;
    const delta = shapWaterfall.finalValue - shapWaterfall.baseline;
    return {
      positiveCount: positiveDrivers.length,
      negativeCount: negativeDrivers.length,
      topPositive,
      topNegative,
      delta,
      topThree: shapSummary.slice(0, 3),
    };
  }, [shapSummary, shapWaterfall]);

  const shapAbsSum = useMemo(() => {
    if (!shapSummary.length) return 1;
    const s = shapSummary.reduce((sum, e) => sum + Math.abs(e.value), 0);
    return s > 0 ? s : 1;
  }, [shapSummary]);

  const shapRange = shapWaterfall
    ? Math.max(shapWaterfall.max - shapWaterfall.min, 1e-6)
    : 1;

  const shapFxDisplay =
    typeof result?.probability === "number" &&
    Number.isFinite(result.probability)
      ? result.probability
      : shapWaterfall?.finalValue ?? null;

  const beeswarmGroups = useMemo(
    () => createBeeswarmGroups(allEntries),
    [allEntries],
  );

  const featureValues = allEntries
    .map((entry) => entry.featureValue)
    .filter((v): v is number => typeof v === "number");
  const minFeatureValue = featureValues.length ? Math.min(...featureValues) : 0;
  const maxFeatureValue = featureValues.length ? Math.max(...featureValues) : 1;

  return {
    shapSummary,
    shapWaterfall,
    shapMeta,
    shapAbsSum,
    shapRange,
    shapFxDisplay,
    beeswarmGroups,
    featureValueRange: { min: minFeatureValue, max: maxFeatureValue },
  };
}
