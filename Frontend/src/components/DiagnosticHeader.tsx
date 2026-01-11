import React from "react";
import { Stethoscope } from "lucide-react";

export interface DiagnosticHeaderProps {
  t: (key: string) => string;
}

export default function DiagnosticHeader(props: DiagnosticHeaderProps): JSX.Element {
  const { t } = props;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-inner">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text)]">
          {t("diag_title")}
        </h2>
      </div>
      <p className="max-w-2xl text-sm md:text-base text-[var(--muted)]">
        {t("diag_subtitle")}
      </p>
    </div>
  );
}
