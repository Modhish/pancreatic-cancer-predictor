import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Stethoscope, SunMedium, X } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../translations";

export interface NavigationProps {
  language: string;
  setLanguage: (lang: string) => void;
  theme: "light" | "dark" | "system";
  setTheme: (mode: "light" | "dark" | "system") => void;
  t: (key: string) => string;
  currentSection: string;
  onNavigate: (section: string) => void;
  isAuthenticated: boolean;
  userName?: string;
  userRole?: string;
  canAccessDashboard: boolean;
  onSignOut: () => void;
}

function Navigation({
  language,
  setLanguage,
  theme,
  setTheme,
  t,
  currentSection,
  onNavigate,
  isAuthenticated,
  userName,
  userRole,
  canAccessDashboard,
  onSignOut,
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
    ...(isAuthenticated
      ? [
          { id: "profile", label: t("nav_profile") },
          ...(canAccessDashboard
            ? [{ id: "dashboard", label: t("nav_dashboard") }]
            : []),
        ]
      : [
          { id: "signin", label: t("nav_signin") },
          { id: "signup", label: t("nav_signup") },
        ]),
  ];
  const activeLangIndex = Math.max(
    0,
    SUPPORTED_LANGUAGES.findIndex((item) => item.value === language),
  );
  const langSegmentWidth = 100 / SUPPORTED_LANGUAGES.length;
  const langSoundRef = useRef<HTMLAudioElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userInitials = useMemo(() => {
    if (!userName) {
      return "AI";
    }
    return (
      userName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "AI"
    );
  }, [userName]);

  const playLangSound = () => {
    try {
      if (!langSoundRef.current) {
        langSoundRef.current = new Audio(
          "data:audio/wav;base64,UklGRlYAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YSgAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA=",
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
    <div className="sticky top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6">
      <motion.nav
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="nav-island relative mx-auto max-w-[1800px] overflow-hidden rounded-[28px]"
      >
        <div className="nav-aurora pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80" />

        <div className="relative flex items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-5">
          <motion.button
            type="button"
            onClick={() => handleNavigate("home")}
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.985 }}
            className="flex min-w-0 items-center gap-3 rounded-[22px] border border-white/15 bg-[color-mix(in_srgb,var(--surface)_42%,transparent)] px-3 py-2 text-left shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_88%,white_12%),color-mix(in_srgb,var(--accent-2)_32%,var(--accent)_68%))] shadow-[0_16px_34px_color-mix(in_srgb,var(--accent)_36%,transparent)]">
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.42),transparent_48%)]" />
              <Stethoscope className="relative h-5 w-5 text-white" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <h1 className="font-display text-[1.05rem] font-bold tracking-[-0.03em] text-[var(--text)]">
                DiagnoAI
              </h1>
              <p className="mt-0.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">
                <span className="glow-dot inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
                Pancreas Diagnostic
              </p>
            </div>
          </motion.button>

          <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
            <div className="nav-segment hide-scrollbar flex w-full max-w-4xl items-center gap-1 overflow-x-auto rounded-[24px] p-1.5">
              {navItems.map((item) => {
                const active = currentSection === item.id;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.985 }}
                    aria-current={active ? "page" : undefined}
                    className={`relative min-w-max flex-1 rounded-[18px] px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "text-[var(--text)]"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="diagnoai-nav-active"
                        className="absolute inset-0 rounded-[18px] border border-white/25 bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] shadow-[0_10px_28px_rgba(15,23,42,0.12)]"
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 28,
                        }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && userName && (
              <div className="hidden items-center gap-3 rounded-[22px] border border-white/15 bg-[color-mix(in_srgb,var(--surface)_46%,transparent)] px-3 py-2 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl xl:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_72%,white_28%),color-mix(in_srgb,var(--surface)_68%,transparent))] text-sm font-bold text-[var(--text)]">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="max-w-[160px] truncate text-sm font-semibold text-[var(--text)]">
                    {userName}
                  </p>
                  {userRole && (
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                      {userRole}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-full border border-white/20 bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[color-mix(in_srgb,var(--accent)_45%,white_20%)] hover:text-[var(--accent)]"
                >
                  {t("nav_signout")}
                </button>
              </div>
            )}

            <div
              className="nav-segment hidden items-center rounded-[20px] p-1 md:flex"
              role="group"
              aria-label={t("theme_label")}
            >
              {themeOptions.map(({ value, label, icon: Icon }) => {
                const active = theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    aria-pressed={active}
                    className={`rounded-2xl px-3 py-2 transition ${
                      active
                        ? "bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] text-[var(--text)] shadow-[0_10px_22px_rgba(15,23,42,0.12)]"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="nav-segment relative hidden items-center overflow-hidden rounded-[20px] p-1 md:flex">
              <span
                className="absolute top-1 bottom-1 rounded-2xl bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] shadow-[0_10px_22px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out"
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
                    type="button"
                    onClick={() => {
                      setLanguage(value);
                      playLangSound();
                    }}
                    className={`relative rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "text-[var(--text)]"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
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
              className="nav-segment inline-flex items-center justify-center rounded-[20px] p-2.5 text-[var(--text)] md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden">
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 28, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="nav-island fixed inset-y-3 right-3 z-[60] flex w-[88vw] max-w-[340px] flex-col overflow-hidden rounded-[28px]"
            >
              <div className="nav-aurora pointer-events-none absolute inset-0" />
              <div className="relative flex h-full flex-col gap-6 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
                      {t("footer_navigation")}
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold text-[var(--text)]">
                      DiagnoAI
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    className="nav-segment rounded-2xl p-2 text-[var(--text)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {navItems.map((item) => {
                    const active = currentSection === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.id)}
                        whileTap={{ scale: 0.985 }}
                        className={`w-full rounded-[22px] border px-4 py-3 text-left text-sm font-semibold transition ${
                          active
                            ? "border-white/20 bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] text-[var(--text)]"
                            : "border-transparent bg-[color-mix(in_srgb,var(--surface)_42%,transparent)] text-[var(--muted)] hover:text-[var(--text)]"
                        }`}
                      >
                        {item.label}
                      </motion.button>
                    );
                  })}
                </div>

                {isAuthenticated && (
                  <div className="space-y-3 rounded-[24px] border border-white/15 bg-[color-mix(in_srgb,var(--surface)_46%,transparent)] p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_72%,white_28%),color-mix(in_srgb,var(--surface)_68%,transparent))] font-bold text-[var(--text)]">
                        {userInitials}
                      </div>
                      <div className="min-w-0">
                        {userName && (
                          <p className="truncate text-sm font-semibold text-[var(--text)]">
                            {userName}
                          </p>
                        )}
                        {userRole && (
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                            {userRole}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSignOut();
                        setMobileOpen(false);
                      }}
                      className="w-full rounded-[20px] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_92%,white_8%),color-mix(in_srgb,var(--accent-2)_18%,var(--accent)_82%))] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
                    >
                      {t("nav_signout")}
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
                    {t("theme_label")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {themeOptions.map(({ value, label, icon: Icon }) => {
                      const active = theme === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTheme(value)}
                          className={`rounded-[20px] px-4 py-3 text-left text-sm font-semibold transition ${
                            active
                              ? "bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] text-[var(--text)]"
                              : "bg-[color-mix(in_srgb,var(--surface)_42%,transparent)] text-[var(--muted)] hover:text-[var(--text)]"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
                    {t("language")}
                  </p>
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
                          className={`rounded-[20px] px-4 py-3 text-sm font-semibold transition ${
                            active
                              ? "bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] text-[var(--text)]"
                              : "bg-[color-mix(in_srgb,var(--surface)_42%,transparent)] text-[var(--muted)] hover:text-[var(--text)]"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Navigation;
