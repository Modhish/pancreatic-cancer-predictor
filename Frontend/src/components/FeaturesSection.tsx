import React from "react";
import { Brain, BarChart3, ShieldCheck, Zap, Users, Award } from "lucide-react";

export interface FeaturesSectionProps {
  t: (key: string) => string;
}

function FeaturesSection({ t }: FeaturesSectionProps): JSX.Element {
  const features = [
    {
      icon: Brain,
      title: t("feat_ai_title"),
      description: t("feat_ai_desc"),
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: BarChart3,
      title: t("feat_shap_title"),
      description: t("feat_shap_desc"),
      bg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: ShieldCheck,
      title: t("feat_sec_title"),
      description: t("feat_sec_desc"),
      bg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Zap,
      title: t("feat_rt_title"),
      description: t("feat_rt_desc"),
      bg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Users,
      title: t("feat_ehr_title"),
      description: t("feat_ehr_desc"),
      bg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      icon: Award,
      title: t("feat_fda_title"),
      description: t("feat_fda_desc"),
      bg: "bg-rose-100",
      iconColor: "text-rose-600",
    },
  ];

  return (
    <section
      id="features"
      className="py-16"
      style={{ scrollMarginTop: "5rem" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            {t("features_title")}
          </h1>
          <p className="text-slate-500 max-w-3xl mx-auto">
            {t("features_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description, bg, iconColor }) => (
            <div
              key={title}
              className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 hover:shadow-lg transition"
            >
              <div
                className={`flex items-center justify-center w-14 h-14 ${bg} rounded-xl mb-4`}
              >
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {title}
              </h3>
              <p className="text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
