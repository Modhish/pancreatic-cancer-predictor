import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_BASE } from "../utils/api";
import { AuthUser } from "../hooks/useAuth";

interface DashboardPayload {
  dashboard: {
    summary: {
      total_analyses: number;
      average_probability: number;
      high_risk_share: number;
      recent_7_day_count: number;
    };
    risk_distribution: Array<{ name: string; value: number }>;
    role_distribution: Array<{ name: string; value: number }>;
    probability_trend: Array<{
      date: string;
      average_probability: number;
      count: number;
    }>;
    feature_hotspots: Array<{ feature: string; score: number }>;
    recent_analyses: Array<{
      id: number;
      subject_label: string;
      analyst_name: string;
      analyst_role: string;
      risk_level: string;
      probability: number;
      created_at: string;
    }>;
  };
}

interface ResearchDashboardPageProps {
  user: AuthUser;
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const PIE_COLORS = ["#ef4444", "#f59e0b", "#22c55e"];

export default function ResearchDashboardPage({
  user,
  authorizedFetch,
}: ResearchDashboardPageProps): JSX.Element {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await authorizedFetch(
          `${API_BASE}/api/account/dashboard/researcher`,
        );
        const data = (await response.json()) as DashboardPayload & { error?: string };
        if (!response.ok) {
          throw new Error(data.error || "Failed to load dashboard");
        }
        if (!cancelled) {
          setPayload(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load dashboard",
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

  const dashboard = payload?.dashboard;
  const trendData = useMemo(
    () =>
      (dashboard?.probability_trend || []).map((item) => ({
        ...item,
        average_probability: Math.round(item.average_probability * 100),
      })),
    [dashboard],
  );

  return (
    <section id="dashboard" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 lg:px-12">
      <div className="space-y-6">
        <div className="card-sleek rounded-[2rem] p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
            Research Dashboard
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--text)]">
            {user.full_name}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Study stored analyses, monitor risk distributions, inspect biomarker hotspots, and review recent analysis activity across the system.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total analyses",
              value: dashboard?.summary.total_analyses ?? 0,
            },
            {
              label: "Average probability",
              value: `${Math.round((dashboard?.summary.average_probability ?? 0) * 100)}%`,
            },
            {
              label: "High-risk share",
              value: `${Math.round((dashboard?.summary.high_risk_share ?? 0) * 100)}%`,
            },
            {
              label: "Last 7 days",
              value: dashboard?.summary.recent_7_day_count ?? 0,
            },
          ].map((item) => (
            <div key={item.label} className="card-sleek rounded-3xl p-6">
              <p className="text-sm text-[var(--muted)]">{item.label}</p>
              <p className="mt-5 font-display text-3xl font-bold text-[var(--text)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card-sleek rounded-[2rem] p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              Risk distribution
            </h2>
            <div className="mt-8 h-[320px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                  Loading dashboard...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboard?.risk_distribution || []}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                    >
                      {(dashboard?.risk_distribution || []).map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.92)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "16px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card-sleek rounded-[2rem] p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              Probability trend
            </h2>
            <div className="mt-8 h-[320px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                  Loading trend...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.92)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "16px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Line
                      dataKey="average_probability"
                      type="monotone"
                      stroke="#1db954"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#1db954" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="card-sleek rounded-[2rem] p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              Biomarker hotspots
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Average normalized deviation from the baseline feature set across stored analyses.
            </p>
            <div className="mt-8 h-[320px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                  Loading biomarker chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard?.feature_hotspots || []}>
                    <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                    <XAxis dataKey="feature" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.92)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "16px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Bar dataKey="score" radius={[12, 12, 0, 0]} fill="#1db954" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card-sleek rounded-[2rem] p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              Recent analyses
            </h2>
            <div className="mt-6 space-y-3">
              {(dashboard?.recent_analyses || []).map((item) => (
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
                        Analyst: {item.analyst_name} ({item.analyst_role})
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {item.risk_level} risk
                      </p>
                      <p className="mt-1 text-2xl font-bold text-[var(--text)]">
                        {Math.round(item.probability * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {!loading && (dashboard?.recent_analyses || []).length === 0 && (
                <div className="rounded-3xl border border-dashed border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--muted)]">
                  No research data available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
