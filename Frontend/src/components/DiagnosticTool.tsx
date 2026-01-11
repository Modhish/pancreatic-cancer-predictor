import React from "react";
import { AppResult, FormState } from "../hooks/useAppState";
import DiagnosticHeader from "./DiagnosticHeader";
import DiagnosticFormSection from "./DiagnosticFormSection";
import DiagnosticResultsSection from "./DiagnosticResultsSection";

export interface DiagnosticToolProps {
  form: FormState;
  result: AppResult | null;
  loading: boolean;
  downloading: boolean;
  err: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => Promise<void>;
  handleDownload: () => Promise<void>;
  handleClear: () => void;
  validate: { ok: boolean; message: string };
  clientType: string;
  setClientType: (type: string) => void;
  analysisRefreshing: boolean;
  aiExplanation: string;
  t: (key: string) => string;
}

export default function DiagnosticTool(
  props: DiagnosticToolProps,
): JSX.Element {
  const {
    form,
    result,
    loading,
    downloading,
    err,
    handleChange,
    handleSubmit,
    handleDownload,
    handleClear,
    validate,
    clientType,
    setClientType,
    analysisRefreshing,
    aiExplanation,
    t,
  } = props;

  return (
    <section
      id="diagnostic"
      className="py-16 sm:py-20"
      style={{ scrollMarginTop: "5rem" }}
    >
      <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-14">
        <div className="space-y-10">
          <DiagnosticHeader t={t} />

          <div className="rounded-[32px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-6 shadow-lg sm:p-8 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
              <DiagnosticFormSection
                form={form}
                result={result}
                loading={loading}
                downloading={downloading}
                err={err}
                validate={validate}
                aiExplanation={aiExplanation}
                t={t}
                clientType={clientType}
                setClientType={setClientType}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                handleDownload={handleDownload}
                handleClear={handleClear}
              />

              <DiagnosticResultsSection
                result={result}
                analysisRefreshing={analysisRefreshing}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
