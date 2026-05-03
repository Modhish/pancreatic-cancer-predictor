import React from "react";
import {
  Activity,
  BarChart3,
  Brain,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";

export interface FeaturesSectionProps {
  t: (key: string) => string;
}

function FeaturesSection({ t }: FeaturesSectionProps): JSX.Element {
  const cards = [
    {
      title: t("feat_ai_title"),
      description: t("feat_ai_desc"),
      eyebrow: t("features_card_ai_eyebrow"),
      icon: Brain,
      className: "lg:col-span-2 lg:row-span-2",
      glow: "from-emerald-400/24 via-emerald-500/10 to-transparent",
      body: (
        <div className="mt-8 grid gap-0 divide-y divide-[color-mix(in_srgb,var(--border)_72%,transparent)] border-y border-[color-mix(in_srgb,var(--border)_72%,transparent)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {[
            {
              label: t("features_ai_stat_1_label"),
              value: t("features_ai_stat_1_value"),
            },
            {
              label: t("features_ai_stat_2_label"),
              value: t("features_ai_stat_2_value"),
            },
          ].map((item) => (
            <div key={item.label} className="py-5 sm:px-5 sm:first:pl-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--text)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: t("features_role_title"),
      description: t("features_role_desc"),
      eyebrow: t("features_role_eyebrow"),
      icon: Users,
      className: "lg:col-span-1",
      glow: "from-sky-400/24 via-cyan-500/10 to-transparent",
    },
    {
      title: t("features_history_title"),
      description: t("features_history_desc"),
      eyebrow: t("features_history_eyebrow"),
      icon: Activity,
      className: "lg:col-span-1",
      glow: "from-amber-300/24 via-orange-400/10 to-transparent",
    },
    {
      title: t("features_signature_title"),
      description: t("features_signature_desc"),
      eyebrow: t("features_signature_eyebrow"),
      icon: FileText,
      className: "lg:col-span-1",
      glow: "from-fuchsia-400/20 via-violet-400/10 to-transparent",
    },
    {
      title: t("features_dashboard_title"),
      description: t("features_dashboard_desc"),
      eyebrow: t("features_dashboard_eyebrow"),
      icon: BarChart3,
      className: "lg:col-span-1",
      glow: "from-cyan-300/24 via-indigo-400/10 to-transparent",
    },
    {
      title: t("feat_sec_title"),
      description: t("feat_sec_desc"),
      eyebrow: t("features_safety_eyebrow"),
      icon: ShieldCheck,
      className: "lg:col-span-2",
      glow: "from-emerald-400/20 via-white/5 to-transparent",
      body: (
        <div className="mt-6 flex flex-wrap gap-3">
          {[
            t("features_safety_chip_1"),
            t("features_safety_chip_2"),
            t("features_safety_chip_3"),
          ].map((item) => (
            <span
              key={item}
              className="rounded-full border border-[color-mix(in_srgb,var(--border)_78%,white_8%)] bg-[color-mix(in_srgb,var(--surface)_52%,transparent)] px-4 py-2 text-sm font-medium text-[var(--text)]"
            >
              {item}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section
      id="features"
      className="py-24"
      style={{ scrollMarginTop: "6rem" }}
    >
      <div className="mx-auto max-w-[1720px] px-4 sm:px-8 lg:px-12 2xl:px-14">
        <div className="section-divider mb-16" />

        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
            {t("features_eyebrow")}
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.04em] text-[var(--text)] sm:text-4xl">
            {t("features_title")}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            {t("features_subtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
          {cards.map(
            ({ title, description, eyebrow, icon: Icon, className, glow, body }) => (
            <div
              key={title}
              className={`marketing-card relative overflow-hidden rounded-[24px] p-6 sm:p-7 ${className}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${glow} opacity-70`}
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
                      {eyebrow}
                    </p>
                    <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-[var(--text)]">
                      {title}
                    </h3>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--border)_78%,white_8%)] bg-[color-mix(in_srgb,var(--surface)_52%,transparent)] text-[var(--text)]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                  {description}
                </p>
                {body}
              </div>
            </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
