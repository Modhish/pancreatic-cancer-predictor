import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  FileText,
  Microscope,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";

export interface HomeSectionProps {
  onStartDiagnosis: () => void;
  onLearnMore: () => void;
  t: (key: string) => string;
}

function HomeSection({
  onStartDiagnosis,
  onLearnMore,
  t,
}: HomeSectionProps): JSX.Element {
  const proofHighlights = [
    t("home_proof_role"),
    t("home_proof_doctor"),
    t("home_proof_history"),
  ];

  const audiences = [
    {
      title: t("home_audience_patient_title"),
      description: t("home_audience_patient_desc"),
      icon: User,
      accent: "from-emerald-400/35 to-emerald-500/10",
    },
    {
      title: t("home_audience_doctor_title"),
      description: t("home_audience_doctor_desc"),
      icon: Stethoscope,
      accent: "from-cyan-400/30 to-sky-500/10",
    },
    {
      title: t("home_audience_researcher_title"),
      description: t("home_audience_researcher_desc"),
      icon: Microscope,
      accent: "from-amber-300/30 to-rose-400/10",
    },
  ];

  const workflowSteps = [
    {
      index: "01",
      title: t("home_step_1_title"),
      description: t("home_step_1_desc"),
      icon: ShieldCheck,
    },
    {
      index: "02",
      title: t("home_step_2_title"),
      description: t("home_step_2_desc"),
      icon: Activity,
    },
    {
      index: "03",
      title: t("home_step_3_title"),
      description: t("home_step_3_desc"),
      icon: FileText,
    },
  ];

  const workspaceOutputs = [
    {
      label: t("home_case_card_label"),
      body: t("home_workspace_patient_body"),
      icon: Activity,
    },
    {
      label: t("home_signature_label"),
      body: t("home_workspace_doctor_body"),
      icon: Stethoscope,
    },
    {
      label: t("home_dashboard_label"),
      body: t("home_workspace_research_body"),
      icon: Microscope,
    },
  ];

  return (
    <div
      id="home"
      className="relative overflow-hidden"
      style={{ scrollMarginTop: "6rem" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px]">
        <div className="absolute left-[8%] top-14 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] blur-3xl" />
        <div className="absolute right-[8%] top-10 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--accent-2)_14%,transparent)] blur-3xl" />
        <div className="absolute left-1/2 top-52 h-80 w-80 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--surface-2)_34%,transparent)] blur-3xl" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative pt-28 pb-14 sm:pt-32"
      >
        <div className="mx-auto max-w-[1720px] px-4 sm:px-8 lg:px-12 2xl:px-14">
          <div className="grid items-center gap-14 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] 2xl:gap-20">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-[color-mix(in_srgb,var(--border)_82%,white_12%)] bg-[color-mix(in_srgb,var(--surface)_62%,transparent)] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--muted)] shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <span className="glow-dot h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                {t("home_hero_kicker")}
              </div>

              <div className="space-y-5">
                <h1 className="font-display text-4xl font-black leading-[0.96] tracking-[-0.05em] text-[var(--text)] sm:text-5xl lg:text-6xl xl:text-[4.6rem]">
                  <span className="block">{t("home_hero_line_1")}</span>
                  <span className="block text-[color-mix(in_srgb,var(--accent)_84%,var(--text)_16%)]">
                    {t("home_hero_line_2")}
                  </span>
                </h1>

                <p className="max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                  {t("home_hero_support")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {proofHighlights.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--border)_82%,white_10%)] bg-[color-mix(in_srgb,var(--surface)_58%,transparent)] px-4 py-2 text-sm text-[var(--text)] backdrop-blur-xl"
                  >
                    <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={onStartDiagnosis}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_92%,white_8%),color-mix(in_srgb,var(--accent-2)_14%,var(--accent)_86%))] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_color-mix(in_srgb,var(--accent)_32%,transparent)] transition hover:-translate-y-0.5"
                >
                  {t("start")}
                  <ArrowUpRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onLearnMore}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--border)_80%,white_10%)] bg-[color-mix(in_srgb,var(--surface)_62%,transparent)] px-7 py-3.5 text-sm font-semibold text-[var(--text)] backdrop-blur-xl transition hover:-translate-y-0.5"
                >
                  {t("learn_more")}
                </button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
              className="relative"
            >
              <div className="marketing-shell rounded-[36px] p-5 sm:p-6">
                <div className="overflow-hidden rounded-[28px] border border-[color-mix(in_srgb,var(--border)_82%,white_6%)] bg-[color-mix(in_srgb,var(--surface)_62%,transparent)]">
                  <div className="flex flex-col gap-5 border-b border-[color-mix(in_srgb,var(--border)_72%,transparent)] p-6 sm:p-7 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                        {t("home_workspace_title")}
                      </p>
                      <p className="mt-3 max-w-2xl font-display text-2xl font-bold leading-tight text-[var(--text)] sm:text-[2rem]">
                        {t("home_workspace_subtitle")}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_82%,white_18%),color-mix(in_srgb,var(--accent-2)_18%,var(--accent)_82%))] text-white shadow-[0_16px_32px_color-mix(in_srgb,var(--accent)_30%,transparent)]">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="border-b border-[color-mix(in_srgb,var(--border)_72%,transparent)] p-6 sm:p-7 lg:border-b-0 lg:border-r">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
                          {t("home_workflow_eyebrow")}
                        </p>
                        <span className="rounded-full border border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                          18 CBC/ESR
                        </span>
                      </div>

                      <div className="mt-6 space-y-5">
                        {workflowSteps.map(
                          ({ index, title, description, icon: Icon }) => (
                            <div key={title} className="grid grid-cols-[auto_1fr] gap-4">
                              <div className="flex flex-col items-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)]">
                                  <Icon className="h-5 w-5" />
                                </div>
                                {index !== "03" && (
                                  <div className="mt-3 h-10 w-px bg-[color-mix(in_srgb,var(--border)_80%,transparent)]" />
                                )}
                              </div>
                              <div className="min-w-0 pb-1">
                                <div className="flex items-baseline gap-3">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                                    {index}
                                  </span>
                                  <h3 className="font-display text-lg font-bold leading-snug text-[var(--text)]">
                                    {title}
                                  </h3>
                                </div>
                                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                                  {description}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="p-6 sm:p-7">
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
                        {t("home_audience_eyebrow")}
                      </p>
                      <div className="mt-5 divide-y divide-[color-mix(in_srgb,var(--border)_74%,transparent)]">
                        {audiences.map(({ title, description, icon: Icon, accent }) => (
                          <div key={title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}
                            >
                              <Icon className="h-5 w-5 text-[var(--text)]" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-display text-lg font-bold leading-snug text-[var(--text)]">
                                {title}
                              </h3>
                              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                                {description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid border-t border-[color-mix(in_srgb,var(--border)_72%,transparent)] md:grid-cols-3">
                    {workspaceOutputs.map(({ label, body, icon: Icon }) => (
                      <div
                        key={label}
                        className="border-b border-[color-mix(in_srgb,var(--border)_72%,transparent)] px-6 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                              {label}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                              {body}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative py-16"
      >
        <div className="mx-auto max-w-[1720px] px-4 sm:px-8 lg:px-12 2xl:px-14">
          <div className="section-divider mb-16" />
          <div className="flex flex-col gap-4 text-center">
            <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
              {t("home_audience_eyebrow")}
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.04em] text-[var(--text)] sm:text-4xl">
              {t("home_audience_heading")}
            </h2>
            <p className="mx-auto max-w-3xl text-base leading-8 text-[var(--muted)]">
              {t("home_audience_subtitle")}
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {audiences.map(({ title, description, icon: Icon, accent }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className="marketing-card group rounded-[30px] p-7"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br ${accent}`}
                >
                  <Icon className="h-6 w-6 text-[var(--text)]" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-[var(--text)]">
                  {title}
                </h3>
                <p className="mt-3 text-base leading-8 text-[var(--muted)]">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="py-20"
      >
        <div className="mx-auto max-w-[1720px] px-4 sm:px-8 lg:px-12 2xl:px-14">
          <div className="section-divider mb-16" />
          <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr] xl:items-start">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.34em] text-[var(--muted)]">
                {t("home_workflow_eyebrow")}
              </p>
              <h2 className="font-display text-3xl font-bold tracking-[-0.04em] text-[var(--text)] sm:text-4xl">
                {t("home_workflow_heading")}
              </h2>
              <p className="max-w-xl text-base leading-8 text-[var(--muted)]">
                {t("home_workflow_subtitle")}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {workflowSteps.map(({ index, title, description, icon: Icon }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="marketing-card rounded-[28px] p-7"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                      {index}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-[var(--text)]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    {description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

export default HomeSection;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};
