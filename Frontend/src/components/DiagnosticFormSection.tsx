import React, { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  Brain,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
  X,
  ExternalLink,
} from "lucide-react";
import { RANGES } from "../constants/ranges";
import {
  GUIDELINE_LINKS,
  ParsedAiAnalysis,
  parseAiAnalysis,
} from "../utils/aiAnalysis";
import { AppResult, FormState } from "../hooks/useAppState";

export interface DiagnosticFormSectionProps {
  form: FormState;
  result: AppResult | null;
  loading: boolean;
  downloading: boolean;
  err: string;
  validate: { ok: boolean; message: string };
  aiExplanation: string;
  t: (key: string) => string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => Promise<void>;
  handleDownload: () => Promise<void>;
  handleClear: () => void;
}

export default function DiagnosticFormSection(
  props: DiagnosticFormSectionProps,
): JSX.Element {
  const {
    form,
    result,
    loading,
    downloading,
    err,
    validate,
    aiExplanation,
    t,
    handleChange,
    handleSubmit,
    handleDownload,
    handleClear,
  } = props;

  const aiStructured: ParsedAiAnalysis | null = useMemo(() => {
    return parseAiAnalysis(aiExplanation);
  }, [aiExplanation]);

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {t("diag_patient_values")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t("empty_prompt")}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            {t("footer_hipaa")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Award className="h-4 w-4 text-blue-500" />
            {t("footer_fda")}
          </span>
        </div>
      </div>

      {err && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">Request error</p>
            <p className="mt-1 whitespace-pre-line">{err}</p>
          </div>
        </div>
      )}

      {!validate.ok && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
          <div>
            <p className="font-semibold">Input validation</p>
            <p className="mt-1 whitespace-pre-line">{validate.message}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            {t("lab_section_core")}
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {["wbc", "rbc", "plt", "hgb", "hct", "mpv", "pdw", "mono"].map(
              (key) => {
                const range = RANGES[key];
                const value = Number(form[key]);
                const outOfRange =
                  range &&
                  !Number.isNaN(value) &&
                  (value < range[0] || value > range[1]);
                return (
                  <div key={key} className="space-y-1">
                    <label className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span>{key.toUpperCase()}</span>
                      {range && (
                        <span className="text-[0.7rem] text-slate-400">
                          {range[0]} - {range[1]}
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 ${
                        outOfRange
                          ? "border-amber-400 bg-amber-50"
                          : "border-slate-200 bg-white"
                      }`}
                    />
                    {outOfRange && (
                      <p className="text-[0.7rem] text-amber-700">
                        Outside reference range
                      </p>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            {t("lab_section_metabolic")}
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {["baso_abs", "baso_pct", "glucose", "act", "bilirubin"].map(
              (key) => {
                const range = RANGES[key];
                const value = Number(form[key]);
                const outOfRange =
                  range &&
                  !Number.isNaN(value) &&
                  (value < range[0] || value > range[1]);
                return (
                  <div key={key} className="space-y-1">
                    <label className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span>{key.toUpperCase()}</span>
                      {range && (
                        <span className="text-[0.7rem] text-slate-400">
                          {range[0]} - {range[1]}
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 ${
                        outOfRange
                          ? "border-amber-400 bg-amber-50"
                          : "border-slate-200 bg-white"
                      }`}
                    />
                    {outOfRange && (
                      <p className="text-[0.7rem] text-amber-700">
                        Outside reference range
                      </p>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pt-2">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("analyze")}
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                {t("analyze")}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <X className="h-4 w-4 mr-2" />
            {t("clear")}
          </button>
        </div>

        <p className="text-[0.7rem] text-slate-400 max-w-xs flex items-center gap-1">
          <Lock className="h-3.5 w-3.5" />
          {t("disclaimer_text")}
        </p>
      </div>

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
                  <p className="text-xs text-slate-500">
                    {aiStructured.subtitle}
                  </p>
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
    </section>
  );
}

