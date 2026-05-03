import React, { useState } from "react";
import { Moon, ShieldCheck, Stethoscope, SunMedium } from "lucide-react";
import { SUPPORTED_LANGUAGES, type TranslationKey } from "../translations";

interface DisclaimerAgreementProps {
  onAccept: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  theme: "light" | "dark" | "system";
  setTheme: (mode: "light" | "dark" | "system") => void;
  t: (key: TranslationKey) => string;
}

export default function DisclaimerAgreement({
  onAccept,
  language,
  setLanguage,
  theme,
  setTheme,
  t,
}: DisclaimerAgreementProps): JSX.Element {
  const [checked, setChecked] = useState(false);
  const agreementItems: TranslationKey[] = [
    "disclaimer_agree_1",
    "disclaimer_agree_2",
    "disclaimer_agree_3",
  ];
  const purposeItems: TranslationKey[] = [
    "disclaimer_purpose_1",
    "disclaimer_purpose_2",
    "disclaimer_purpose_3",
  ];
  const limitItems: TranslationKey[] = [
    "disclaimer_limits_1",
    "disclaimer_limits_2",
    "disclaimer_limits_3",
    "disclaimer_limits_4",
  ];

  return (
    <div className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1580px] flex-col gap-4 lg:gap-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/25">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-[var(--text)]">
                DiagnoAI
              </p>
              <p className="text-sm text-[var(--muted)]">
                {t("disclaimer_kicker")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              className="flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-inner"
              role="group"
              aria-label={t("theme_label")}
            >
              <button
                type="button"
                onClick={() => setTheme("light")}
                aria-pressed={theme === "light"}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  theme === "light"
                    ? "bg-[var(--surface)] text-[var(--text)] shadow"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                <SunMedium className="h-4 w-4" />
                {t("toggle_light")}
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                aria-pressed={theme === "dark"}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  theme === "dark"
                    ? "bg-[var(--surface)] text-[var(--text)] shadow"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                <Moon className="h-4 w-4" />
                {t("toggle_dark")}
              </button>
            </div>

            <div className="flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-inner">
              {SUPPORTED_LANGUAGES.map(({ value, label }) => {
                const active = language === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLanguage(value)}
                    aria-pressed={active}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "bg-[var(--surface)] text-[var(--text)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_minmax(360px,0.78fr)]">
          <section className="card-sleek rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
              {t("disclaimer_kicker")}
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="font-display text-4xl font-bold leading-tight text-[var(--text)] sm:text-5xl">
                {t("disclaimer_title")}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                {t("disclaimer_subtitle")}
              </p>
            </div>

            <div className="mt-8 rounded-3xl border border-amber-500/35 bg-amber-500/10 p-5">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-amber-500">
                {t("disclaimer_warning_label")}
              </p>
              <p className="text-sm leading-7 text-[var(--text)] sm:text-base">
                {t("disclaimer_warning_text")}
              </p>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/80 p-6">
                <h2 className="font-display text-xl font-semibold text-[var(--text)]">
                  {t("disclaimer_purpose_title")}
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                  {purposeItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                      <span>{t(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/80 p-6">
                <h2 className="font-display text-xl font-semibold text-[var(--text)]">
                  {t("disclaimer_limits_title")}
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                  {limitItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                      <span>{t(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <aside className="card-sleek flex flex-col rounded-[2rem] p-6 sm:p-8">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/80 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                {t("disclaimer_agree_title")}
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text)]">
                {agreementItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xs font-bold text-[var(--accent)]">
                      {agreementItems.indexOf(item) + 1}
                    </span>
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/80 p-6">
              <h2 className="font-display text-xl font-semibold text-[var(--text)]">
                {t("disclaimer_emergency_title")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {t("disclaimer_emergency_text")}
              </p>
            </div>

            <div className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/80 p-6">
              <p className="text-sm leading-7 text-[var(--muted)]">
                {t("disclaimer_data_notice")}
              </p>
            </div>

            <div className="mt-6 space-y-4 border-t border-[var(--border)] pt-6">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-[var(--border)] accent-[var(--accent)]"
                />
                <span className="text-sm leading-7 text-[var(--text)]">
                  {t("disclaimer_checkbox")}
                </span>
              </label>

              <button
                type="button"
                onClick={onAccept}
                disabled={!checked}
                className={`w-full rounded-2xl px-5 py-4 font-display text-sm font-semibold tracking-[0.12em] transition-all duration-300 ${
                  checked
                    ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25 hover:-translate-y-0.5 hover:brightness-110"
                    : "bg-[var(--surface-2)] text-[var(--muted)]"
                }`}
              >
                {t("disclaimer_accept")}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
