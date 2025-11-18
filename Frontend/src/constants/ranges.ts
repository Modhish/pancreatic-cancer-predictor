export type RangeKey =
  | "wbc"
  | "rbc"
  | "plt"
  | "hgb"
  | "hct"
  | "mpv"
  | "pdw"
  | "mono"
  | "baso_abs"
  | "baso_pct"
  | "glucose"
  | "act"
  | "bilirubin";

export const RANGES: Record<RangeKey, [number, number]> = {
  wbc: [4.0, 11.0],
  rbc: [4.0, 5.5],
  plt: [150, 450],
  hgb: [120, 160],
  hct: [36, 46],
  mpv: [7.4, 10.4],
  pdw: [10, 18],
  mono: [0.2, 0.8],
  baso_abs: [0.0, 0.1],
  baso_pct: [0.0, 2.0],
  glucose: [3.9, 5.6],
  act: [10, 40],
  bilirubin: [5, 21],
};
