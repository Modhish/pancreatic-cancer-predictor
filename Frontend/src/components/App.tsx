import React from "react";
import Navigation from "./Navigation";
import HomeSection from "./HomeSection";
import AboutSection from "./AboutSection";
import FeaturesSection from "./FeaturesSection";
import Footer from "./Footer";
import ErrorBoundary from "./ErrorBoundary";
import DiagnosticTool from "./DiagnosticTool";
import ParticleBackground from "./ParticleBackground";
import ScrollProgress from "./ScrollProgress";
import useAppState from "../hooks/useAppState";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export default function App(): JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("theme");
      if (saved === "dark" || saved === "light" || saved === "system") {
        return saved;
      }
    }
    return "system";
  });
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() =>
    getSystemTheme(),
  );

  const {
    setCurrentSection,
    form,
    result,
    loading,
    downloading,
    err,
    clientType,
    setClientType,
    language,
    setLanguage,
    analysisRefreshing,
    t,
    validate,
    activeAiExplanation,
    handleChange,
    handleSubmit,
    handleDownload,
    handleClear,
  } = useAppState();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () =>
      setSystemTheme(media.matches ? "dark" : "light");
    updateSystemTheme();
    if (media.addEventListener) {
      media.addEventListener("change", updateSystemTheme);
    } else {
      media.addListener(updateSystemTheme);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", updateSystemTheme);
      } else {
        media.removeListener(updateSystemTheme);
      }
    };
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [resolvedTheme, theme]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.setAttribute("dir", "ltr");
      root.setAttribute("lang", language);
    }
  }, [language]);

  const renderSections = (): JSX.Element => (
    <>
      <HomeSection
        onStartDiagnosis={() => setCurrentSection("diagnostic")}
        onLearnMore={() => setCurrentSection("features")}
        t={t}
      />
      <AboutSection t={t} />
      <FeaturesSection t={t} />
      <DiagnosticTool
        form={form}
        result={result}
        loading={loading}
        downloading={downloading}
        err={err}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        handleDownload={handleDownload}
        handleClear={handleClear}
        validate={validate}
        clientType={clientType}
        setClientType={setClientType}
        analysisRefreshing={analysisRefreshing}
        aiExplanation={activeAiExplanation}
        t={t}
      />
    </>
  );

  return (
    <>
      <ParticleBackground />
      <div
        className="app-shell min-h-screen text-[var(--text)] transition-colors"
        dir="ltr"
        lang={language}
      >
        <Navigation
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          t={t}
        />
        <ScrollProgress onNavigate={setCurrentSection} t={t} />

        <main>
          <ErrorBoundary>{renderSections()}</ErrorBoundary>
        </main>

        <Footer onNavigate={setCurrentSection} t={t} />
      </div>
    </>
  );
}
