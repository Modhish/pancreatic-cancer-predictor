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
  t: (key: string) => string;
}

export default function DiagnosticAiCard(
  props: DiagnosticAiCardProps,
): JSX.Element {
  const { aiExplanation, downloading, handleDownload, result, t } = props;

  const aiStructured: ParsedAiAnalysis | null = useMemo(() => {
    return parseAiAnalysis(aiExplanation);
  }, [aiExplanation]);

  return (
    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            {t("ai_title")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t("ai_disclaimer")}</p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!result || downloading}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {downloading ? t("generating_report") : t("download_btn")}
        </button>
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
