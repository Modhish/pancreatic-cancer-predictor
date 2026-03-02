import React from "react";
import { Stethoscope } from "lucide-react";

export interface FooterProps {
  onNavigate: (section: string) => void;
  t: (key: string) => string;
}

function Footer({ onNavigate, t }: FooterProps): JSX.Element {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)] py-16 text-[var(--text)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent)]">
                <Stethoscope className="h-5 w-5 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight">DiagnoAI</h3>
                <p className="text-xs text-[var(--muted)]">Pancreas Diagnostic</p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Advanced AI-powered pancreatic cancer diagnostic system for
              healthcare professionals and researchers.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {t("footer_navigation")}
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { id: "home", label: t("nav_home") },
                { id: "about", label: t("nav_about") },
                { id: "features", label: t("nav_features") },
                { id: "diagnostic", label: t("nav_diag") },
              ].map(({ id, label }) => (
                <li key={id}>
                  <button
                    onClick={() => onNavigate(id)}
                    className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Disclaimer
            </h4>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              This tool is intended for research and educational purposes only.
              It does not constitute medical advice. Always consult a qualified
              healthcare professional for medical decisions.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--muted)]">
          <p>&copy; 2025 DiagnoAI Medical Systems. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
