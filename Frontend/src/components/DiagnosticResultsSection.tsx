import React, { useCallback, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Brain,
  Gauge,
  Loader2,
  ScatterChart,
} from "lucide-react";
import { AppResult } from "../hooks/useAppState";

export interface ShapItem {
  feature: string;
  value: number;
  importance: number;
  impact: "positive" | "negative";
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

export interface DiagnosticResultsSectionProps {
  result: AppResult | null;
  analysisRefreshing: boolean;
  t: (key: string) => string;
}

export default function DiagnosticResultsSection(
  props: DiagnosticResultsSectionProps,
): JSX.Element {
  const { result, analysisRefreshing, t } = props;

  const [showGraphs, setShowGraphs] = useState(true);
  const [graphVisibility, setGraphVisibility] = useState({
    waterfall: true,
    bar: true,
    beeswarm: true,
  });

  const toggleGraph = useCallback(
    (key: keyof typeof graphVisibility) => {
      setGraphVisibility((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        if (!Object.values(next).some(Boolean)) {
          return prev;
        }
        return next;
      });
    },
    [],
  );

  const graphControls = useMemo(
    () => [
      { key: "waterfall", label: t("graph_waterfall"), icon: Activity },
      { key: "bar", label: t("graph_bar"), icon: BarChart3 },
      { key: "beeswarm", label: t("graph_beeswarm"), icon: ScatterChart },
    ],
    [t],
  );

  const shapSummary: ShapItem[] = useMemo(() => {
    const raw = (result && (result.shap_values || result.shapValues)) || [];
    if (!Array.isArray(raw) || !raw.length) return [];
    return raw
      .map((item, idx) => {
        const feature =
          item.feature || item.name || item[0] || `Feature ${idx + 1}`;
        const value = Number(
          item.value ?? item.impact ?? item.shap ?? item[1] ?? 0,
        );
        return {
          feature,
          value,
          importance: Math.abs(Number(item.importance ?? value)),
          impact: item.impact || (value >= 0 ? "positive" : "negative"),
        };
      })
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8);
  }, [result]);

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

  const hasShapDetails = shapSummary.length > 0 && shapWaterfall;

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 md:p-7 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-600" />
              {t("risk_summary_title")}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{t("metrics_title")}</p>
          </div>
          {analysisRefreshing && (
            <span className="inline-flex items-center gap-1 text-[0.7rem] text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating commentary...
            </span>
          )}
        </div>

        {result ? (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[140px]">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {t("risk_score")}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-900">
                    {typeof result.probability === "number"
                      ? `${(result.probability * 100).toFixed(1)}%`
                      : t("na")}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({result.risk_level || "N/A"})
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-[160px]">
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      result.risk_level === "High"
                        ? "bg-red-500"
                        : result.risk_level === "Moderate"
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width:
                        typeof result.probability === "number"
                          ? `${Math.min(
                              100,
                              Math.max(0, result.probability * 100),
                            )}%`
                          : "30%",
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[0.65rem] text-slate-400">
                  <span>{t("result_low")}</span>
                  <span>{t("result_high")}</span>
                </div>
              </div>
            </div>

            <p className="mt-2 text-[0.75rem] text-slate-500">
              {t("model_footer")}
            </p>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 flex items-center gap-3">
            <Brain className="h-5 w-5 text-slate-400" />
            <span>{t("empty_prompt")}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 md:p-7 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              {t("model_insights_title")}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{t("shap_title")}</p>
          </div>
          {hasShapDetails && (
            <button
              type="button"
              onClick={() => setShowGraphs((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[0.75rem] font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              {showGraphs ? (
                <>
                  <Activity className="h-3.5 w-3.5" />
                  {t("graphs_toggle_hide")}
                </>
              ) : (
                <>
                  <Activity className="h-3.5 w-3.5" />
                  {t("graphs_toggle_show")}
                </>
              )}
            </button>
          )}
        </div>

        {!hasShapDetails && (
          <p className="text-sm text-slate-500">{t("shap_unavailable")}</p>
        )}

        {hasShapDetails && !showGraphs && (
          <p className="text-xs text-slate-500">{t("graphs_hidden_hint")}</p>
        )}

        {hasShapDetails && showGraphs && shapWaterfall && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-[0.75rem]">
              <span className="text-slate-500">{t("graphs_picker_label")}:</span>
              {graphControls.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleGraph(key as keyof typeof graphVisibility)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 transition ${
                    graphVisibility[key as keyof typeof graphVisibility]
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {graphVisibility.bar && (
              <div className="space-y-3">
                {shapSummary.map((entry) => {
                  const magnitude =
                    shapAbsSum > 0
                      ? (Math.abs(entry.value) / shapAbsSum) * 100
                      : 0;
                  const positive = entry.value >= 0;
                  return (
                    <div key={entry.feature}>
                      <div className="flex items-center justify-between text-[0.75rem] text-slate-600 mb-1">
                        <span className="font-medium">{entry.feature}</span>
                        <span>
                          {entry.value.toFixed(3)} {positive ? "↑" : "↓"}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${
                            positive ? "bg-red-400" : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.min(100, magnitude)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {graphVisibility.waterfall && (
              <div className="space-y-3 text-[0.75rem] text-slate-600">
                <p className="font-medium flex items-center gap-2">
                  <ScatterChart className="h-3.5 w-3.5 text-blue-500" />
                  {t("graph_waterfall")}
                </p>
                <p>
                  Baseline{" "}
                  <span className="font-semibold">
                    {shapWaterfall.baseline.toFixed(3)}
                  </span>{" "}
                  → prediction{" "}
                  <span className="font-semibold">
                    {shapFxDisplay !== null
                      ? shapFxDisplay.toFixed(3)
                      : shapWaterfall.finalValue.toFixed(3)}
                  </span>
                </p>
                <div className="relative mt-1 h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden px-4 py-2">
                  <div className="absolute inset-y-4 left-0 right-0">
                    <div className="h-0.5 w-full bg-slate-200" />
                  </div>
                  {shapWaterfall.steps.map((step, idx) => {
                    const start = Math.min(step.start, step.end);
                    const end = Math.max(step.start, step.end);
                    const startPct =
                      ((start - shapWaterfall.min) / shapRange) * 100;
                    const endPct =
                      ((end - shapWaterfall.min) / shapRange) * 100;
                    const width = Math.max(3, endPct - startPct);
                    const positive = step.end >= step.start;
                    const label = step.feature || `Feature ${idx + 1}`;
                    return (
                      <div
                        key={`${label}-${idx}`}
                        className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full shadow-sm"
                        style={{
                          left: `${startPct}%`,
                          width: `${width}%`,
                          backgroundColor: positive
                            ? "rgb(248 113 113)"
                            : "rgb(52 211 153)",
                        }}
                        title={`${label}: ${
                          positive ? "+" : "-"
                        }${Math.abs(step.end - step.start).toFixed(3)}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {hasShapDetails && shapMeta && (
              <div className="mt-4 border-t border-slate-200 pt-4 text-[0.75rem] text-slate-600 space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  {t("chart_ai_heading")}
                </p>
                <p>
                  Waterfall: the model starts from a baseline risk of{" "}
                  <span className="font-semibold">
                    {shapWaterfall?.baseline.toFixed(3) ?? t("na")}
                  </span>{" "}
                  and is adjusted by{" "}
                  <span className="font-semibold">
                    {shapMeta.delta >= 0 ? "+" : "-"}
                    {Math.abs(shapMeta.delta).toFixed(3)}
                  </span>{" "}
                  to reach a final risk estimate of{" "}
                  <span className="font-semibold">
                    {shapWaterfall?.finalValue.toFixed(3) ?? t("na")}
                  </span>
                  . The strongest upward driver is{" "}
                  <span className="font-semibold">
                    {shapMeta.topPositive?.feature ?? t("na")}
                  </span>
                  , while{" "}
                  <span className="font-semibold">
                    {shapMeta.topNegative?.feature ?? t("na")}
                  </span>{" "}
                  provides the main protective effect.
                </p>
                <p>
                  Bar plot: the longest bars correspond to the dominant
                  contributors to the model&apos;s risk signal. In this example,{" "}
                  <span className="font-semibold">
                    {shapSummary[0]?.feature ?? t("na")}
                  </span>
                  {shapSummary[1] && (
                    <>
                      {", "}
                      <span className="font-semibold">
                        {shapSummary[1].feature}
                      </span>
                    </>
                  )}
                  {shapSummary[2] && (
                    <>
                      {" and "}
                      <span className="font-semibold">
                        {shapSummary[2].feature}
                      </span>
                    </>
                  )}{" "}
                  account for most of the deviation away from a neutral
                  reference profile.
                </p>
                <p>
                  Beeswarm: each dot represents how a single laboratory value
                  shifts this patient&apos;s risk compared with a typical case.
                  Dots to the right of center increase the pancreatic cancer
                  probability; dots to the left have a protective effect. The
                  clustering around{" "}
                  <span className="font-semibold">
                    {shapSummary[0]?.feature ?? t("na")}
                  </span>{" "}
                  and related markers shows which parameters are acting as the
                  primary levers in the current screening signal.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

