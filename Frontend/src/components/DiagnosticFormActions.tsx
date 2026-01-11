import React from "react";
import { Activity, Loader2, X } from "lucide-react";

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
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[var(--accent)] text-black text-sm font-semibold shadow-[0_10px_24px_rgba(29,185,84,0.25)] hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
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
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition"
        >
          <X className="h-4 w-4 mr-2" />
          {t("clear")}
        </button>
      </div>

    </div>
  );
}
