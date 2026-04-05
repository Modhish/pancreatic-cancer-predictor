import React, { useEffect, useMemo, useState } from "react";
import { Activity, Clock, FileText, TrendingUp } from "lucide-react";
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
  risk_level: string;
  subject_label: string;
  patient_name?: string | null;
  signed_by?: string | null;
  created_at: string;
  language: string;
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

  return (
    <section id="profile" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 lg:px-12">
      <div className="space-y-6">
        <div className="card-sleek rounded-[2rem] p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
                {t("nav_profile")}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold text-[var(--text)]">
                {user.full_name}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted)]">
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

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
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
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              {t("profile_recent_history")}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {user.role === "doctor"
                ? t("profile_recent_history_doctor")
                : t("profile_recent_history_user")}
            </p>

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
                history.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/80 p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-display text-lg font-semibold text-[var(--text)]">
                          {item.subject_label}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {new Date(item.created_at).toLocaleString(language)}
                        </p>
                        {item.patient_name && user.role === "doctor" && (
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
                      <div className="text-left sm:text-right">
                        <p className={`text-sm font-semibold ${riskTone(item.risk_level)}`}>
                          {formatRiskLabel(item.risk_level)} {t("profile_risk_suffix")}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-[var(--text)]">
                          {Math.round(item.probability * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
