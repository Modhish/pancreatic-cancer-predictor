import React, { useCallback, useMemo, useState } from "react";
import { Activity, BarChart3, Brain, MessageCircle } from "lucide-react";
import useShapInsights from "../hooks/useShapInsights";
import { AppResult } from "../hooks/useAppState";
import ShapBarPlot from "./ShapBarPlot";
import ShapWaterfallPlot from "./ShapWaterfallPlot";
import ShapLineChart from "./ShapLineChart";
import ShapBeeswarmPlot from "./ShapBeeswarmPlot";
import GraphToggleControls, {
  GraphControl,
  GraphKey,
} from "./GraphToggleControls";
import { formatShapFeatureLabel } from "../utils/featureLabels";

export interface ShapInsightsCardProps {
  result: AppResult | null;
  t: (key: string) => string;
}

type ChartKey = "bar" | "line" | "beeswarm" | "waterfall";

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

  const toggleGraph = useCallback((key: GraphKey) => {
    setGraphVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) {
        return prev;
      }
      return next;
    });
  }, []);

  const hasShapDetails = shapSummary.length > 0 && shapWaterfall;
  const chartExplanations =
    result?.shap_chart_explanations ?? result?.shapChartExplanations ?? {};

  const fallbackExplanation = useCallback(
    (key: ChartKey) => {
      const topFeature = shapSummary[0]
        ? formatShapFeatureLabel(
            shapSummary[0].feature,
            t,
            shapSummary[0].featureKey,
          )
        : "the strongest feature";
      const positiveCount = shapSummary.filter((item) => item.value > 0).length;
      const negativeCount = shapSummary.filter((item) => item.value < 0).length;
      const probability =
        typeof result?.probability === "number"
          ? `${(result.probability * 100).toFixed(1)}%`
          : "the final model probability";
      const isRussian = t("shap_diagram_explanation")
        .toLowerCase()
        .includes("пояс");

      if (isRussian) {
        if (key === "bar") {
          return `Эта диаграмма ранжирует все признаки SHAP по размеру вклада. Самый заметный фактор: ${topFeature}; цвет разделяет повышение и снижение модельной оценки риска.`;
        }
        if (key === "line") {
          return `Этот график показывает, как ведущие факторы смещают оценку от базового уровня к ${probability}. Он помогает читать результат как последовательное накопление сигнала риска.`;
        }
        if (key === "beeswarm") {
          return `Это распределение размещает каждый признак относительно нейтральной оси: ${positiveCount} признаков смещают оценку вверх, ${negativeCount} смещают ее вниз.`;
        }
        return `Waterfall-график объясняет арифметику модели от базового уровня к итоговой оценке. Самое большое смещение связано с ${topFeature}; это объяснение расчета модели, а не медицинское заключение.`;
      }

      if (key === "bar") {
        return `This chart ranks all available SHAP features by contribution size. ${topFeature} is the largest visible driver, while color separates upward and downward influence.`;
      }
      if (key === "line") {
        return `This chart shows how the strongest drivers move the estimate from baseline toward ${probability}. It is useful for reading the result as a sequence, not as separate isolated markers.`;
      }
      if (key === "beeswarm") {
        return `This spread places every feature against the neutral axis: ${positiveCount} features push upward and ${negativeCount} push downward in this assessment.`;
      }
      return `This waterfall explains the arithmetic of the model output from baseline to final estimate. The largest movement starts with ${topFeature}, but it remains a model explanation rather than a medical conclusion.`;
    },
    [result?.probability, shapSummary, t],
  );

  const explanationFor = useCallback(
    (key: ChartKey) => chartExplanations[key] || fallbackExplanation(key),
    [chartExplanations, fallbackExplanation],
  );

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-7 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {t("model_insights_title")}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {t("shap_title")}
            </p>
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
            <ShapChartPanel explanation={explanationFor("bar")} t={t}>
              <ShapBarPlot shapSummary={shapSummary} t={t} />
            </ShapChartPanel>
          )}
          {graphVisibility.line && (
            <ShapChartPanel explanation={explanationFor("line")} t={t}>
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
            </ShapChartPanel>
          )}
          {graphVisibility.beeswarm && (
            <ShapChartPanel explanation={explanationFor("beeswarm")} t={t}>
              <ShapBeeswarmPlot
                shapWaterfall={shapWaterfall}
                shapRange={shapRange}
                beeswarmGroups={beeswarmGroups}
                t={t}
              />
            </ShapChartPanel>
          )}
          {graphVisibility.waterfall && (
            <ShapChartPanel explanation={explanationFor("waterfall")} t={t}>
              <ShapWaterfallPlot
                shapWaterfall={shapWaterfall}
                shapRange={shapRange}
                shapFxDisplay={shapFxDisplay}
                t={t}
              />
            </ShapChartPanel>
          )}
        </div>
      )}
    </div>
  );
}

function ShapChartPanel({
  children,
  explanation,
  t,
}: {
  children: React.ReactNode;
  explanation: string;
  t: (key: string) => string;
}): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] shadow-sm">
      <div className="p-4 sm:p-5">{children}</div>
      <div className="border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] px-4 py-4 sm:px-5">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {t("shap_diagram_explanation")}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--text)]">
              {explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
