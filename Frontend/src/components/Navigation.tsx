import React, { useEffect, useRef, useState } from "react";
import { Stethoscope, Moon, SunMedium, Menu, X } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../translations";

export interface NavigationProps {
  language: string;
  setLanguage: (lang: string) => void;
  theme: "light" | "dark" | "system";
  setTheme: (mode: "light" | "dark" | "system") => void;
  t: (key: string) => string;
  currentSection: string;
  onNavigate: (section: string) => void;
}

function Navigation({
  language,
  setLanguage,
  theme,
  setTheme,
  t,
  currentSection,
  onNavigate,
}: NavigationProps): JSX.Element {
  const themeOptions = [
    { value: "light", label: t("toggle_light"), icon: SunMedium },
    { value: "dark", label: t("toggle_dark"), icon: Moon },
  ] as const;
  const navItems = [
    { id: "home", label: t("nav_home") },
    { id: "about", label: t("nav_about") },
    { id: "features", label: t("nav_features") },
    { id: "diagnostic", label: t("nav_diag") },
  ];
  const activeLangIndex = SUPPORTED_LANGUAGES.findIndex((l) => l.value === language) ?? 0;
  const langSegmentWidth = 100 / SUPPORTED_LANGUAGES.length;
  const langSoundRef = useRef<HTMLAudioElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleNavigate = (section: string) => {
    onNavigate(section);
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!mobileOpen || typeof window === "undefined") {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileOpen]);

  return (
    <nav className="bg-[var(--surface)]/90 backdrop-blur shadow-md sticky top-0 z-50 border-b border-[var(--border)] glass-surface">
      <div className="max-w-[1800px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-4 text-[var(--text)]">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent)] shadow-inner">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-[var(--text)]">DiagnoAI</h1>
              <p className="text-xs text-[var(--muted)]">Pancreas Diagnostic</p>
            </div>
          </div>

          <div className="hidden md:flex lg:hidden items-center gap-1">
            {navItems.map((item) => {
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide transition ${
                    active
                      ? "bg-[var(--surface-2)] text-[var(--text)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--surface-2)] text-[var(--text)] shadow"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="hidden md:flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-inner"
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
            <div className="relative hidden md:flex items-center rounded-full bg-blue-50 border border-blue-100 p-1 shadow-inner overflow-hidden">
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
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="md:hidden inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[var(--text)] shadow-inner"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="absolute right-0 top-0 h-full w-[85vw] max-w-[320px] bg-[var(--surface)] border-l border-[var(--border)] p-5 shadow-2xl flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                {t("footer_navigation")}
              </div>
              <button
                type="button"
                className="rounded-full border border-[var(--border)] p-2"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const active = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--surface-2)] text-[var(--text)]"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-[0.35em] text-[var(--muted)]">
                {t("theme_label")}
              </div>
              <div className="flex flex-col gap-2">
                {themeOptions.map(({ value, label, icon: Icon }) => {
                  const active = theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-[var(--surface-2)] text-[var(--text)]"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-[0.35em] text-[var(--muted)]">
                {t("language")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_LANGUAGES.map(({ value, label }) => {
                  const active = language === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setLanguage(value);
                        playLangSound();
                        setMobileOpen(false);
                      }}
                      className={`rounded-2xl px-3 py-3 text-xs font-semibold transition ${
                        active
                          ? "bg-[var(--surface-2)] text-[var(--text)]"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
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
      )}
    </nav>
  );
}

export default Navigation;
