import React from "react";
import { RANGES } from "../constants/ranges";
import { FormState } from "../hooks/useAppState";

interface FieldGroup {
  titleKey: string;
  keys: Array<keyof FormState>;
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    titleKey: "lab_section_core",
    keys: ["wbc", "rbc", "plt", "hgb", "hct", "mpv", "pdw", "mono"],
  },
  {
    titleKey: "lab_section_metabolic",
    keys: ["baso_abs", "baso_pct", "glucose", "act", "bilirubin"],
  },
];

export interface DiagnosticFormFieldsProps {
  form: FormState;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
}

export default function DiagnosticFormFields(
  props: DiagnosticFormFieldsProps,
): JSX.Element {
  const { form, handleChange, t } = props;

  return (
    <div className="space-y-6">
      {FIELD_GROUPS.map(({ titleKey, keys }) => (
        <div key={titleKey}>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            {t(titleKey)}
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {keys.map((key) => {
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
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
