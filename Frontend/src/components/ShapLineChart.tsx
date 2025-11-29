import React, { useMemo } from "react";
import { LineChart } from "lucide-react";

import { ShapItem, WaterfallData } from "./useShapInsights";

export interface ShapLineChartProps {
  shapSummary: ShapItem[];
  shapWaterfall: WaterfallData | null;
  patientValues?: Record<string, number | string>;
}

const POS_COLOR = "#e11d48";
const NEG_COLOR = "#0ea5e9";
const NEUTRAL_COLOR = "#475569";
const MAX_STEPS = 6;

interface Point {
  label: string;
  y: number;
  contribution: number;
  featureValue?: number | string;
  direction: "positive" | "negative" | "neutral";
}

export default function ShapLineChart(
  props: ShapLineChartProps,
): JSX.Element {
  const { shapSummary, shapWaterfall, patientValues } = props;

  const points: Point[] = useMemo(() => {
    if (!shapWaterfall || !shapSummary.length) return [];
    const trimmedSteps = shapWaterfall.steps.slice(0, MAX_STEPS);

    const pts: Point[] = [
      {
        label: "Baseline",
        y: shapWaterfall.baseline,
        contribution: 0,
        direction: "neutral",
      },
    ];

    let running = shapWaterfall.baseline;
    trimmedSteps.forEach((step) => {
      running += step.value;
      pts.push({
        label: step.feature,
        y: running,
        contribution: step.value,
        featureValue: patientValues?.[step.feature],
        direction:
          step.value > 0 ? "positive" : step.value < 0 ? "negative" : "neutral",
      });
    });

    pts.push({
      label: "Net risk",
      y: shapWaterfall.finalValue,
      contribution: 0,
      direction: "neutral",
    });

    return pts;
  }, [shapSummary, shapWaterfall, patientValues]);

  if (!points.length) {
    return <p className="text-sm text-slate-500">SHAP details not available.</p>;
  }

  const yValues = points.map((p) => p.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const span = Math.max(maxY - minY, 1e-6);
  const paddedMin = minY - span * 0.15;
  const paddedMax = maxY + span * 0.15;

  const width = 720;
  const height = 260;
  const paddingX = 60;
  const paddingY = 30;
  const scaleX = (idx: number) =>
    paddingX + (idx / Math.max(1, points.length - 1)) * (width - paddingX * 1.5);
  const scaleY = (val: number) =>
    height -
    paddingY -
    ((val - paddedMin) / Math.max(paddedMax - paddedMin, 1e-6)) *
      (height - paddingY * 1.5);

  const formatDelta = (v: number) =>
    `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)} pts`;
  const formatValue = (v: number | string | undefined) => {
    if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
    if (typeof v === "string") return v;
    return "—";
  };

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, idx) => {
    const ratio = idx / (tickCount - 1);
    return paddedMin + ratio * (paddedMax - paddedMin);
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-700">
        <LineChart className="h-4 w-4 text-blue-500" />
        <div>
          <p className="text-sm font-semibold">SHAP Risk Trajectory</p>
          <p className="text-xs text-slate-500">
            Baseline probability to net risk with the strongest drivers annotated.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          {yTicks.map((tick, idx) => {
            const y = scaleY(tick);
            return (
              <g key={`tick-${idx}`}>
                <line
                  x1={paddingX}
                  x2={width - paddingX / 2}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth={0.8}
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500"
                >
                  {(tick * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}

          <line
            x1={paddingX}
            x2={width - paddingX / 2}
            y1={scaleY(points[0].y)}
            y2={scaleY(points[0].y)}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {points.slice(0, -1).map((point, idx) => {
            const next = points[idx + 1];
            const color =
              next.direction === "positive"
                ? POS_COLOR
                : next.direction === "negative"
                ? NEG_COLOR
                : NEUTRAL_COLOR;
            return (
              <line
                key={`seg-${point.label}-${idx}`}
                x1={scaleX(idx)}
                y1={scaleY(point.y)}
                x2={scaleX(idx + 1)}
                y2={scaleY(next.y)}
                stroke={color}
                strokeWidth={2.5}
              />
            );
          })}

          {points.map((point, idx) => {
            const color =
              point.direction === "positive"
                ? POS_COLOR
                : point.direction === "negative"
                ? NEG_COLOR
                : "#334155";
            const x = scaleX(idx);
            const y = scaleY(point.y);
            return (
              <g key={`point-${point.label}-${idx}`}>
                <circle cx={x} cy={y} r={4} fill="#fff" stroke={color} strokeWidth={2} />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="text-[10px] font-semibold fill-slate-700"
                >
                  {point.label}
                </text>
              </g>
            );
          })}

          {points.map((point, idx) => (
            <text
              key={`xlabel-${point.label}-${idx}`}
              x={scaleX(idx)}
              y={height - 6}
              textAnchor="middle"
              className="text-[10px] fill-slate-500"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid gap-2 text-[0.75rem] text-slate-600">
        {points.slice(1, -1).map((p) => (
          <div
            key={p.label}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800">{p.label}</span>
              <span className="text-[0.7rem] text-slate-500">
                Patient value: {formatValue(p.featureValue)}
              </span>
            </div>
            <span
              className={`text-xs font-semibold ${
                p.contribution > 0
                  ? "text-rose-600"
                  : p.contribution < 0
                  ? "text-sky-600"
                  : "text-slate-500"
              }`}
            >
              {formatDelta(p.contribution)}
            </span>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          Net risk after these drivers:{" "}
          <span className="font-semibold text-slate-900">
            {(points[points.length - 1].y * 100).toFixed(1)}%
          </span>{" "}
          (baseline {(points[0].y * 100).toFixed(1)}%).
        </div>
      </div>
    </div>
  );
}
