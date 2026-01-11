import React, { useRef } from "react";
import { Stethoscope, Moon, SunMedium } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../translations";

export interface NavigationProps {
  language: string;
  setLanguage: (lang: string) => void;
  theme: "light" | "dark" | "system";
  setTheme: (mode: "light" | "dark" | "system") => void;
  t: (key: string) => string;
}

function Navigation({
  language,
  setLanguage,
  theme,
  setTheme,
  t,
}: NavigationProps): JSX.Element {
  const themeOptions = [
    { value: "light", label: t("toggle_light"), icon: SunMedium },
    { value: "dark", label: t("toggle_dark"), icon: Moon },
  ] as const;
  const activeLangIndex = SUPPORTED_LANGUAGES.findIndex((l) => l.value === language) ?? 0;
  const langSegmentWidth = 100 / SUPPORTED_LANGUAGES.length;
  const langSoundRef = useRef<HTMLAudioElement | null>(null);

  const playLangSound = () => {
    try {
      if (!langSoundRef.current) {
        langSoundRef.current = new Audio(
          "data:audio/wav;base64,UklGRlYAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YSgAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA="
        );
        langSoundRef.current.volume = 0.25;
      }
      langSoundRef.current.currentTime = 0;
      langSoundRef.current.play().catch(() => {});
    } catch {
      // ignore audio errors
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur shadow-md sticky top-0 z-50 border-b border-slate-200 glass-surface">
      <div className="max-w-[1800px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6 text-[var(--text)]">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent)] shadow-inner">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">DiagnoAI</h1>
              <p className="text-xs text-slate-500">Pancreas Diagnostic</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div
              className="flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-inner"
              role="group"
              aria-label={t("theme_label")}
            >
              {themeOptions.map(({ value, label, icon: Icon }) => {
                const active = theme === value;
                return (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-[var(--surface)] text-[var(--text)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative flex items-center rounded-full bg-blue-50 border border-blue-100 p-1 shadow-inner overflow-hidden">
              <span
                className="absolute top-1 bottom-1 rounded-full bg-white shadow transition-all duration-300 ease-out"
                style={{
                  left: `${activeLangIndex * langSegmentWidth}%`,
                  width: `${langSegmentWidth}%`,
                }}
              />
              {SUPPORTED_LANGUAGES.map(({ value, label }) => {
                const active = language === value;
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setLanguage(value);
                      playLangSound();
                    }}
                    className={`relative px-3 py-1 text-xs font-semibold rounded-full transition duration-300 ${
                      active
                        ? "text-blue-800"
                        : "text-blue-700 hover:text-blue-800 hover:scale-105"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
