import React from "react";
import { Stethoscope } from "lucide-react";

export interface DiagnosticHeaderProps {
  t: (key: string) => string;
}

export default function DiagnosticHeader(props: DiagnosticHeaderProps): JSX.Element {
  const { t } = props;

  return (
    <div className="flex flex-wrap items-start gap-4">
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
    </div>
  );
}
