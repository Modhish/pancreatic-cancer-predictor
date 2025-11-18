import React from "react";
import { CheckCircle2 } from "lucide-react";

export interface AboutSectionProps {
  t: (key: string) => string;
}

function AboutSection({ t }: AboutSectionProps): JSX.Element {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            {t("about_title")}
          </h1>
          <p className="text-slate-500 max-w-3xl mx-auto">
            {t("about_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {t("about_mission_title")}
            </h2>
            <p className="text-slate-500">{t("about_mission_p1")}</p>
            <p className="text-slate-500">{t("about_mission_p2")}</p>

            <div className="space-y-4">
              {[
                t("about_card_fda_title"),
                t("about_card_validation_title"),
                t("about_card_hipaa_title"),
              ].map((title, idx) => {
                const descriptions = [
                  t("about_card_fda_desc"),
                  t("about_card_validation_desc"),
                  t("about_card_hipaa_desc"),
                ];
                return (
                  <div
                    key={title}
                    className="flex items-start bg-slate-100/70 rounded-2xl p-4"
                  >
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{title}</h3>
                      <p className="text-slate-500">
                        {descriptions[idx]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { value: "10,000+", label: t("about_stat_records"), color: "text-blue-600" },
              { value: "97.4%", label: t("about_stat_accuracy"), color: "text-emerald-600" },
              { value: "500+", label: t("about_stat_partners"), color: "text-purple-600" },
              { value: "24/7", label: t("about_stat_support"), color: "text-orange-600" },
            ].map((stat) => (
              <div
                key={stat.value}
                className="text-center bg-white rounded-2xl shadow-md border border-slate-100 p-6"
              >
                <div className={`text-3xl font-bold mb-2 ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutSection;
