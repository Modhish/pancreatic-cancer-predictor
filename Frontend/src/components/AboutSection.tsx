import React from "react";

export interface AboutSectionProps {
  t: (key: string) => string;
}

function AboutSection({ t }: AboutSectionProps): JSX.Element {
  return (
    <section
      id="about"
      className="py-16"
      style={{ scrollMarginTop: "5rem" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[var(--text)] mb-3">
            {t("about_title")}
          </h1>
          <p className="text-[var(--muted)] max-w-3xl mx-auto">
            {t("about_subtitle")}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] px-6 py-10 text-center shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:px-10 sm:py-12">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_top,rgba(29,185,84,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(181,140,255,0.18),transparent_60%)]" />
          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-2 text-[0.65rem] uppercase tracking-[0.4em] text-[var(--muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
              {t("home_hero_kicker")}
            </div>
            <div className="mx-auto h-1 w-24 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-2))]" />
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text)]">
              {t("about_mission_title")}
            </h2>
            <p className="text-[var(--muted)] text-base md:text-lg">
              {t("about_mission_p1")}
            </p>
            <p className="text-[var(--muted)] text-base md:text-lg">
              {t("about_mission_p2")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
