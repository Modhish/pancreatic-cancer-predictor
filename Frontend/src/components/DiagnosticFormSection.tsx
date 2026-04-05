import React from "react";
import { AlertTriangle, Award, FileText, ShieldCheck } from "lucide-react";
import { AppResult, FormState } from "../hooks/useAppState";
import DiagnosticFormActions from "./DiagnosticFormActions";
import DiagnosticFormFields from "./DiagnosticFormFields";
import DiagnosticAiCard from "./DiagnosticAiCard";

export interface DiagnosticFormSectionProps {
  form: FormState;
  subjectName: string;
  setSubjectName: (value: string) => void;
  result: AppResult | null;
  loading: boolean;
  downloading: boolean;
  err: string;
  validate: { ok: boolean; message: string };
  aiExplanation: string;
  t: (key: string) => string;
  clientType: string;
  setClientType: (type: string) => void;
  audienceLocked: boolean;
  availableAudiences: Array<{ id: string; labelKey: string }>;
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
    subjectName,
    setSubjectName,
    result,
    loading,
    downloading,
    err,
    validate,
    aiExplanation,
    t,
    clientType,
    setClientType,
    audienceLocked,
    availableAudiences,
    handleChange,
    handleSubmit,
    handleDownload,
    handleClear,
  } = props;

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 space-y-6 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
            <FileText className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            {t("diag_patient_values")}
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{t("diag_subtitle")}</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-[var(--muted)] shrink-0">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            {t("footer_hipaa")}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Award className="h-4 w-4 shrink-0 text-[var(--accent-2)]" />
            {t("footer_fda")}
          </span>
        </div>
      </div>

      {err && (
        <div className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--border)_70%,#ef4444_30%)] bg-[color-mix(in_srgb,var(--surface)_92%,#ef4444_8%)] px-4 py-3 text-sm text-[var(--text)]">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">{t("request_error_title")}</p>
            <p className="mt-1 whitespace-pre-line">{err}</p>
          </div>
        </div>
      )}

      {!validate.ok && (
        <div className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--border)_70%,#f59e0b_30%)] bg-[color-mix(in_srgb,var(--surface)_92%,#f59e0b_8%)] px-4 py-3 text-xs text-[var(--text)]">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
          <div>
            <p className="font-semibold">{t("validation_title")}</p>
            <p className="mt-1 whitespace-pre-line">{validate.message}</p>
          </div>
        </div>
      )}

      <DiagnosticFormFields form={form} handleChange={handleChange} t={t} />

      {(clientType === "doctor" || clientType === "researcher") && (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
            {clientType === "doctor" ? "Patient name" : "Case label"}
          </span>
          <input
            type="text"
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            placeholder={
              clientType === "doctor"
                ? "Required for signed doctor analyses"
                : "Optional label for this research case"
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
          />
        </label>
      )}

      <DiagnosticFormActions
        loading={loading}
        handleSubmit={handleSubmit}
        handleClear={handleClear}
        t={t}
      />

      <DiagnosticAiCard
        aiExplanation={aiExplanation}
        downloading={downloading}
        handleDownload={handleDownload}
        result={result}
        clientType={clientType}
        setClientType={setClientType}
        audienceLocked={audienceLocked}
        availableAudiences={availableAudiences}
        t={t}
      />
    </section>
  );
}
