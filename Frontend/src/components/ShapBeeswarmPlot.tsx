import React from "react";
import { BeeswarmGroup } from "../hooks/useShapInsights";
import { formatShapFeatureLabel } from "../utils/featureLabels";

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
  const rows = beeswarmGroups.slice(0, 18);

  return (
    <div className="space-y-3 text-[0.75rem] text-[var(--muted)]">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--text)]">
          {t("shap_beeswarm_title")}
        </h4>
        <div className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--muted)]">
          {t("shap_beeswarm_neutral")}
        </div>
      </div>
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="grid grid-cols-[minmax(130px,0.38fr)_minmax(230px,1fr)] gap-4">
          <div />
          <div className="relative flex items-center justify-between border-b border-[var(--border)] pb-2 text-[0.65rem] text-[var(--muted)]">
            <span>{t("shap_beeswarm_axis_left")}</span>
            <span>{t("shap_beeswarm_neutral")}</span>
            <span>{t("shap_beeswarm_axis_right")}</span>
          </div>

          {rows.map((group) => {
            const groupLabel = formatShapFeatureLabel(
              group.feature,
              t,
              group.featureKey,
            );
            return (
              <React.Fragment key={group.feature}>
                <div className="min-w-0 self-center truncate text-right text-[0.72rem] font-semibold text-[var(--muted)]" title={groupLabel}>
                  {groupLabel}
                </div>
                <div className="relative h-8 rounded-full bg-[color-mix(in_srgb,var(--surface-2)_76%,transparent)]">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--border)]" />
                {group.points.map((point, pointIdx) => {
                  const valueNormal = Math.min(
                    1,
                    Math.max(-1, point.value / normalizedRange),
                  );
                  const x = 50 + valueNormal * 46;
                  const label = point.value >= 0 ? `+${point.value.toFixed(3)}` : point.value.toFixed(3);
                  return (
                    <React.Fragment key={`${group.feature}-${pointIdx}`}>
                      <span
                        className="absolute top-1/2 z-10 h-3.5 w-3.5 rounded-full border-2 border-[var(--surface)] shadow"
                        style={{
                          left: `${x}%`,
                          transform: "translate(-50%, -50%)",
                          backgroundColor: colorForValue(point.value / normalizedRange),
                        }}
                        title={`${groupLabel}: ${label}`}
                      />
                      <span
                        className={`absolute top-1/2 text-[0.68rem] font-semibold ${
                          point.value >= 0 ? "text-rose-500" : "text-blue-500"
                        }`}
                        style={{
                          left: `${x}%`,
                          transform:
                            x > 83
                              ? "translate(calc(-100% - 10px), -50%)"
                              : "translate(10px, -50%)",
                        }}
                      >
                        {label}
                      </span>
                    </React.Fragment>
                  );
                })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
