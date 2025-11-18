import React from "react";
import { ShapMetaSummary } from "./useShapInsights";

export interface ShapNarrativeCardProps {
  shapMeta: ShapMetaSummary | null;
}

export default function ShapNarrativeCard(
  props: ShapNarrativeCardProps,
): JSX.Element {
  const { shapMeta } = props;

  const topThreeTitles = shapMeta?.topThree
    .map((item) => item.feature)
    .filter(Boolean)
    .join(", ");
  const positiveDriver =
    shapMeta?.topPositive &&
    `${shapMeta.topPositive.feature} (${shapMeta.topPositive.value.toFixed(3)})`;
  const protectiveDriver =
    shapMeta?.topNegative &&
    `${shapMeta.topNegative.feature} (${shapMeta.topNegative.value.toFixed(3)})`;

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[0.8rem] text-slate-600">
      <p className="text-sm font-semibold text-slate-500">Text plot overview</p>
      {shapMeta ? (
        <>
          <p>
            {(topThreeTitles || "Top features")} explain{" "}
            <span className="font-semibold">
              {(Math.abs(shapMeta.delta) * 100).toFixed(1)}%
            </span>{" "}
            of the deviation from baseline.
          </p>
          <p>
            Top driver:{" "}
            <span className="font-semibold">
              {positiveDriver ?? "N/A"}
            </span>
            , protecting driver:{" "}
            <span className="font-semibold">
              {protectiveDriver ?? "N/A"}
            </span>
            .
          </p>
          <p>
            Positive contributions: {shapMeta.positiveCount}, negative:{" "}
            {shapMeta.negativeCount}.
          </p>
        </>
      ) : (
        <p>No SHAP narrative available yet.</p>
      )}
    </div>
  );
}
