import React from "react";
import { BeeswarmGroup } from "./useShapInsights";

export interface ShapBeeswarmPlotProps {
  shapRange: number;
  beeswarmGroups: BeeswarmGroup[];
  t: (key: string) => string;
}

const colorForValue = (value: number): string => {
  const clipped = Math.min(1, Math.max(-1, value));
  const ratio = (clipped + 1) / 2;
  const red = Math.round(255 * ratio);
  const blue = Math.round(255 * (1 - ratio));
  return `rgb(${red},70,${blue})`;
};

export default function ShapBeeswarmPlot(
  props: ShapBeeswarmPlotProps,
): JSX.Element {
  const { shapRange, beeswarmGroups, t } = props;
  const normalizedRange = shapRange || 1;

  return (
    <div className="space-y-3 text-[0.75rem] text-slate-600">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-500">
          {t("shap_beeswarm_title")}
        </h4>
        <div className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
          {t("shap_beeswarm_neutral")}
        </div>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm">
        <div className="relative h-[250px] w-full rounded-[20px] bg-white px-4 py-5">
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-200" />
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-between px-4 text-[0.65rem] text-slate-400">
            <span>{t("shap_beeswarm_axis_left")}</span>
            <span>{t("shap_beeswarm_axis_right")}</span>
          </div>
          {beeswarmGroups.map((group, idx) => {
            const y = 32 + idx * 26;
            return (
              <React.Fragment key={group.feature}>
                {group.points.map((point, pointIdx) => {
                  const valueNormal = Math.min(1, Math.max(-1, point.value / normalizedRange));
                  const x = 50 + valueNormal * 45;
                  const label = point.value >= 0 ? `+${point.value.toFixed(3)}` : point.value.toFixed(3);
                  return (
                    <React.Fragment key={`${group.feature}-${pointIdx}`}>
                      <span
                        className="absolute text-[0.7rem] font-semibold text-slate-600"
                        style={{
                          left: `${x}%`,
                          top: `${y - 12}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        className="absolute text-[0.6rem] text-slate-500"
                        style={{
                          left: `${x}%`,
                          top: `${y + 12}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        {group.feature}
                      </span>
                      <span
                        className="absolute h-3.5 w-3.5 rounded-full border-2 border-white shadow"
                        style={{
                          left: `${x}%`,
                          top: `${y}px`,
                          transform: "translate(-50%, -50%)",
                          backgroundColor: colorForValue(point.value / normalizedRange),
                        }}
                        title={`${group.feature}: ${point.value.toFixed(3)}`}
                      />
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
