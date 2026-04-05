import React, { useEffect, useState } from "react";
import Navigation from "./Navigation";
import HomeSection from "./HomeSection";
import AboutSection from "./AboutSection";
import FeaturesSection from "./FeaturesSection";
import Footer from "./Footer";
import ErrorBoundary from "./ErrorBoundary";
import DiagnosticTool from "./DiagnosticTool";
import ParticleBackground from "./ParticleBackground";
import ScrollProgress from "./ScrollProgress";
import DisclaimerAgreement from "./DisclaimerAgreement";
import useAppState from "../hooks/useAppState";
import useAuth from "../hooks/useAuth";
import AuthPage from "./AuthPage";
import AuthRequiredPage from "./AuthRequiredPage";
import ProfilePage from "./ProfilePage";
import ResearchDashboardPage from "./ResearchDashboardPage";

type ThemeMode = "light" | "dark" | "system";
const DISCLAIMER_STORAGE_KEY = "diagnoai.disclaimer.accepted";

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export default function App(): JSX.Element {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(DISCLAIMER_STORAGE_KEY) === "true";
  });
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
    token,
    user,
    loading: authLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    authorizedFetch,
  } = useAuth();

  const {
    currentSection,
    setCurrentSection,
    form,
    subjectName,
    setSubjectName,
    result,
    loading,
    downloading,
    err,
    clientType,
    setClientType,
    language,
    setLanguage,
    analysisRefreshing,
    audienceLocked,
    availableAudiences,
    t,
    validate,
    activeAiExplanation,
    handleChange,
    handleSubmit,
    handleDownload,
    handleClear,
  } = useAppState({
    authToken: token,
    currentUser: user,
  });

  const canAccessResearchDashboard =
    user?.role === "researcher" || user?.role === "admin";
  const authPendingSession = Boolean(token) && authLoading && !user;
  const isMarketingView =
    currentSection === "home" ||
    currentSection === "about" ||
    currentSection === "features";

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

  useEffect(() => {
    if (
      isAuthenticated &&
      (currentSection === "signin" || currentSection === "signup")
    ) {
      setCurrentSection(
        canAccessResearchDashboard ? "dashboard" : "profile",
      );
    }
  }, [
    canAccessResearchDashboard,
    currentSection,
    isAuthenticated,
    setCurrentSection,
  ]);

  const acceptDisclaimer = () => {
    setHasAcceptedDisclaimer(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
    }
  };

  const handlePostAuthRoute = (role?: string) => {
    setCurrentSection(
      role === "researcher" || role === "admin" ? "dashboard" : "profile",
    );
  };

  const handleSignIn = async (payload: {
    email: string;
    password: string;
  }): Promise<void> => {
    const signedInUser = await signIn(payload);
    handlePostAuthRoute(signedInUser.role);
  };

  const handleSignUp = async (payload: {
    full_name: string;
    email: string;
    password: string;
    role: "patient" | "doctor" | "researcher" | "admin";
    organization?: string;
  }): Promise<void> => {
    const signedUpUser = await signUp(payload);
    handlePostAuthRoute(signedUpUser.role);
  };

  const handleSignOut = () => {
    signOut();
    setCurrentSection("home");
  };

  const renderLoadingState = (
    title: string,
    description: string,
    sectionId?: string,
  ): JSX.Element => (
    <section
      id={sectionId}
      className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-8"
    >
      <div className="card-sleek rounded-[2rem] p-8 text-center sm:p-10">
        <h1 className="font-display text-3xl font-bold text-[var(--text)]">
          {title}
        </h1>
        <p className="mt-4 text-base leading-8 text-[var(--muted)]">
          {description}
        </p>
      </div>
    </section>
  );

  if (!hasAcceptedDisclaimer) {
    return (
      <>
        <ParticleBackground />
        <div
          className="app-shell min-h-screen text-[var(--text)] transition-colors"
          dir="ltr"
          lang={language}
        >
          <DisclaimerAgreement
            onAccept={acceptDisclaimer}
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            setTheme={setTheme}
            t={t}
          />
        </div>
      </>
    );
  }

  const renderMainContent = (): JSX.Element => {
    if (currentSection === "signin") {
      if (authPendingSession) {
        return renderLoadingState(
          "Checking your session.",
          "Please wait while DiagnoAI restores your account.",
          "signin",
        );
      }
      return (
        <AuthPage
          mode="signin"
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onSwitchMode={(mode) => setCurrentSection(mode)}
        />
      );
    }

    if (currentSection === "signup") {
      if (authPendingSession) {
        return renderLoadingState(
          "Checking your session.",
          "Please wait while DiagnoAI restores your account.",
          "signup",
        );
      }
      return (
        <AuthPage
          mode="signup"
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onSwitchMode={(mode) => setCurrentSection(mode)}
        />
      );
    }

    if (currentSection === "diagnostic") {
      if (authPendingSession) {
        return renderLoadingState(
          "Loading diagnostic workspace.",
          "Your saved account is being restored before clinical analysis tools are unlocked.",
          "diagnostic",
        );
      }
      if (!isAuthenticated || !user) {
        return (
          <section id="diagnostic">
            <AuthRequiredPage
              title="Sign in to use the diagnostic workspace."
              description="Analyses are now tied to real user accounts so patient history, doctor-signed reports, and researcher studies stay separated by role."
              onSignIn={() => setCurrentSection("signin")}
              onSignUp={() => setCurrentSection("signup")}
            />
          </section>
        );
      }
      return (
        <DiagnosticTool
          form={form}
          subjectName={subjectName}
          setSubjectName={setSubjectName}
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
          audienceLocked={audienceLocked}
          availableAudiences={availableAudiences}
          t={t}
        />
      );
    }

    if (currentSection === "profile") {
      if (authPendingSession) {
        return renderLoadingState(
          "Loading your profile.",
          "Please wait while account history is being restored.",
          "profile",
        );
      }
      if (!isAuthenticated || !user) {
        return (
          <section id="profile">
            <AuthRequiredPage
              title="Sign in to view your profile and history."
              description="Saved analysis history, role information, and patient trend charts are available only inside an authenticated DiagnoAI account."
              onSignIn={() => setCurrentSection("signin")}
              onSignUp={() => setCurrentSection("signup")}
            />
          </section>
        );
      }
      return (
        <ProfilePage
          user={user}
          authorizedFetch={authorizedFetch}
          onNavigateToDiagnostic={() => setCurrentSection("diagnostic")}
          language={language}
          t={t}
        />
      );
    }

    if (currentSection === "dashboard") {
      if (authPendingSession) {
        return renderLoadingState(
          "Loading researcher dashboard.",
          "Please wait while DiagnoAI restores your research workspace.",
          "dashboard",
        );
      }
      if (!isAuthenticated || !user) {
        return (
          <section id="dashboard">
            <AuthRequiredPage
              title="Sign in to access the researcher dashboard."
              description="Research analytics use stored system-wide analyses, so access is limited to authenticated accounts with the proper role."
              onSignIn={() => setCurrentSection("signin")}
              onSignUp={() => setCurrentSection("signup")}
            />
          </section>
        );
      }
      if (!canAccessResearchDashboard) {
        return renderLoadingState(
          "Research dashboard is limited to researcher accounts.",
          "Patients and doctors can still run analyses and review personal history from the profile page.",
          "dashboard",
        );
      }
      return (
        <ResearchDashboardPage
          user={user}
          authorizedFetch={authorizedFetch}
        />
      );
    }

    return (
      <>
        <HomeSection
          onStartDiagnosis={() => setCurrentSection("diagnostic")}
          onLearnMore={() => setCurrentSection("features")}
          t={t}
        />
        <AboutSection t={t} />
        <FeaturesSection t={t} />
      </>
    );
  };

  return (
    <>
      <ParticleBackground />
      <div
        className="app-shell min-h-screen text-[var(--text)] transition-colors"
        dir="ltr"
        lang={language}
      >
        <Navigation
          currentSection={currentSection}
          onNavigate={setCurrentSection}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          isAuthenticated={isAuthenticated}
          userName={user?.full_name}
          userRole={user?.role}
          canAccessDashboard={canAccessResearchDashboard}
          onSignOut={handleSignOut}
          t={t}
        />
        {isMarketingView && (
          <ScrollProgress onNavigate={setCurrentSection} t={t} />
        )}

        <main>
          <ErrorBoundary>{renderMainContent()}</ErrorBoundary>
        </main>

        {isMarketingView && (
          <Footer onNavigate={setCurrentSection} t={t} />
        )}
      </div>
    </>
  );
}
