import React from "react";
import {
  Stethoscope,
  FileText,
  TrendingUp,
  Clock,
  ShieldCheck,
  Award,
  Brain,
  BarChart3,
  Lock,
} from "lucide-react";

export interface HomeSectionProps {
  onStartDiagnosis: () => void;
  onLearnMore: () => void;
  t: (key: string) => string;
}

function HomeSection({
  onStartDiagnosis,
  onLearnMore,
  t,
}: HomeSectionProps): JSX.Element {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white py-20 rounded-b-3xl shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {t("home_hero_title_1")}
              <span className="block text-blue-100">
                {t("home_hero_title_2")}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/90 max-w-2xl mx-auto">
              {t("home_hero_subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <button
                onClick={onStartDiagnosis}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-blue-600 font-semibold shadow-md hover:shadow-lg hover:bg-blue-50 transition"
              >
                <Stethoscope className="h-5 w-5 mr-2" />
                {t("start")}
              </button>
              <button
                onClick={onLearnMore}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-blue-500 text-white font-semibold shadow-md hover:shadow-lg hover:bg-blue-600 transition"
              >
                <FileText className="h-5 w-5 mr-2" />
                {t("learn_more")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                value: "97.4%",
                label: t("home_stat_accuracy"),
                color: "text-blue-600",
                bg: "bg-blue-100",
              },
              {
                icon: Clock,
                value: "<30s",
                label: t("home_stat_time"),
                color: "text-emerald-600",
                bg: "bg-emerald-100",
              },
              {
                icon: ShieldCheck,
                value: "HIPAA",
                label: t("home_stat_compliant"),
                color: "text-purple-600",
                bg: "bg-purple-100",
              },
              {
                icon: Award,
                value: "FDA",
                label: t("home_stat_approved"),
                color: "text-orange-600",
                bg: "bg-orange-100",
              },
            ].map(({ icon: Icon, value, label, color, bg }) => (
              <div
                key={value}
                className="text-center bg-white rounded-2xl shadow-md p-8 border border-slate-100"
              >
                <div
                  className={`flex items-center justify-center w-16 h-16 ${bg} rounded-full mx-auto mb-4`}
                >
                  <Icon className={`h-8 w-8 ${color}`} />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">
                  {value}
                </h3>
                <p className="text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              {t("home_why_title")}
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              {t("home_why_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center hover:shadow-lg transition">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mx-auto mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                AI-Powered Analysis
              </h3>
              <p className="text-slate-500">
                Advanced machine learning algorithms trained on thousands of
                patient records for maximum accuracy and reliability.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center hover:shadow-lg transition">
              <div className="flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-xl mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                SHAP Interpretability
              </h3>
              <p className="text-slate-500">
                Transparent decision-making with detailed explanations of how
                each biomarker contributes to the diagnosis.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center hover:shadow-lg transition">
              <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mx-auto mb-4">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Secure & Private
              </h3>
              <p className="text-slate-500">
                Enterprise-grade security with HIPAA compliance and end-to-end
                encryption to protect patient data.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomeSection;
