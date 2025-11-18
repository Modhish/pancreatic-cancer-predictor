import React from "react";
import { Stethoscope } from "lucide-react";

export interface DiagnosticHeaderProps {
  clientType: string;
  setClientType: (type: string) => void;
  t: (key: string) => string;
}

export default function DiagnosticHeader(
  props: DiagnosticHeaderProps,
): JSX.Element {
  const { clientType, setClientType, t } = props;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t("diag_title")}
          </h2>
        </div>
        <p className="mt-2 text-slate-600 text-sm md:text-base">
          {t("diag_subtitle")}
        </p>
      </div>

      <div className="flex items-center gap-2 bg-white rounded-full border border-slate-200 px-3 py-1 shadow-sm">
        <span className="text-xs font-medium text-slate-500">
          {t("audience")}:
        </span>
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
              className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                active
                  ? "bg-blue-600 text-white shadow"
                  : "text-blue-700 hover:bg-blue-50"
              }`}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

