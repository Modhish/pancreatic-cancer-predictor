import React from "react";
import { Activity, Loader2, Lock, X } from "lucide-react";

export interface DiagnosticFormActionsProps {
  loading: boolean;
  handleSubmit: () => Promise<void>;
  handleClear: () => void;
  t: (key: string) => string;
}

export default function DiagnosticFormActions(
  props: DiagnosticFormActionsProps,
): JSX.Element {
  const { loading, handleSubmit, handleClear, t } = props;

  return (
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
  );
}
