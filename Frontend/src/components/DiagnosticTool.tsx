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
    <div className="py-16 bg-slate-100">
      <div className="max-w-[1800px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <DiagnosticHeader t={t} />

        <div className="grid lg:grid-cols-2 gap-8 items-start">
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
  );
}
