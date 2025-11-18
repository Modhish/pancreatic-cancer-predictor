import React from "react";
import Navigation from "./Navigation";
import HomeSection from "./HomeSection";
import AboutSection from "./AboutSection";
import FeaturesSection from "./FeaturesSection";
import Footer from "./Footer";
import ErrorBoundary from "./ErrorBoundary";
import DiagnosticTool from "./DiagnosticTool";
import useAppState from "../hooks/useAppState";

export default function App(): JSX.Element {
  const {
    currentSection,
    setCurrentSection,
    form,
    setForm,
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

  const renderSection = (): JSX.Element => {
    switch (currentSection) {
      case "diagnostic":
        return (
          <DiagnosticTool
            form={form}
            setForm={setForm}
            result={result}
            loading={loading}
            downloading={downloading}
            err={err}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            handleDownload={handleDownload}
            handleClear={handleClear}
            validate={validate}
            language={language}
            setLanguage={setLanguage}
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
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors" dir="ltr">
      <Navigation
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      <main>
        <ErrorBoundary>{renderSection()}</ErrorBoundary>
      </main>

      <Footer onNavigate={setCurrentSection} t={t} />
    </div>
  );
}
