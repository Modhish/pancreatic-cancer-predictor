import React, { useMemo } from "react";
import {
  Brain,
  FileText,
  Loader2,
  ShieldCheck,
  Star,
  ExternalLink,
} from "lucide-react";
import {
  GUIDELINE_LINKS,
  ParsedAiAnalysis,
  parseAiAnalysis,
} from "../utils/aiAnalysis";
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

  const aiStructured: ParsedAiAnalysis | null = useMemo(() => {
    return parseAiAnalysis(aiExplanation);
  }, [aiExplanation]);

  return (
    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 md:p-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            {t("ai_title")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t("ai_disclaimer")}</p>
        </div>
        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                {t("audience")}
              </span>
              <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur">
                {["patient", "doctor", "scientist"].map((id) => {
                  const active = clientType === id;
                  const labelKey =
                    id === "patient"
                      ? "audience_patient"
                      : id === "doctor"
                        ? "audience_doctor"
                        : "audience_scientist";
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setClientType(id)}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                          : "text-blue-700 hover:bg-blue-50"
                      }`}
                    >
                      {t(labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!result || downloading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition w-full sm:w-auto"
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

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
        {aiExplanation ? (
          aiStructured ? (
            <div className="space-y-3">
              <p className="font-semibold">{aiStructured.header}</p>
              {aiStructured.subtitle && (
                <p className="text-xs text-slate-500">{aiStructured.subtitle}</p>
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
                <p className="text-xs text-slate-500 pt-2">
                  {aiStructured.footer.text}
                </p>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-line">{aiExplanation}</p>
          )
        ) : (
          <p className="text-sm text-slate-500">{t("ai_unavailable")}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[0.7rem] text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{t("disclaimer_title")}</span>
          <span className="text-slate-600">{t("disclaimer_text")}</span>
        </div>
        <div className="flex items-center gap-3">
          {GUIDELINE_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <Star className="h-3.5 w-3.5" />
              <span>{label}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
