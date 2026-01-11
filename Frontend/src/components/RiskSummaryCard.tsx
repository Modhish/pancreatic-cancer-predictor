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
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-7 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
            <Gauge className="h-5 w-5 text-[var(--accent)]" />
            {t("risk_summary_title")}
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{t("metrics_title")}</p>
        </div>
        {analysisRefreshing && (
          <span className="inline-flex items-center gap-1 text-[0.7rem] text-[var(--muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating commentary...
          </span>
        )}
      </div>

      {result ? (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {t("risk_score")}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-[var(--text)]">
                  {typeof result.probability === "number"
                    ? `${(result.probability * 100).toFixed(1)}%`
                    : t("na")}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  ({result.risk_level || "N/A"})
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-[160px]">
              <div className="w-full h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
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
              <div className="mt-1 flex justify-between text-[0.65rem] text-[var(--muted)]">
                <span>{t("result_low")}</span>
                <span>{t("result_high")}</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-[0.75rem] text-[var(--muted)]">
            {t("model_footer")}
          </p>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-4 py-6 text-sm text-[var(--muted)] flex items-center gap-3">
          <Brain className="h-5 w-5 text-[var(--muted)]" />
          <span>{t("empty_prompt")}</span>
        </div>
      )}
    </div>
  );
}
