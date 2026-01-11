import React, { useMemo } from "react";
import { Brain, FileText, Loader2 } from "lucide-react";
import { ParsedAiAnalysis, parseAiAnalysis } from "../utils/aiAnalysis";
import { AppResult } from "../hooks/useAppState";

export interface DiagnosticAiCardProps {
  aiExplanation: string;
  downloading: boolean;
  handleDownload: () => Promise<void>;
  result: AppResult | null;
  clientType: string;
  setClientType: (type: string) => void;
  t: (key: string) => string;
}

export default function DiagnosticAiCard(
  props: DiagnosticAiCardProps,
): JSX.Element {
  const {
    aiExplanation,
    downloading,
    handleDownload,
    result,
    clientType,
    setClientType,
    t,
  } = props;

  const audiences = [
    { id: "patient", labelKey: "audience_patient" },
    { id: "doctor", labelKey: "audience_doctor" },
    { id: "scientist", labelKey: "audience_scientist" },
  ] as const;
  const activeIndex = Math.max(
    0,
    audiences.findIndex((aud) => aud.id === clientType),
  );

  const aiStructured: ParsedAiAnalysis | null = useMemo(() => {
    return parseAiAnalysis(aiExplanation);
  }, [aiExplanation]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_85%,transparent)] p-6 md:p-7 space-y-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_top,rgba(29,185,84,0.18),transparent_60%),radial-gradient(circle_at_bottom,rgba(181,140,255,0.18),transparent_55%)]" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--accent)]" />
            {t("ai_title")}
          </h3>
        </div>
        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--muted)] font-semibold">
                {t("audience")}
              </span>
              <div className="relative inline-flex w-full max-w-[360px] rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] p-1.5 shadow-sm backdrop-blur">
                <span
                  className="absolute inset-y-1 rounded-xl bg-[var(--accent)] shadow-[0_12px_28px_rgba(29,185,84,0.25)] transition-all duration-300 ease-out"
                  style={{
                    left: `${(100 / audiences.length) * activeIndex}%`,
                    width: `${100 / audiences.length}%`,
                  }}
                />
                {audiences.map((audience) => {
                  const active = clientType === audience.id;
                  return (
                    <button
                      key={audience.id}
                      type="button"
                      onClick={() => setClientType(audience.id)}
                      aria-pressed={active}
                      className={`relative z-10 flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? "text-black"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {t(audience.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!result || downloading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_28px_rgba(29,185,84,0.25)] hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition w-full sm:w-auto"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {downloading ? t("generating_report") : t("download_btn")}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-5 py-5 text-sm text-[var(--text)] leading-relaxed">
        {aiExplanation ? (
          aiStructured ? (
            <div className="space-y-3">
              <p className="font-semibold">{aiStructured.header}</p>
              {aiStructured.subtitle && (
                <p className="text-xs text-[var(--muted)]">{aiStructured.subtitle}</p>
              )}
              {aiStructured.sections.map((section) => (
                <div key={section.title} className="space-y-1.5">
                  <p className="text-sm font-semibold">{section.title}</p>
                  {section.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-sm">
                      {p}
                    </p>
                  ))}
                  {section.bullets.length > 0 && (
                    <ul className="list-disc pl-4 text-sm space-y-0.5">
                      {section.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {aiStructured.footer && (
                <p className="text-xs text-[var(--muted)] pt-2">
                  {aiStructured.footer.text}
                </p>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-line">{aiExplanation}</p>
          )
        ) : (
          <p className="text-sm text-[var(--muted)]">{t("ai_unavailable")}</p>
        )}
      </div>
    </div>
  );
}
