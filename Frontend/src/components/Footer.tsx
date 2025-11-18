import React from "react";
import { Stethoscope } from "lucide-react";

export interface FooterProps {
  onNavigate: (section: string) => void;
  t: (key: string) => string;
}

function Footer({ onNavigate, t }: FooterProps): JSX.Element {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">DiagnoAI</h3>
                <p className="text-sm text-gray-400">Pancreas Diagnostic</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Advanced AI-powered pancreatic cancer diagnostic system for
              healthcare professionals.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer_navigation")}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button
                  onClick={() => onNavigate("home")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t("nav_home")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t("nav_about")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("features")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t("nav_features")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("diagnostic")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t("nav_diag")}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer_medical")}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t("footer_model_performance")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("features")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t("footer_clinical_validation")}
                </button>
              </li>
              <li className="text-gray-500">{t("footer_fda")}</li>
              <li className="text-gray-500">{t("footer_hipaa")}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 DiagnoAI Medical Systems. All rights reserved.</p>
          <p className="mt-2">
            This tool is for research and educational purposes only. Always
            consult with qualified healthcare providers for medical decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
