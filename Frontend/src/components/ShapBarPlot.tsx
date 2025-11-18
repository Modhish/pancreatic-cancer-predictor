import React from "react";

import { ShapItem } from "./useShapInsights";

export interface ShapBarPlotProps {
  shapSummary: ShapItem[];
}

const POS_COLOR = "#f14668";
const NEG_COLOR = "#1d7dff";

export default function ShapBarPlot(
  props: ShapBarPlotProps,
): JSX.Element {
  const { shapSummary } = props;

  const rows = [...shapSummary]
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 8);

  const maxValue = Math.max(...rows.map((entry) => Math.abs(entry.value)), 0.001);
  const minFillPercent = 25;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-600">
        <svg
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          className="text-blue-500"
        >
          <path
            d="M5 9h3v11H5V9Zm11 0h3v11h-3V9Zm-6-4h3v15h-3V5Z"
            fill="currentColor"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Feature Contribution Bar Plot
          </p>
          <p className="text-xs text-slate-500">
            Relative SHAP contribution across top features.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((entry) => {
          const normalized = Math.abs(entry.value) / maxValue;
          const width =
            Math.min(100, minFillPercent + normalized * (100 - minFillPercent));
          const positive = entry.value >= 0;
          const formatted = `${positive ? "+" : ""}${entry.value.toFixed(3)}`;
          return (
            <div key={entry.feature} className="space-y-1 w-full">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600">
                <span>{entry.feature}</span>
                <span className={positive ? "text-rose-500" : "text-blue-500"}>
                  {formatted}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-full w-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, width)}%`,
                    backgroundColor: positive ? POS_COLOR : NEG_COLOR,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
