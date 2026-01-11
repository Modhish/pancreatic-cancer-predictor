import React, { useEffect, useRef, useState } from "react";
import { motion, animate } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Globe,
  ShieldCheck,
  Sparkles,
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
  const signal = 78;
  const coverage = 66;
  const latency = 38;

  const progress = Math.max(
    0,
    Math.min(
      100,
      Math.round(signal * 0.45 + coverage * 0.35 + (100 - latency) * 0.2),
    ),
  );

  const sensitivity = clamp(90 + (signal - 50) * 0.2 + (coverage - 50) * 0.08);
  const specificity = clamp(88 + (signal - 50) * 0.12 + (100 - latency) * 0.08);
  const latencySeconds = Math.max(10, Math.round(34 - latency * 0.22));
  const sitesOnline = Math.round(160 + coverage * 2.4);

  const stats = [
    {
      label: t("home_stat_sensitivity"),
      value: sensitivity,
      suffix: "%",
      icon: Sparkles,
    },
    {
      label: t("home_stat_specificity"),
      value: specificity,
      suffix: "%",
      icon: ShieldCheck,
    },
    {
      label: t("home_stat_latency"),
      value: latencySeconds,
      suffix: "s",
      icon: Activity,
    },
    {
      label: t("home_stat_sites"),
      value: sitesOnline,
      suffix: "",
      icon: Globe,
    },
  ];

  return (
    <div
      id="home"
      className="relative overflow-hidden"
      style={{ scrollMarginTop: "5rem" }}
    >
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="pt-20 pb-10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
                {t("home_hero_kicker")}
              </div>

              <div className="space-y-4">
                <h1 className="font-display text-4xl md:text-6xl xl:text-7xl font-black leading-[0.95]">
                  <span className="text-[var(--accent)]">{t("home_brand")}</span>
                  <span className="block text-[var(--text)]">{t("home_hero_title")}</span>
                </h1>
                <div className="space-y-1 text-sm md:text-base text-[var(--muted)]">
                  <p className="font-semibold text-[var(--text)]">
                    {t("home_hero_system_en")}
                  </p>
                  <p>{t("home_hero_ml_en")}</p>
                </div>
                <p className="text-base md:text-lg text-[var(--muted)] max-w-2xl">
                  {t("home_hero_support")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onStartDiagnosis}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black shadow-[0_0_24px_rgba(29,185,84,0.35)] transition hover:translate-y-[-1px]"
                >
                  {t("start")}
                  <ArrowUpRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onLearnMore}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-2)] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(181,140,255,0.35)] transition hover:translate-y-[-1px]"
                >
                  {t("learn_more")}
                </button>
              </div>
            </div>

            <div className="card-sleek rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                    {t("home_status_label")}
                  </p>
                  <p className="text-lg font-semibold text-[var(--text)]">
                    {t("home_status_value")}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                  {t("home_status_value")}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{t("home_progress_label")}</span>
                  <span className="text-[var(--text)] font-semibold">
                    {progress}%
                  </span>
                </div>
                <div className="progress-track h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="progress-fill h-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {t("home_progress_hint")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs text-[var(--muted)]">
                    {t("home_stat_sensitivity")}
                  </p>
                  <p className="text-2xl font-bold text-[var(--text)]">
                    <AnimatedNumber value={sensitivity} suffix="%" />
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs text-[var(--muted)]">
                    {t("home_stat_specificity")}
                  </p>
                  <p className="text-2xl font-bold text-[var(--text)]">
                    <AnimatedNumber value={specificity} suffix="%" />
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs text-[var(--muted)]">
                    {t("home_stat_latency")}
                  </p>
                  <p className="text-2xl font-bold text-[var(--text)]">
                    <AnimatedNumber value={latencySeconds} suffix="s" />
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs text-[var(--muted)]">
                    {t("home_stat_sites")}
                  </p>
                  <p className="text-2xl font-bold text-[var(--text)]">
                    <AnimatedNumber value={sitesOnline} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="py-10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map(({ label, value, suffix, icon: Icon }) => (
              <div
                key={label}
                className="card-sleek rounded-2xl p-5 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                    {label}
                  </span>
                  <Icon className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div className="text-3xl font-bold text-[var(--text)]">
                  <AnimatedNumber value={value} suffix={suffix} />
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {t("home_stat_caption")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="py-16"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-sleek neon-border rounded-3xl px-8 py-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center lg:text-left">
              <p className="text-sm uppercase tracking-[0.35em] text-[var(--muted)]">
                {t("home_feature_title")}
              </p>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">
                {t("home_cta_title")}
              </h3>
              <p className="text-sm text-[var(--muted)]">
                {t("home_cta_subtitle")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onStartDiagnosis}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black shadow-[0_0_24px_rgba(29,185,84,0.35)] transition hover:translate-y-[-1px]"
              >
                {t("start")}
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                onClick={onLearnMore}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition hover:translate-y-[-1px]"
              >
                {t("learn_more")}
              </button>
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
  show: { opacity: 1, y: 0 },
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  decimals?: number;
}

function AnimatedNumber({
  value,
  suffix = "",
  decimals = 0,
}: AnimatedNumberProps): JSX.Element {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    previous.current = value;
    return controls.stop;
  }, [value]);

  return (
    <span>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
