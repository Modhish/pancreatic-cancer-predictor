import React, { useRef } from "react";
import { Home, Users, Award, Stethoscope, Menu, X, Moon, SunMedium } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../translations";

export interface NavigationProps {
  currentSection: string;
  setCurrentSection: (section: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  language: string;
  setLanguage: (lang: string) => void;
  theme: "light" | "dark";
  setTheme: (mode: "light" | "dark") => void;
  t: (key: string) => string;
}

function Navigation({
  currentSection,
  setCurrentSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  language,
  setLanguage,
  theme,
  setTheme,
  t,
}: NavigationProps): JSX.Element {
  const navItems = [
    { id: "home", label: t("nav_home"), icon: Home },
    { id: "about", label: t("nav_about"), icon: Users },
    { id: "features", label: t("nav_features"), icon: Award },
    { id: "diagnostic", label: t("nav_diag"), icon: Stethoscope },
  ];
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
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-inner">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">DiagnoAI</h1>
              <p className="text-xs text-slate-500">Pancreas Diagnostic</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentSection(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  currentSection === item.id
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition shadow-inner"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white shadow-sm">
            <div className="px-2 pt-2 pb-3 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-base font-medium transition ${
                    currentSection === item.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="px-3">
                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 shadow-inner transition mb-3"
                >
                  {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{theme === "dark" ? t("toggle_light") : t("toggle_dark")}</span>
                </button>
                <div className="relative flex items-center justify-center rounded-full bg-blue-50 border border-blue-100 p-1 overflow-hidden">
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
                          setMobileMenuOpen(false);
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
        )}
      </div>
    </nav>
  );
}

export default Navigation;
