export type RangeKey =
  | "wbc"
  | "rbc"
  | "plt"
  | "hgb"
  | "hct"
  | "mpv"
  | "pdw"
  | "neut_abs"
  | "neut_pct"
  | "lymph_abs"
  | "lymph_pct"
  | "mono_abs"
  | "mono_pct"
  | "eos_abs"
  | "eos_pct"
  | "baso_abs"
  | "baso_pct"
  | "esr";

export const RANGES: Record<RangeKey, [number, number]> = {
  wbc: [4.0, 11.0],
  rbc: [4.0, 5.5],
  plt: [150, 450],
  hgb: [120, 160],
  hct: [36, 46],
  mpv: [7.4, 10.4],
  pdw: [10, 18],
  neut_abs: [1.5, 8.0],
  neut_pct: [40, 75],
  lymph_abs: [1.0, 4.0],
  lymph_pct: [18, 45],
  mono_abs: [0.1, 1.2],
  mono_pct: [2, 12],
  eos_abs: [0.0, 0.6],
  eos_pct: [0, 6],
  baso_abs: [0.0, 0.1],
  baso_pct: [0.0, 2.0],
  esr: [0, 40],
};
