import React, { useEffect, useState } from "react";

const SECTIONS = [
  { id: "home", labelKey: "nav_home", index: "001" },
  { id: "about", labelKey: "nav_about", index: "002" },
  { id: "features", labelKey: "nav_features", index: "003" },
  { id: "diagnostic", labelKey: "nav_diag", index: "004" },
] as const;

export interface ScrollProgressProps {
  onNavigate: (section: string) => void;
  t: (key: string) => string;
}

export default function ScrollProgress({
  onNavigate,
  t,
}: ScrollProgressProps): JSX.Element {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const elements = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter(Boolean) as HTMLElement[];

    if (!elements.length) {
      return;
    }

    const ratioById = new Map<string, number>();
    let raf = 0;

    const updateActive = () => {
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      raf = window.requestAnimationFrame(() => {
        let bestId = SECTIONS[0].id;
        let bestRatio = -1;
        SECTIONS.forEach((section) => {
          const ratio = ratioById.get(section.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = section.id;
          }
        });
        setActiveSection((prev) => (prev === bestId ? prev : bestId));
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratioById.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        });
        updateActive();
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    updateActive();

    return () => {
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-auto fixed left-5 top-1/2 z-40 flex -translate-y-1/2 flex-col items-start gap-3 text-[10px] uppercase tracking-[0.4em] text-[var(--muted)]">
      {SECTIONS.map((section) => {
        const active = activeSection === section.id;
        const label = t(section.labelKey);
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onNavigate(section.id)}
            aria-label={label}
            className="group flex items-center gap-3"
          >
            <span
              className={`h-[2px] rounded-full bg-[var(--border)] transition-all duration-300 ${
                active
                  ? "w-12 bg-[var(--text)] shadow-[0_0_12px_rgba(29,185,84,0.25)]"
                  : "w-7 group-hover:w-10 group-hover:bg-[var(--text)]"
              }`}
            />
            <span
              className={`text-[9px] font-semibold tracking-[0.4em] transition ${
                active
                  ? "text-[var(--text)]"
                  : "text-[var(--muted)] opacity-60 group-hover:opacity-100"
              }`}
            >
              {section.index}
            </span>
          </button>
        );
      })}
    </div>
  );
}
