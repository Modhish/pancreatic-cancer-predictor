import React from "react";
import { Brain, Gauge, Loader2 } from "lucide-react";
import { AppResult } from "../hooks/useAppState";

export interface RiskSummaryCardProps {
  result: AppResult | null;
  analysisRefreshing: boolean;
  t: (key: string) => string;
}

export default function RiskSummaryCard(
  props: RiskSummaryCardProps,
): JSX.Element {
  const { result, analysisRefreshing, t } = props;

  return (
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
  );
}
