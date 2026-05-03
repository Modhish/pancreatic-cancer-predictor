import React from "react";
import { ScatterChart } from "lucide-react";

import { WaterfallData } from "../hooks/useShapInsights";
import { formatShapFeatureLabel } from "../utils/featureLabels";

export interface ShapWaterfallPlotProps {
  shapWaterfall: WaterfallData;
  shapRange: number;
  shapFxDisplay: number | null;
  t: (key: string) => string;
}

const POS_COLOR = "#f14668";
const NEG_COLOR = "#1d7dff";

export default function ShapWaterfallPlot(
  props: ShapWaterfallPlotProps,
): JSX.Element {
  const { shapWaterfall, shapRange, shapFxDisplay, t } = props;

  const width = 880;
  const stepHeight = 38;
  const paddingY = 28;
  const svgHeight = shapWaterfall.steps.length * stepHeight + paddingY * 2;
  const labelWidth = 220;
  const plotWidth = width - labelWidth - 40;

  const scaleX = (value: number) => {
    const clampedRange = Math.max(shapRange, 1e-6);
    return (
      labelWidth +
      ((value - shapWaterfall.min) / clampedRange) * (plotWidth - 40)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--muted)]">
        <ScatterChart className="h-4 w-4 text-[var(--accent)]" />
        <p className="text-sm font-semibold text-[var(--text)]">
          {t("graph_waterfall")}
        </p>
      </div>
      <p className="text-xs text-[var(--muted)]">
        f(x) ={" "}
        <span className="font-semibold text-[var(--text)]">
          {(shapFxDisplay ?? shapWaterfall.finalValue).toFixed(3)}
        </span>{" "}
        | E[f(X)] ={" "}
        <span className="font-semibold text-[var(--text)]">
          {shapWaterfall.baseline.toFixed(3)}
        </span>
      </p>
      <div className="overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${width} ${svgHeight}`}
          className="min-w-[760px] w-full"
          style={{ height: `${Math.min(Math.max(svgHeight, 340), 760)}px` }}
          preserveAspectRatio="xMidYMin meet"
        >
          <defs>
            <pattern
              id="wf-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            x={labelWidth}
            y={paddingY}
            width={plotWidth - 40}
            height={svgHeight - paddingY * 2}
            fill="url(#wf-grid)"
            rx="4"
          />
          {shapWaterfall.steps.map((step, idx) => {
            const label = formatShapFeatureLabel(step.feature, t, step.featureKey);
            const yTop = paddingY + idx * stepHeight + 6;
            const yBottom = yTop + 20;
            const yMid = (yTop + yBottom) / 2;
            const startX = scaleX(step.start);
            const endX = scaleX(step.end);
            const positive = endX >= startX;
            const left = Math.min(startX, endX);
            const right = Math.max(startX, endX);
            const widthArrow = Math.max(18, right - left);
            const color = positive ? POS_COLOR : NEG_COLOR;
            const points = positive
              ? `${left},${yTop} ${left + widthArrow - 12},${yTop} ${
                  left + widthArrow
                },${yMid} ${left + widthArrow - 12},${yBottom} ${left},${yBottom}`
              : `${right},${yTop} ${right - widthArrow + 12},${yTop} ${
                  right - widthArrow
                },${yMid} ${right - widthArrow + 12},${yBottom} ${right},${yBottom}`;
            const deltaValue =
              step.value >= 0 ? `+${step.value.toFixed(2)}` : step.value.toFixed(2);
            return (
              <g key={`${step.feature}-${idx}`}>
                <text
                  x={labelWidth - 18}
                  y={yMid + 3}
                  textAnchor="end"
                  className="fill-[var(--muted)] text-[12px]"
                >
                  {label.length > 28 ? `${label.slice(0, 27)}...` : label}
                </text>
                <polygon points={points} fill={color} opacity={0.9} />
                <text
                  x={positive ? left + widthArrow - 4 : right - widthArrow + 4}
                  y={yMid + 4}
                  textAnchor={positive ? "end" : "start"}
                  className="text-[11px]"
                  fill="#ffffff"
                  fontWeight="600"
                >
                  {deltaValue}
                </text>
              </g>
            );
          })}
          <line
            x1={scaleX(shapWaterfall.finalValue)}
            x2={scaleX(shapWaterfall.finalValue)}
            y1={paddingY - 6}
            y2={svgHeight - paddingY + 6}
            stroke="var(--border)"
            strokeDasharray="4 4"
          />
          <line
            x1={scaleX(shapWaterfall.baseline)}
            x2={scaleX(shapWaterfall.baseline)}
            y1={paddingY - 6}
            y2={svgHeight - paddingY + 6}
            stroke="var(--border)"
            strokeDasharray="4 4"
          />
          <text
            x={scaleX(shapWaterfall.finalValue)}
            y={paddingY - 10}
            textAnchor="middle"
            className="text-[11px] fill-[var(--muted)]"
          >
            f(x) = {shapWaterfall.finalValue.toFixed(3)}
          </text>
          <text
            x={scaleX(shapWaterfall.baseline)}
            y={svgHeight - paddingY + 20}
            textAnchor="middle"
            className="text-[11px] fill-[var(--muted)]"
          >
            E[f(X)] = {shapWaterfall.baseline.toFixed(3)}
          </text>
        </svg>
      </div>
    </div>
  );
}
