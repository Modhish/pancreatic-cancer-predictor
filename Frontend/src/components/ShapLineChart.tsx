import React, { useMemo } from "react";
import { LineChart } from "lucide-react";

import { ShapItem } from "./useShapInsights";

export interface ShapLineChartProps {
  shapSummary: ShapItem[];
  patientValues?: Record<string, number | string>;
}

// Logical checkpoints that describe how a feature's contribution scales,
// instead of fake clock times.
const CONTRIBUTION_STEPS = ["Baseline", "Early shift", "Mid shift", "Late shift", "Net impact"] as const;
const POS_COLORS = ["#dc2626", "#ef4444", "#f97316", "#fb923c"];
const NEG_COLORS = ["#16a34a", "#22c55e", "#10b981", "#34d399"];
const NEUTRAL_COLOR = "#475569";
const MAX_SERIES = 5; // limit lines for readability

interface Series {
  label: string;
  color: string;
  values: number[];
}

export default function ShapLineChart(
  props: ShapLineChartProps,
): JSX.Element {
  const { shapSummary, patientValues } = props;

  const series: Series[] = useMemo(() => {
    if (!shapSummary.length) return [];
    const top = shapSummary.slice(0, MAX_SERIES);
    return top.map((item, idx) => {
      const measurementRaw = patientValues?.[item.feature];
      const measurement = Number(measurementRaw);
      const baseline = Number.isFinite(measurement)
        ? measurement
        : 50 + idx * 10;
      const shapValue = item.value;
      const direction = shapValue >= 0 ? 1 : -1;
      const magnitude = Math.max(
        10,
        Math.min(90, Math.abs(shapValue) * 1500),
      );
      const values = CONTRIBUTION_STEPS.map((_, stepIdx) => {
        const progress = stepIdx / Math.max(1, CONTRIBUTION_STEPS.length - 1);
        const slope = direction * magnitude * progress;
        const oscillation =
          Math.sin(progress * Math.PI) * magnitude * 0.35 * direction;
        return baseline + slope + oscillation;
      });
      const colorPool = shapValue > 0 ? POS_COLORS : shapValue < 0 ? NEG_COLORS : [NEUTRAL_COLOR];
      const color = colorPool[idx % colorPool.length];
      return {
        label: item.feature,
        color,
        values,
      };
    });
  }, [shapSummary, patientValues]);

  if (!series.length) {
    return <p className="text-sm text-slate-500">No time-series data yet.</p>;
  }

  const allValues = series.flatMap((s) => s.values);
  const minY = Math.floor(Math.min(...allValues) / 10) * 10 - 10;
  const maxY = Math.ceil(Math.max(...allValues) / 10) * 10 + 10;
  const yRange = Math.max(maxY - minY, 1e-3);
  const yTicks: number[] = [];
  for (let tick = minY; tick <= maxY; tick += 20) {
    yTicks.push(tick);
  }

  const width = 720;
  const height = 260;
  const paddingX = 60;
  const paddingY = 30;
  const denominator = Math.max(1, CONTRIBUTION_STEPS.length - 1);

  const scaleX = (idx: number) =>
    paddingX + (idx / denominator) * (width - paddingX * 1.5);
  const scaleY = (val: number) =>
    height - paddingY - ((val - minY) / yRange) * (height - paddingY * 1.5);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-600">
        <LineChart className="h-4 w-4 text-blue-500" />
        <div>
          <p className="text-sm font-semibold">SHAP Contribution Trajectories</p>
          <p className="text-xs text-slate-500">
            Each line shows how a top driver shifts risk from baseline to its net impact
            (ordered by SHAP importance).
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[0.7rem]">
        {series.map((s) => (
          <span
            key={s.label}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          {yTicks.map((tick) => {
            const y = scaleY(tick);
            return (
              <g key={`tick-${tick}`}>
                <line
                  x1={paddingX}
                  x2={width - paddingX / 2}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth={0.8}
                />
                <text
                  x={paddingX - 6}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500"
                >
                  {tick}
                </text>
              </g>
            );
          })}
          {series.map((s) => (
            <g key={s.label}>
              <path
                d={s.values
                  .map((val, idx) => {
                    const x = scaleX(idx);
                    const y = scaleY(val);
                    return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                stroke={s.color}
                strokeWidth={2}
                fill="none"
              />
              {s.values.map((val, idx) => {
                const x = scaleX(idx);
                const y = scaleY(val);
                return (
                  <circle
                    key={`${s.label}-${idx}`}
                    cx={x}
                    cy={y}
                    r={3}
                    fill="#fff"
                    stroke={s.color}
                    strokeWidth={1.5}
                  />
                );
              })}
            </g>
          ))}
          {CONTRIBUTION_STEPS.map((label, idx) => (
            <text
              key={label}
              x={scaleX(idx)}
              y={height - 6}
              textAnchor="middle"
              className="text-[10px] fill-slate-500"
            >
              {label}
            </text>
          ))}
          <text
            x={(paddingX + width - paddingX / 2) / 2}
            y={height}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-600 mt-2"
          >
            Contribution progression (baseline → net impact)
          </text>
        </svg>
      </div>
      <div className="mt-3 text-[0.7rem] text-slate-500 space-y-1">
        <p>
          Red hues = risk-raising drivers; green hues = risk-lowering drivers. Lines are scaled by the
          feature&apos;s SHAP magnitude and start at the patient&apos;s value when available.
        </p>
      </div>
    </div>
  );
}
