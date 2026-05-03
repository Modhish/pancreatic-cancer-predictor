import React from "react";
import { AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";

export interface AboutSectionProps {
  t: (key: string) => string;
}

function AboutSection({ t }: AboutSectionProps): JSX.Element {
  const guardrails = [
    t("about_guardrail_1"),
    t("about_guardrail_2"),
    t("about_guardrail_3"),
    t("about_guardrail_4"),
  ];

  const pillars = [
    {
      title: t("about_pillar_1_title"),
      description: t("about_pillar_1_desc"),
      icon: ShieldCheck,
    },
    {
      title: t("about_pillar_2_title"),
      description: t("about_pillar_2_desc"),
      icon: Sparkles,
    },
    {
      title: t("about_pillar_3_title"),
      description: t("about_pillar_3_desc"),
      icon: AlertTriangle,
    },
  ];

  return (
    <section
      id="about"
      className="py-24"
      style={{ scrollMarginTop: "6rem" }}
    >
      <div className="mx-auto max-w-[1720px] px-4 sm:px-8 lg:px-12 2xl:px-14">
        <div className="section-divider mb-16" />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]">
          <div className="marketing-card rounded-[26px] p-7 sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--border)_82%,white_10%)] bg-[color-mix(in_srgb,var(--surface)_56%,transparent)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              <span className="glow-dot h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              {t("about_eyebrow")}
            </div>

            <h2 className="mt-6 max-w-4xl font-display text-3xl font-bold tracking-[-0.03em] text-[var(--text)] sm:text-4xl">
              {t("about_heading")}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
              {t("about_subtitle")}
            </p>

            <div className="mt-8 border-t border-[color-mix(in_srgb,var(--border)_76%,transparent)] pt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
                {t("about_mission_title")}
              </p>
              <p className="mt-4 text-base leading-8 text-[var(--text)]">
                {t("about_mission_p1")}
              </p>
              <p className="mt-4 text-base leading-8 text-[var(--muted)]">
                {t("about_mission_p2")}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="marketing-card rounded-[26px] p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                    {t("about_guardrails_eyebrow")}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-[var(--text)]">
                    {t("about_guardrails_title")}
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {guardrails.map((item, index) => (
                  <div
                    key={item}
                    className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-7 text-[var(--muted)]"
                  >
                    <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[11px] font-bold text-[var(--accent)]">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <div key={title} className="marketing-card rounded-[24px] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent-2)_18%,transparent)] text-[var(--text)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display text-xl font-bold text-[var(--text)]">
                    {title}
                  </h4>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
