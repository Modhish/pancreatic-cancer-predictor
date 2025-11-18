import React from "react";
import { AppResult } from "../hooks/useAppState";
import RiskSummaryCard from "./RiskSummaryCard";
import ShapInsightsCard from "./ShapInsightsCard";

export interface DiagnosticResultsSectionProps {
  result: AppResult | null;
  analysisRefreshing: boolean;
  t: (key: string) => string;
}

export default function DiagnosticResultsSection(
  props: DiagnosticResultsSectionProps,
): JSX.Element {
  const { result, analysisRefreshing, t } = props;

  return (
    <section className="space-y-6">
      <RiskSummaryCard result={result} analysisRefreshing={analysisRefreshing} t={t} />
      <ShapInsightsCard result={result} t={t} />
    </section>
  );
}
