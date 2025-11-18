import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, Brain, CheckCircle2, AlertTriangle, Gauge, Loader2, ShieldCheck,
  Stethoscope, Users, Award, BarChart3, ScatterChart, Menu, X, ArrowRight, 
  Heart, Microscope, Zap, Lock, FileText, Phone, Mail, MapPin,
  ChevronDown, ExternalLink, Star, TrendingUp, Clock, Home
} from "lucide-react";
import i18n, { createTranslator, SUPPORTED_LANGUAGES } from "../translations";
import { RANGES } from "../constants/ranges";
import Navigation from "./Navigation";
import HomeSection from "./HomeSection";
import AboutSection from "./AboutSection";
import FeaturesSection from "./FeaturesSection";
import Footer from "./Footer";
import ErrorBoundary from "./ErrorBoundary";
import DiagnosticTool from "./DiagnosticTool";

// Configure frontend i18n once
i18n.configure({
  locales: SUPPORTED_LANGUAGES.map(l => l.value),
  defaultLocale: 'en',
});

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const defaultForm = {
  wbc: "5.8",
  rbc: "4.5",
  plt: "220",
  hgb: "135",
  hct: "42",
  mpv: "9.5",
  pdw: "14",
  mono: "0.5",
  baso_abs: "0.03",
  baso_pct: "0.8",
  glucose: "5.2",
  act: "28",
  bilirubin: "12",
};

  lines.forEach((line) => {
    if (headingPattern.test(line)) {
      pushCurrent();
      current = { title: line, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  });
  pushCurrent();

  if (!sections.length) {
    return null;
  }

  const parsedSections = [];
  let footer = null;

  sections.forEach((section) => {
    const bullets = [];
    const paragraphs = [];

    section.lines.forEach((contentLine) => {
      if (bulletPattern.test(contentLine)) {
        bullets.push(contentLine.replace(bulletPattern, '').trim());
      } else {
        paragraphs.push(contentLine);
      }
    });

    const normalizedTitle = section.title.trim();
    if (footerMarkers.some((marker) => normalizedTitle.includes(marker))) {
      const footerText = [...paragraphs, ...bullets].join(' ');
      footer = {
        title: normalizedTitle,
        text: footerText,
      };
    } else {
      parsedSections.push({
        title: normalizedTitle,
        bullets,
        paragraphs,
      });
    }
  });

  return {
    header,
    subtitle,
    sections: parsedSections,
    footer,
  };
};

export default function App() {
  const [currentSection, setCurrentSection] = useState('home');
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientType, setClientType] = useState('patient');
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language');
      return saved === 'ru' ? 'ru' : 'en';
    }
    return 'en';
  });
  // AI commentary language now follows page language; no separate state
  const [analysisCache, setAnalysisCache] = useState({});
  const [analysisRefreshing, setAnalysisRefreshing] = useState(false);
  const [showWaterfallHelp, setShowWaterfallHelp] = useState(false);
  const [showBarHelp, setShowBarHelp] = useState(false);
  const [showBeeswarmHelp, setShowBeeswarmHelp] = useState(false);

  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
    // keep global i18n locale in sync
    try { i18n.setLocale(language); } catch {}
  }, [language]);

  // No separate analysis language; commentary follows page language

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const validate = useMemo(() => {
    const fields = Object.entries(form);
    const errors = [];
    for (const [key, val] of fields) {
      if (val === "" || Number.isNaN(Number(val))) {
        errors.push(`${key.toUpperCase()}: invalid number`);
        continue;
      }
      const num = Number(val);
      const range = RANGES[key];
      if (range && (num < range[0] || num > range[1])) {
        errors.push(`${key.toUpperCase()}: ${num} outside normal range (${range[0]}-${range[1]})`);
      }
    }
    return {
      ok: errors.length === 0,
      message: errors.join("; "),
    };
  }, [form]);

  const handleSubmit = async () => {
    setErr("");
    if (!validate.ok) {
      setErr(validate.message);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          client_type: clientType,
          language,
        }),
      });
      if (!res.ok) {
        // Try to extract backend validation error for display
        let msg = `${res.status} ${res.statusText}`;
        try {
          const errJson = await res.json();
          if (errJson?.validation_errors) {
            msg = errJson.validation_errors.join("; ");
          } else if (errJson?.error) {
            msg = errJson.error;
          }
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      const aiExplanation = data.ai_explanation || data.aiExplanation || "";
      setResult({ ...data, ai_explanation: aiExplanation });
      const cacheKey = `${language}:${clientType}`;
      setAnalysisCache({ [cacheKey]: aiExplanation });
    } catch (e) {
      setErr(`Failed to reach the server. Make sure Flask is running on ${API_BASE} (error: ${e.message})`);
    } finally {
      setLoading(false);
    }
  };

  // Removed: separate analysis language toggle/handler; commentary follows page language

  const handleDownload = async () => {
    if (!result) {
      return;
    }

    setDownloading(true);
    try {
      const patientPayload = result.patient_values ? { ...result.patient_values } : { ...form };
      const shapPayload = result.shap_values || result.shapValues || [];
      const aiExplanation = activeAiExplanation;

      const response = await fetch(`${API_BASE}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patientPayload,
          result: {
            ...result,
            shap_values: shapPayload,
            ai_explanation: aiExplanation,
            language: language,
          },
          language: language,
        })
      });

      if (!response.ok) {
        let message = `${response.status} ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson?.validation_errors) {
            message = errJson.validation_errors.join("; ");
          } else if (errJson?.error) {
            message = errJson.error;
          }
        } catch {}
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `diagnoai-pancreas-report-${timestamp}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setErr(`Failed to generate PDF report: ${downloadError.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleClear = () => {
    setForm(Object.keys(defaultForm).reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
    setResult(null);
    setErr("");
    setAnalysisCache({});
    // commentary language follows page language
  };

  const baseAiExplanation = result?.ai_explanation || result?.aiExplanation || "";
  const activeAiExplanation = analysisCache[`${language}:${clientType}`] ?? baseAiExplanation;

  // Regenerate commentary when audience changes (if we already have a result )}
  useEffect(() => {
    const regenerateForAudience = async () => {
      if (!result) return;
      const lang = language;
      const key = `${lang}:${clientType}`;
      const cached = analysisCache[key];
      // For Russian, always regenerate to avoid stale/corrupted text
      if (!(String(lang).toLowerCase().startsWith('ru'))) {
        if (cached !== undefined) {
          setResult((prev) => (prev ? { ...prev, ai_explanation: cached, language: lang } : prev));
          return;
        }
      }
      setAnalysisRefreshing(true);
      try {
        const response = await fetch(`${API_BASE}/api/commentary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis: result,
            patient_values: result.patient_values,
            shap_values: result.shap_values || result.shapValues || [],
            language: lang,
            client_type: clientType,
          }),
        });
        if (!response.ok) {
          let msg = `${response.status} ${response.statusText}`;
          try {
            const errJson = await response.json();
            if (errJson?.error) msg = errJson.error;
          } catch {}
          throw new Error(msg);
        }
        const data = await response.json();
        const newText = data.ai_explanation || data.aiExplanation || "";
        setAnalysisCache((prev) => ({ ...prev, [key]: newText }));
        setResult((prev) =>
          prev
            ? {
                ...prev,
                ai_explanation: newText,
                language: data.language || lang,
                risk_level: data.risk_level || prev.risk_level,
              }
            : prev,
        );
      } catch (e) {
        setErr(`Failed to refresh commentary: ${e.message}`);
      } finally {
        setAnalysisRefreshing(false);
      }
    };

    if (result) {
      regenerateForAudience();
    }
  }, [language, clientType]);

  const renderSection = () => {
    switch (currentSection) {
      case 'diagnostic':
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
      case 'about':
        return <AboutSection t={t} />;
      case 'features':
        return <FeaturesSection t={t} />;
      default:
        return (
          <HomeSection 
            onStartDiagnosis={() => setCurrentSection('diagnostic')}
            onLearnMore={() => setCurrentSection('features')}
            t={t}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors" dir="ltr">
      {/* Navigation */}
      <Navigation 
        currentSection={currentSection} 
        setCurrentSection={setCurrentSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      
      {/* Main Content */}
      <main>
        <ErrorBoundary>
          {renderSection()}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer onNavigate={setCurrentSection} t={t} />
    </div>
  );
}

// DiagnosticTool imported from components
import DiagnosticTool from "./DiagnosticTool";
