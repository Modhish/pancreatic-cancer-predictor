import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  Download,
  Eye,
  FileText,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_BASE } from "../utils/api";
import { AuthUser } from "../hooks/useAuth";

interface AnalysisRecord {
  id: number;
  probability: number;
  prediction: number;
  risk_level: string;
  subject_label: string;
  patient_name?: string | null;
  signed_by?: string | null;
  created_at: string;
  language: string;
  client_type: string;
  analyst_name?: string;
  analyst_role?: string;
  ai_explanation?: string;
  patient_values?: Record<string, number | string>;
  shap_values?: Array<unknown>;
  metrics?: Record<string, number | string>;
}

interface HistoryResponse {
  history: AnalysisRecord[];
  summary: {
    total_analyses: number;
    average_probability: number;
    latest_risk_level?: string | null;
    high_risk_count: number;
  };
}

interface ProfilePageProps {
  user: AuthUser;
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>;
  onNavigateToDiagnostic: () => void;
  language: string;
  t: (key: string) => string;
}

const riskTone = (riskLevel: string) => {
  if (riskLevel === "High") {
    return "text-red-300";
  }
  if (riskLevel === "Moderate") {
    return "text-amber-300";
  }
  return "text-emerald-300";
};

export default function ProfilePage({
  user,
  authorizedFetch,
  onNavigateToDiagnostic,
  language,
  t,
}: ProfilePageProps): JSX.Element {
  const [payload, setPayload] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisRecord | null>(null);
  const [downloadingAnalysisId, setDownloadingAnalysisId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await authorizedFetch(`${API_BASE}/api/account/history?limit=40`);
        const data = (await response.json()) as HistoryResponse & { error?: string };
        if (!response.ok) {
          throw new Error(data.error || "Failed to load history");
        }
        if (!cancelled) {
          setPayload(data);
          setActiveAnalysis((prev) => prev ?? data.history?.[0] ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load history",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authorizedFetch]);

  const history = payload?.history || [];
  const summary = payload?.summary;
  const roleLabel =
    {
      patient: t("profile_role_patient"),
      doctor: t("profile_role_doctor"),
      researcher: t("profile_role_researcher"),
      admin: t("profile_role_admin"),
    }[user.role] || user.role;

  useEffect(() => {
    if (!activeAnalysis && history.length > 0) {
      setActiveAnalysis(history[0]);
    }
  }, [activeAnalysis, history]);

  const trendData = useMemo(
    () =>
      [...history]
        .reverse()
        .map((item) => ({
          label: new Date(item.created_at).toLocaleDateString(language, {
            month: "short",
            day: "numeric",
          }),
          probability: Math.round(item.probability * 100),
        })),
    [history, language],
  );

  const doctorInsights = useMemo(() => {
    const namedPatients = new Set(
      history.map((item) => item.patient_name).filter(Boolean),
    );
    return {
      signedCases: history.filter((item) => item.signed_by).length,
      uniquePatients: namedPatients.size,
      reportsReady: history.length,
    };
  }, [history]);

  const formatRiskLabel = (riskLevel: string) => {
    if (riskLevel === "High") {
      return t("risk_high");
    }
    if (riskLevel === "Moderate") {
      return t("risk_moderate");
    }
    if (riskLevel === "Low") {
      return t("risk_low");
    }
    return riskLevel;
  };

  const activePatientValues = useMemo(
    () => Object.entries(activeAnalysis?.patient_values || {}),
    [activeAnalysis?.patient_values],
  );

  const activeMetrics = useMemo(
    () => Object.entries(activeAnalysis?.metrics || {}).filter(([, value]) => value !== null && value !== undefined && value !== ""),
    [activeAnalysis?.metrics],
  );

  const handleDownloadAnalysis = async (analysis: AnalysisRecord) => {
    setError("");
    setDownloadingAnalysisId(analysis.id);
    try {
      const response = await authorizedFetch(`${API_BASE}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_values: analysis.patient_values || {},
          analysis: {
            ...analysis,
            shap_values: analysis.shap_values || [],
            ai_explanation: analysis.ai_explanation || "",
            language: analysis.language || language,
          },
          language: analysis.language || language,
        }),
      });

      if (!response.ok) {
        let message = `${response.status} ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson?.error) {
            message = errJson.error;
          }
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.download = `diagnoai-analysis-${analysis.id}-${timestamp}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : t("profile_download_failed"),
      );
    } finally {
      setDownloadingAnalysisId(null);
    }
  };

  return (
    <section id="profile" className="mx-auto w-full max-w-[1680px] px-4 py-12 sm:px-8 lg:px-12">
      <div className="space-y-6">
        <div className="card-sleek rounded-[2rem] p-8 sm:p-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
                {t("nav_profile")}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold text-[var(--text)]">
                {user.full_name}
              </h1>
              <p className="mt-3 max-w-4xl text-base leading-8 text-[var(--muted)]">
                {t("profile_role_label")}{" "}
                <span className="text-[var(--text)]">{roleLabel}</span>.{" "}
                {t("profile_intro")}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToDiagnostic}
              className="rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/25"
            >
              {t("profile_cta")}
            </button>
          </div>
        </div>

        {user.role === "doctor" && (
          <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="card-sleek rounded-[2rem] p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)]">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                    {t("profile_doctor_workspace")}
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-[var(--text)]">
                    {t("profile_doctor_title")}
                  </h2>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted)]">
                    {t("profile_doctor_subtitle")}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)]">
                  {t("profile_doctor_org")} {user.organization || t("profile_doctor_org_empty")}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)]">
                  {t("profile_doctor_signed_cases")} {doctorInsights.signedCases}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)]">
                  {t("profile_doctor_unique_patients")} {doctorInsights.uniquePatients}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              {[
                {
                  label: t("profile_doctor_signed_cases"),
                  value: doctorInsights.signedCases,
                },
                {
                  label: t("profile_doctor_unique_patients"),
                  value: doctorInsights.uniquePatients,
                },
                {
                  label: t("profile_doctor_reports_ready"),
                  value: doctorInsights.reportsReady,
                },
              ].map((item) => (
                <div key={item.label} className="card-sleek rounded-3xl p-6">
                  <p className="text-sm text-[var(--muted)]">{item.label}</p>
                  <p className="mt-4 font-display text-3xl font-bold text-[var(--text)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: t("profile_saved_analyses"),
              value: summary?.total_analyses ?? 0,
              icon: Activity,
            },
            {
              label: t("profile_average_probability"),
              value: `${Math.round((summary?.average_probability ?? 0) * 100)}%`,
              icon: TrendingUp,
            },
            {
              label: t("profile_latest_risk_level"),
              value: summary?.latest_risk_level
                ? formatRiskLabel(summary.latest_risk_level)
                : t("profile_no_history"),
              icon: Clock,
            },
            {
              label: t("profile_high_risk_analyses"),
              value: summary?.high_risk_count ?? 0,
              icon: FileText,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card-sleek rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">{label}</p>
                <Icon className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <p className="mt-5 font-display text-3xl font-bold text-[var(--text)]">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="card-sleek rounded-[2rem] p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              {t("profile_probability_trend")}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t("profile_probability_trend_subtitle")}
            </p>
            <div className="mt-8 h-[320px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                  {t("profile_loading_history")}
                </div>
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.92)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "16px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Line
                      dataKey="probability"
                      type="monotone"
                      stroke="#1db954"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#1db954" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)]">
                  {t("profile_empty_trend")}
                </div>
              )}
            </div>
          </div>

          <div className="card-sleek rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
                  {t("profile_recent_history")}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {user.role === "doctor"
                    ? t("profile_recent_history_doctor")
                    : t("profile_recent_history_user")}
                </p>
              </div>
              {activeAnalysis && (
                <button
                  type="button"
                  onClick={() => handleDownloadAnalysis(activeAnalysis)}
                  disabled={downloadingAnalysisId === activeAnalysis.id}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
                >
                  <Download className="h-4 w-4" />
                  {downloadingAnalysisId === activeAnalysis.id
                    ? t("profile_downloading")
                    : t("profile_download_active")}
                </button>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <div className="rounded-3xl border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--muted)]">
                  {t("profile_loading_analyses")}
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--muted)]">
                  {t("profile_empty_history")}
                </div>
              ) : (
                history.map((item) => {
                  const active = activeAnalysis?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-3xl border p-5 transition ${
                        active
                          ? "border-[color-mix(in_srgb,var(--accent)_42%,var(--border))] bg-[color-mix(in_srgb,var(--surface-2)_88%,var(--accent)_6%)]"
                          : "border-[var(--border)] bg-[var(--surface-2)]/80"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-display text-lg font-semibold text-[var(--text)]">
                            {item.subject_label}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {new Date(item.created_at).toLocaleString(language)}
                          </p>
                          {item.patient_name && (
                            <p className="mt-2 text-sm text-[var(--muted)]">
                              {t("profile_patient_label")}{" "}
                              <span className="text-[var(--text)]">{item.patient_name}</span>
                            </p>
                          )}
                          {item.signed_by && (
                            <p className="text-sm text-[var(--muted)]">
                              {t("profile_signed_by")}{" "}
                              <span className="text-[var(--text)]">{item.signed_by}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 sm:items-end">
                          <div className="text-left sm:text-right">
                            <p className={`text-sm font-semibold ${riskTone(item.risk_level)}`}>
                              {formatRiskLabel(item.risk_level)} {t("profile_risk_suffix")}
                            </p>
                            <p className="mt-1 text-2xl font-bold text-[var(--text)]">
                              {Math.round(item.probability * 100)}%
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveAnalysis(item)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
                            >
                              <Eye className="h-4 w-4" />
                              {t("profile_view_full")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadAnalysis(item)}
                              disabled={downloadingAnalysisId === item.id}
                              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                            >
                              <Download className="h-4 w-4" />
                              {downloadingAnalysisId === item.id
                                ? t("profile_downloading")
                                : t("profile_download_pdf")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="card-sleek rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-[var(--muted)]">
                {t("profile_full_analysis_eyebrow")}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-[var(--text)]">
                {activeAnalysis?.subject_label || t("profile_no_history")}
              </h2>
              {activeAnalysis && (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {new Date(activeAnalysis.created_at).toLocaleString(language)}
                </p>
              )}
            </div>
            {activeAnalysis && (
              <div className="flex flex-wrap gap-3">
                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${riskTone(activeAnalysis.risk_level)} border border-[var(--border)] bg-[var(--surface-2)]`}>
                  {formatRiskLabel(activeAnalysis.risk_level)} {t("profile_risk_suffix")}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
                  {Math.round(activeAnalysis.probability * 100)}%
                </span>
              </div>
            )}
          </div>

          {!activeAnalysis ? (
            <div className="mt-8 rounded-3xl border border-dashed border-[var(--border)] px-5 py-12 text-center text-sm text-[var(--muted)]">
              {t("profile_select_analysis")}
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: t("profile_detail_case"),
                    value: activeAnalysis.subject_label,
                  },
                  {
                    label: t("profile_detail_patient"),
                    value:
                      activeAnalysis.patient_name || activeAnalysis.subject_label,
                  },
                  {
                    label: t("profile_detail_signed"),
                    value: activeAnalysis.signed_by || t("profile_detail_not_signed"),
                  },
                  {
                    label: t("profile_detail_language"),
                    value: String(activeAnalysis.language || language).toUpperCase(),
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/80 p-5">
                    <p className="text-sm text-[var(--muted)]">{item.label}</p>
                    <p className="mt-3 text-lg font-semibold text-[var(--text)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-2)]/70 p-6">
                  <h3 className="font-display text-2xl font-semibold text-[var(--text)]">
                    {t("profile_lab_values")}
                  </h3>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {activePatientValues.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                      >
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                          {key}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-2)]/70 p-6">
                  <h3 className="font-display text-2xl font-semibold text-[var(--text)]">
                    {t("profile_ai_commentary")}
                  </h3>
                  <p className="mt-4 whitespace-pre-line text-base leading-8 text-[var(--muted)]">
                    {activeAnalysis.ai_explanation || t("ai_unavailable")}
                  </p>

                  {activeMetrics.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                        {t("profile_model_metrics")}
                      </h4>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {activeMetrics.map(([key, value]) => (
                          <div
                            key={key}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                          >
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                              {key}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                              {String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
