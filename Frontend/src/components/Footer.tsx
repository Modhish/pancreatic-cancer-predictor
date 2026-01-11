import React from "react";
import { Stethoscope } from "lucide-react";

export interface FooterProps {
  onNavigate: (section: string) => void;
  t: (key: string) => string;
}

function Footer({ onNavigate, t }: FooterProps): JSX.Element {
  return (
    <footer className="relative overflow-hidden py-12 text-[var(--text)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent)]">
                <Stethoscope className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold">DiagnoAI</h3>
                <p className="text-sm text-[var(--muted)]">
                  Pancreas Diagnostic
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)]">
              Advanced AI-powered pancreatic cancer diagnostic system for
              healthcare professionals.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer_navigation")}</h4>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <button
                  onClick={() => onNavigate("home")}
                  className="cursor-pointer transition-colors hover:text-[var(--accent)]"
                >
                  {t("nav_home")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="cursor-pointer transition-colors hover:text-[var(--accent)]"
                >
                  {t("nav_about")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("features")}
                  className="cursor-pointer transition-colors hover:text-[var(--accent)]"
                >
                  {t("nav_features")}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("diagnostic")}
                  className="cursor-pointer transition-colors hover:text-[var(--accent)]"
                >
                  {t("nav_diag")}
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--muted)]">
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
