const FEATURE_LABEL_KEYS: Record<string, string> = {
  wbc: "feature_label_wbc",
  rbc: "feature_label_rbc",
  plt: "feature_label_plt",
  hgb: "feature_label_hgb",
  hct: "feature_label_hct",
  mpv: "feature_label_mpv",
  pdw: "feature_label_pdw",
  neut_abs: "feature_label_neut_abs",
  neut_pct: "feature_label_neut_pct",
  lymph_abs: "feature_label_lymph_abs",
  lymph_pct: "feature_label_lymph_pct",
  mono_abs: "feature_label_mono_abs",
  mono_pct: "feature_label_mono_pct",
  eos_abs: "feature_label_eos_abs",
  eos_pct: "feature_label_eos_pct",
  baso_abs: "feature_label_baso_abs",
  baso_pct: "feature_label_baso_pct",
  esr: "feature_label_esr",
};

const FEATURE_ALIASES: Record<string, string> = {
  wbc: "wbc",
  "white blood cell count": "wbc",
  rbc: "rbc",
  "red blood cell count": "rbc",
  plt: "plt",
  platelets: "plt",
  hgb: "hgb",
  hemoglobin: "hgb",
  hct: "hct",
  hematocrit: "hct",
  mpv: "mpv",
  "mean platelet volume": "mpv",
  pdw: "pdw",
  "platelet distribution width": "pdw",
  "neut#": "neut_abs",
  neut_abs: "neut_abs",
  "neutrophils (absolute)": "neut_abs",
  "neut%": "neut_pct",
  neut_pct: "neut_pct",
  "neutrophils (%)": "neut_pct",
  "lymph#": "lymph_abs",
  lymph_abs: "lymph_abs",
  "lymphocytes (absolute)": "lymph_abs",
  "lymph%": "lymph_pct",
  lymph_pct: "lymph_pct",
  "lymphocytes (%)": "lymph_pct",
  "mono#": "mono_abs",
  mono_abs: "mono_abs",
  "monocytes (absolute)": "mono_abs",
  "mono%": "mono_pct",
  mono_pct: "mono_pct",
  "monocytes (%)": "mono_pct",
  "eos#": "eos_abs",
  eos_abs: "eos_abs",
  "eosinophils (absolute)": "eos_abs",
  "eos%": "eos_pct",
  eos_pct: "eos_pct",
  "eosinophils (%)": "eos_pct",
  "baso#": "baso_abs",
  baso_abs: "baso_abs",
  "basophils (absolute)": "baso_abs",
  "baso%": "baso_pct",
  baso_pct: "baso_pct",
  "basophils (%)": "baso_pct",
  "basophils (% of leukocytes)": "baso_pct",
  esr: "esr",
  "erythrocyte sedimentation rate": "esr",
};

const normalizeText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/-/g, "_");

export function normalizeFeatureKey(feature: string | undefined): string | null {
  if (!feature) return null;
  const normalized = normalizeText(feature);
  return FEATURE_ALIASES[normalized] ?? FEATURE_ALIASES[normalized.replace(/_/g, " ")] ?? null;
}

export function formatShapFeatureLabel(
  feature: string,
  t: (key: string) => string,
  featureKey?: string | null,
): string {
  const key = featureKey || normalizeFeatureKey(feature);
  const labelKey = key ? FEATURE_LABEL_KEYS[key] : null;
  return labelKey ? t(labelKey) : feature;
}
