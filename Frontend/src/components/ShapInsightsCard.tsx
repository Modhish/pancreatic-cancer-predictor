import React, { useCallback, useMemo, useState } from "react";
import { Activity, BarChart3, Brain } from "lucide-react";
import useShapInsights from "./useShapInsights";
import { AppResult } from "../hooks/useAppState";
import ShapBarPlot from "./ShapBarPlot";
import ShapWaterfallPlot from "./ShapWaterfallPlot";
import ShapLineChart from "./ShapLineChart";
import ShapBeeswarmPlot from "./ShapBeeswarmPlot";
import GraphToggleControls, {
  GraphControl,
  GraphKey,
} from "./GraphToggleControls";

export interface ShapInsightsCardProps {
  result: AppResult | null;
  t: (key: string) => string;
}

export default function ShapInsightsCard(
  props: ShapInsightsCardProps,
): JSX.Element {
  const { result, t } = props;

  const {
    shapSummary,
    shapWaterfall,
    shapRange,
    shapFxDisplay,
    beeswarmGroups,
    featureValueRange,
  } = useShapInsights(result);

  const controls: GraphControl[] = useMemo(
    () => [
      { key: "bar", label: t("graph_bar"), icon: BarChart3 },
      { key: "line", label: t("graph_line"), icon: Activity },
      { key: "beeswarm", label: t("graph_beeswarm"), icon: Activity },
      { key: "waterfall", label: t("graph_waterfall"), icon: Activity },
    ],
    [t],
  );

  const [graphVisibility, setGraphVisibility] = useState<Record<
    GraphKey,
    boolean
  >>({
    bar: true,
    line: true,
    beeswarm: true,
    waterfall: true,
  });

  const [showGraphs, setShowGraphs] = useState(true);

  const toggleGraph = useCallback(
    (key: GraphKey) => {
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

  const hasShapDetails = shapSummary.length > 0 && shapWaterfall;

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-7 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {t("model_insights_title")}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{t("shap_title")}</p>
          </div>
        </div>
        {hasShapDetails && (
          <button
            type="button"
            onClick={() => setShowGraphs((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-[0.75rem] font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition"
          >
            <Activity className="h-3.5 w-3.5" />
            {showGraphs ? t("graphs_toggle_hide") : t("graphs_toggle_show")}
          </button>
        )}
      </div>

      {!hasShapDetails && (
        <p className="text-sm text-[var(--muted)]">{t("shap_unavailable")}</p>
      )}

      {hasShapDetails && !showGraphs && (
        <p className="text-xs text-[var(--muted)]">{t("graphs_hidden_hint")}</p>
      )}

      {hasShapDetails && showGraphs && shapWaterfall && (
        <div className="space-y-5">
          <GraphToggleControls
            controls={controls}
            visibility={graphVisibility}
            onToggle={toggleGraph}
            t={t}
          />
          {graphVisibility.bar && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-sm">
              <ShapBarPlot shapSummary={shapSummary} t={t} />
            </div>
          )}
          {graphVisibility.line && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-sm">
              <ShapLineChart
                shapSummary={shapSummary}
                shapWaterfall={shapWaterfall}
                t={t}
                patientValues={
                  (result?.patient_values as Record<string, number | string>) ??
                  (result?.patientValues as Record<string, number | string>) ??
                  undefined
                }
              />
            </div>
          )}
          {graphVisibility.beeswarm && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-sm">
              <ShapBeeswarmPlot
                shapWaterfall={shapWaterfall}
                shapRange={shapRange}
                beeswarmGroups={beeswarmGroups}
                t={t}
              />
            </div>
          )}
          {graphVisibility.waterfall && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-sm">
              <ShapWaterfallPlot
                shapWaterfall={shapWaterfall}
                shapRange={shapRange}
                shapFxDisplay={shapFxDisplay}
                t={t}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
