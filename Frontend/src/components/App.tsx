import React from "react";
import Navigation from "./Navigation";
import HomeSection from "./HomeSection";
import AboutSection from "./AboutSection";
import FeaturesSection from "./FeaturesSection";
import Footer from "./Footer";
import ErrorBoundary from "./ErrorBoundary";
import DiagnosticTool from "./DiagnosticTool";
import useAppState from "../hooks/useAppState";
import { useEffect, useState } from "react";

export default function App(): JSX.Element {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  const {
    currentSection,
    setCurrentSection,
    form,
    result,
    loading,
    downloading,
    err,
    mobileMenuOpen,
    setMobileMenuOpen,
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
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.setAttribute("dir", "ltr");
      root.setAttribute("lang", language);
    }
  }, [language]);

  const renderSection = (): JSX.Element => {
    switch (currentSection) {
      case "diagnostic":
        return (
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
        );
      case "about":
        return <AboutSection t={t} />;
      case "features":
        return <FeaturesSection t={t} />;
      default:
        return (
          <HomeSection
            onStartDiagnosis={() => setCurrentSection("diagnostic")}
            onLearnMore={() => setCurrentSection("features")}
            t={t}
          />
        );
    }
  };

  return (
    <div
      className="app-shell min-h-screen text-[var(--text)] transition-colors"
      dir="ltr"
      lang={language}
    >
      <Navigation
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        t={t}
      />

      <main>
        <ErrorBoundary>{renderSection()}</ErrorBoundary>
      </main>

      <Footer onNavigate={setCurrentSection} t={t} />
    </div>
  );
}
