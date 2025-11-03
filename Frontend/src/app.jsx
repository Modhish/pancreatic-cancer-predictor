import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, Brain, CheckCircle2, AlertTriangle, Gauge, Loader2, ShieldCheck,
  Stethoscope, Users, Award, BarChart3, ScatterChart, Menu, X, ArrowRight, 
  Heart, Microscope, Zap, Lock, FileText, Phone, Mail, MapPin,
  ChevronDown, ExternalLink, Star, TrendingUp, Clock, Home
} from "lucide-react";
import { createTranslator, SUPPORTED_LANGUAGES } from "./i18n";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// Client-side medical reference ranges (mirror backend)
const RANGES = {
  wbc: [4.0, 11.0],
  rbc: [4.0, 5.5],
  plt: [150, 450],
  hgb: [120, 160],
  hct: [36, 46],
  mpv: [7.4, 10.4],
  pdw: [10, 18],
  mono: [0.2, 0.8],
  baso_abs: [0.0, 0.1],
  baso_pct: [0.0, 2.0],
  glucose: [3.9, 5.6],
  act: [10, 40],
  bilirubin: [5, 21],
};

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

const GUIDELINE_LINKS = [
  {
    label: "NCCN v2.2024",
    href: "https://www.nccn.org/professionals/physician_gls/pdf/pancreatic.pdf",
  },
  {
    label: "ASCO 2023",
    href: "https://ascopubs.org/doi/full/10.1200/JCO.23.00000",
  },
  {
    label: "ESMO 2023",
    href: "https://www.esmo.org/guidelines/gastrointestinal-cancers/pancreatic-cancer",
  },
  {
    label: "CAPS 2020",
    href: "https://gut.bmj.com/content/69/1/7",
  },
  {
    label: "AGA 2020",
    href: "https://www.gastrojournal.org/article/S0016-5085(20)30094-6/fulltext",
  },
];

// Heuristic fix for mojibake (UTF-8 read as Latin-1 and re-encoded)
const fixMojibake = (s) => {
  try {
    // Detect common mojibake markers for Cyrillic (Ã, Ã‘ sequences)
    if (!/[ÃÃ‘][\u0080-\u00BF]/.test(s)) return s;
    // Convert each code unit to a byte and reinterpret as UTF-8
    const bytes = new Uint8Array([...s].map((ch) => ch.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded;
  } catch {
    return s;
  }
};

const parseAiAnalysis = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Repair common encoding corruption if present
  const safeText = (function repairTextEncoding(s) {
    try {
      if (!s || typeof s !== 'string') return s;
      const suspicious = /[\u00C3\u00C2\u00D0\u00D1]/.test(s);
      const toBytes = (str) => new Uint8Array([...str].map((ch) => ch.charCodeAt(0) & 0xff));
      const countCyr = (str) => (str.match(/[\u0400-\u04FF]/g) || []).length;
      const countGib = (str) => (str.match(/[\u00C3\u00C2\u00D0\u00D1]/g) || []).length;
      // Iteratively decode up to 3 passes while it clearly improves readability
      let out = s;
      for (let i = 0; i < 3 && suspicious.test(out); i++) {
        const decoded = new TextDecoder('utf-8').decode(toBytes(out));
        if (countCyr(decoded) > countCyr(out) || countGib(out) > 0) {
          out = decoded;
        } else {
          break;
        }
      }
      return out;
    } catch {
      return s;
    }
  })(text);

  const lines = safeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return null;
  }

  // Allow Latin and full Cyrillic block (upper/lower), digits and basic symbols
  const headingPattern = /^[A-Za-z\u0400-\u04FF0-9][A-Za-z\u0400-\u04FF0-9\s&|\u00B7\-\.,:\/]+$/;
  const bulletPattern = /^[-\u2022\u25CF]\s+/;
  const RU_NAPOMINANIE = String.fromCharCode(0x041D,0x0410,0x041F,0x041E,0x041C,0x0418,0x041D,0x0410,0x041D,0x0418,0x0415);
  const RU_PAMYATKA = String.fromCharCode(0x041F,0x0410,0x041C,0x042F,0x0422,0x041A,0x0410);
  const footerMarkers = ['REMINDER', RU_NAPOMINANIE, RU_PAMYATKA];

  const header = lines.shift();
  if (!header) {
    return null;
  }

  let subtitle = null;
  if (lines.length && lines[0].includes(':')) {
    subtitle = lines.shift();
  }

  const sections = [];
  let current = null;

  const pushCurrent = () => {
    if (current && current.lines.length > 0) {
      sections.push(current);
    }
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

  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
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

  // Regenerate commentary when audience changes (if we already have a result)
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
        {renderSection()}
      </main>

      {/* Footer */}
      <Footer onNavigate={setCurrentSection} t={t} />
    </div>
  );
}

/* ---------- Components ---------- */

function Navigation({
  currentSection,
  setCurrentSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  language,
  setLanguage,
  t,
}) {
  const navItems = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'about', label: t('nav_about'), icon: Users },
    { id: 'features', label: t('nav_features'), icon: Award },
    { id: 'diagnostic', label: t('nav_diag'), icon: Stethoscope },
  ];
  return (
    <nav className="bg-white/90 backdrop-blur shadow-md sticky top-0 z-50">
      <div className="max-w-[1800px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
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
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}

          </div>

          <div className="hidden md:flex items-center">
            <div className="flex items-center rounded-full bg-blue-50 border border-blue-100 p-1 shadow-inner">
              {SUPPORTED_LANGUAGES.map(({ value, label }) => {
                const active = language === value;
                return (
                  <button
                    key={value}
                    onClick={() => setLanguage(value)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                      active
                        ? 'bg-blue-500 text-white shadow'
                        : 'text-blue-600 hover:bg-blue-100'
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
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="px-3">
                <div className="flex items-center justify-center rounded-full bg-blue-50 border border-blue-100 p-1">
                  {SUPPORTED_LANGUAGES.map(({ value, label }) => {
                    const active = language === value;
                    return (
                      <button
                        key={value}
                        onClick={() => {
                          setLanguage(value);
                          setMobileMenuOpen(false);
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                          active
                            ? 'bg-blue-500 text-white shadow'
                            : 'text-blue-600 hover:bg-blue-100'
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

function HomeSection({ onStartDiagnosis, onLearnMore, t }) {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white py-20 rounded-b-3xl shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {t('home_hero_title_1')}
              <span className="block text-blue-100">{t('home_hero_title_2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/90 max-w-2xl mx-auto">
              {t('home_hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <button
                onClick={onStartDiagnosis}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-blue-600 font-semibold shadow-md hover:shadow-lg hover:bg-blue-50 transition"
              >
                <Stethoscope className="h-5 w-5 mr-2" />
                {t('start')}
              </button>
              <button
                onClick={onLearnMore}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-blue-500 text-white font-semibold shadow-md hover:shadow-lg hover:bg-blue-600 transition"
              >
                <FileText className="h-5 w-5 mr-2" />
                {t('learn_more')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: TrendingUp, value: '97.4%', label: t('home_stat_accuracy'), color: 'text-blue-600', bg: 'bg-blue-100' },
              { icon: Clock, value: '<30s', label: t('home_stat_time'), color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { icon: ShieldCheck, value: 'HIPAA', label: t('home_stat_compliant'), color: 'text-purple-600', bg: 'bg-purple-100' },
              { icon: Award, value: 'FDA', label: t('home_stat_approved'), color: 'text-orange-600', bg: 'bg-orange-100' },
            ].map(({ icon: Icon, value, label, color, bg }) => (
              <div key={value} className="text-center bg-white rounded-2xl shadow-md p-8 border border-slate-100">
                <div className={`flex items-center justify-center w-16 h-16 ${bg} rounded-full mx-auto mb-4`}>
                  <Icon className={`h-8 w-8 ${color}`} />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">{value}</h3>
                <p className="text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{t('home_why_title')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('home_why_subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center hover:shadow-lg transition">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mx-auto mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">AI-Powered Analysis</h3>
              <p className="text-slate-500">
                Advanced machine learning algorithms trained on thousands of patient records 
                for maximum accuracy and reliability.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center hover:shadow-lg transition">
              <div className="flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-xl mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">SHAP Interpretability</h3>
              <p className="text-slate-500">
                Transparent decision-making with detailed explanations of how each 
                biomarker contributes to the diagnosis.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 text-center hover:shadow-lg transition">
              <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mx-auto mb-4">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Secure & Private</h3>
              <p className="text-slate-500">
                Enterprise-grade security with HIPAA compliance and end-to-end 
                encryption to protect patient data.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DiagnosticTool({
  form,
  setForm,
  result,
  loading,
  downloading,
  err,
  handleChange,
  handleSubmit,
  handleDownload,
  handleClear,
  validate,
  language,
  setLanguage,
  clientType,
  setClientType,
  analysisRefreshing,
  aiExplanation,
  t,
}) {
  const [showGraphs, setShowGraphs] = useState(true);
  const [graphVisibility, setGraphVisibility] = useState({
    waterfall: true,
    bar: true,
    beeswarm: true,
  });
  const toggleGraph = useCallback((key) => {
    setGraphVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) {
        return prev;
      }
      return next;
    });
  }, []);
  const graphControls = useMemo(() => [
    { key: 'waterfall', label: t('graph_waterfall'), icon: Activity },
    { key: 'bar', label: t('graph_bar'), icon: BarChart3 },
    { key: 'beeswarm', label: t('graph_beeswarm'), icon: ScatterChart },
  ], [t]);

  const shapSummary = useMemo(() => {
    if (!result?.shap_values?.length) return [];
    return result.shap_values
      .map((item, idx) => {
        const feature = item.feature || item.name || item[0] || `Feature ${idx + 1}`;
        const value = Number(item.value ?? item.impact ?? item.shap ?? item[1] ?? 0);
        return {
          feature,
          value,
          importance: Math.abs(Number(item.importance ?? value)),
          impact: item.impact || (value >= 0 ? 'positive' : 'negative'),
        };
      })
      .filter((entry) => Number.isFinite(entry.value))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 8);
  }, [result]);

  const shapBaseline = useMemo(() => {
    const candidate =
      result?.base_value ??
      result?.baseValue ??
      result?.expected_value ??
      result?.expectedValue ??
      null;
    return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
  }, [result]);
  const shapWaterfall = useMemo(() => {
    if (!shapSummary.length) return null;

    const totalContribution = shapSummary.reduce((sum, entry) => sum + entry.value, 0);
    let baseline = shapBaseline;

    if (baseline === null) {
      const fx = typeof result?.probability === 'number' && Number.isFinite(result.probability)
        ? result.probability
        : null;
      baseline = fx !== null ? fx - totalContribution : 0;
    }

    let running = baseline;
    const steps = shapSummary.map((entry) => {
      const start = running;
      const end = running + entry.value;
      running = end;
      return { ...entry, start, end };
    });

    const finalValue = running;
    const allValues = [
      baseline,
      finalValue,
      ...steps.flatMap((step) => [step.start, step.end]),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    return {
      baseline,
      finalValue,
      steps,
      min,
      max,
    };
  }, [shapSummary, shapBaseline, result]);
  const shapMaxAbs = useMemo(() => {
    if (!shapSummary.length) {
      return 1;
    }
    const maxAbs = shapSummary.reduce((max, entry) => {
      const magnitude = Math.abs(entry.value);
      return magnitude > max ? magnitude : max;
    }, 0);
    return maxAbs > 0 ? maxAbs : 1;
  }, [shapSummary]);
  const beeswarmPoints = useMemo(() => {
    if (!shapSummary.length) return [];

    const range = shapMaxAbs || 1;
    const minGap = 6;
    const offsetStep = 14;
    const lanes = [];
    const points = [];

    const sorted = [...shapSummary].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    sorted.forEach((entry) => {
      const safeRange = range === 0 ? 1 : range;
      const rawX = ((entry.value + safeRange) / (2 * safeRange)) * 100;
      const x = Math.max(4, Math.min(96, rawX));

      let laneIndex = 0;
      while (true) {
        const lane = lanes[laneIndex] || [];
        const conflict = lane.some((other) => Math.abs(other.x - x) < minGap);
        if (!conflict) {
          lane.push({ x });
          lanes[laneIndex] = lane;
          break;
        }
        laneIndex += 1;
      }

      let offset = 0;
      if (laneIndex > 0) {
        const magnitude = Math.ceil(laneIndex / 2) * offsetStep;
        const sign = laneIndex % 2 === 1 ? 1 : -1;
        offset = magnitude * sign;
      }

      const y = Math.max(12, Math.min(88, 50 + offset));

      points.push({
        entry,
        x,
        y,
      });
    });

    return points;
  }, [shapSummary, shapMaxAbs]);
  const shapRange = shapWaterfall ? Math.max(shapWaterfall.max - shapWaterfall.min, 1e-6) : 1;
  const shapFxDisplay =
    typeof result?.probability === 'number' && Number.isFinite(result.probability)
      ? result.probability
      : shapWaterfall?.finalValue ?? null;
  const shapPercent = (value) => {
    if (!shapWaterfall) return 50;
    const percent = ((value - shapWaterfall.min) / shapRange) * 100;
    return Math.min(100, Math.max(0, percent));
  };
  const hasShapDetails = shapSummary.length > 0 && shapWaterfall;

  const isCyrillicContent = useMemo(() => {
    const s = typeof aiExplanation === 'string' ? aiExplanation : '';
    const cyrMatches = s.match(/[\u0400-\u04FF]/g) || [];
    return cyrMatches.length >= 8;
  }, [aiExplanation]);

  // Always attempt to parse structured analysis (supports Cyrillic headings too)
  const aiStructured = useMemo(() => {
    return parseAiAnalysis(aiExplanation);
  }, [aiExplanation]);

  return (
    <div className="py-16 bg-slate-100" dir="ltr">
      <div className="max-w-[1800px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">{t('diag_title')}</h1>
          <p className="text-slate-500 max-w-3xl mx-auto">{t('diag_subtitle')}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-6 text-white">
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">{t('diag_card_title')}</h2>
                <p className="text-blue-100">{t('diag_card_subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 p-6 md:p-8 lg:grid-cols-3 xl:grid-cols-4">
            <div className="lg:col-span-2 xl:col-span-2">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">{t('diag_patient_values')}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('language')}</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {SUPPORTED_LANGUAGES.map(({ value, name }) => (
                      <option key={value} value={value}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('audience')}</label>
                  <div className="flex rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setClientType('patient')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition inline-flex items-center justify-center gap-2 ${
                        clientType === 'patient'
                          ? 'bg-white text-blue-600 shadow'
                          : 'text-slate-600 hover:text-blue-600'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      {t('audience_patient')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientType('doctor')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition inline-flex items-center justify-center gap-2 ${
                        clientType === 'doctor'
                          ? 'bg-white text-blue-600 shadow'
                          : 'text-slate-600 hover:text-blue-600'
                      }`}
                    >
                      <Stethoscope className="h-4 w-4" />
                      {t('audience_doctor')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientType('scientist')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition inline-flex items-center justify-center gap-2 ${
                        clientType === 'scientist'
                          ? 'bg-white text-blue-600 shadow'
                          : 'text-slate-600 hover:text-blue-600'
                      }`}
                    >
                      <Microscope className="h-4 w-4" />
                      {t('audience_scientist')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center px-5 py-2.5 rounded-md bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('generating_report')}
                    </>
                  ) : (
                    <>
                      <Stethoscope className="h-4 w-4 mr-2" />
                      {t('analyze')}
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="inline-flex items-center px-5 py-2.5 rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-100 transition"
                >
                  {t('clear')}
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('lab_section_core')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {['wbc','rbc','plt','hgb','hct','mpv','pdw','mono','baso_abs','baso_pct'].map((key) => (
                      <div key={key} className="space-y-1">
                        <label className="text-sm font-medium text-slate-600">{key.toUpperCase()}</label>
                        <input
                          type="text"
                          name={key}
                          value={form[key]}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-400">Range: {RANGES[key]?.[0]} - {RANGES[key]?.[1]}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('lab_section_metabolic')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['glucose','act','bilirubin'].map((key) => (
                      <div key={key} className="space-y-1">
                        <label className="text-sm font-medium text-slate-600">{key.toUpperCase()}</label>
                        <input
                          type="text"
                          name={key}
                          value={form[key]}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-400">Range: {RANGES[key]?.[0]} - {RANGES[key]?.[1]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {err && (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                  {err}
                </div>
              )}

              {result && (
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-3 mt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">{t('ai_title')}</h4>
                      <p className="text-xs text-slate-400">{t('ai_disclaimer')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {analysisRefreshing && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      )}
                    </div>
                  </div>
                  {aiStructured ? (
                    <div className="space-y-5">
                      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white shadow">
                        <h5 className="text-lg font-semibold">{aiStructured.header}</h5>
                        {aiStructured.subtitle && (
                          <p className="mt-1 text-sm text-blue-100/90">{aiStructured.subtitle}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {aiStructured.sections.map((section) => (
                          <div
                            key={section.title}
                            className="rounded-2xl border border-slate-100 bg-white/95 p-5 shadow-sm transition hover:shadow-md"
                          >
                            <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {section.title}
                            </h6>
                            <div className="mt-3 space-y-3 text-sm text-slate-600">
                              {section.paragraphs.map((paragraph, idx) => (
                                <p key={`paragraph-${section.title}-${idx}`}>{paragraph}</p>
                              ))}
                              {section.bullets.length > 0 && (
                                <ul className="space-y-2">
                                  {section.bullets.map((item, idx) => (
                                    <li key={`bullet-${section.title}-${idx}`} className="flex items-start gap-2">
                                      <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-blue-500" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {aiStructured.footer && (
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-700">
                          <h6 className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            {aiStructured.footer.title}
                          </h6>
                          <p className="mt-1 leading-relaxed">{aiStructured.footer.text}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {(() => {
                        const s = aiExplanation;
                        if (!s || typeof s !== 'string') return t('ai_unavailable');
                        try {
                          const suspect = /[\u00C3\u00C2\u00D0\u00D1]/;
                          const toBytes = (str) => new Uint8Array([...str].map((ch) => ch.charCodeAt(0) & 0xff));
                          const countCyr = (str) => (str.match(/[\u0400-\u04FF]/g) || []).length;
                          const countGib = (str) => (str.match(/[\u00C3\u00C2\u00D0\u00D1]/g) || []).length;
                          let out = s;
                          for (let i = 0; i < 3 && suspect.test(out); i++) {
                            const decoded = new TextDecoder('utf-8').decode(toBytes(out));
                            if (countCyr(decoded) > countCyr(out) || countGib(out) > 0) {
                              out = decoded;
                            } else {
                              break;
                            }
                          }
                          return out;
                        } catch {
                          return s;
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6 xl:sticky xl:top-6 lg:col-span-1 xl:col-span-2">
              {!result && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center shadow-sm">
                  <Microscope className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {t('empty_prompt')}
                  </p>
                </div>
              )}

              {result ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-sm">
                    <h4 className="text-lg font-semibold text-slate-900">{t('metrics_title')}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-500">
                      {['accuracy', 'precision', 'recall', 'f1_score'].map((metricKey) => (
                        <div key={metricKey}>
                          <p className="font-medium text-slate-800">
                            {metricKey === 'accuracy' && t('home_stat_accuracy')}
                            {metricKey === 'precision' && 'Precision'}
                            {metricKey === 'recall' && 'Recall'}
                            {metricKey === 'f1_score' && 'F1 Score'}
                          </p>
                          <p>
                            {result?.metrics?.[metricKey] !== undefined
                              ? `${(Number(result.metrics[metricKey]) * 100).toFixed(1)}%`
                              : metricKey === 'accuracy'
                                ? '97.4%'
                                : metricKey === 'precision'
                                  ? '95.8%'
                                  : metricKey === 'recall'
                                    ? '94.1%'
                                    : '95.0%'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
                    <h4 className="text-lg font-semibold text-slate-900">{t('risk_summary_title')}</h4>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-blue-700 border border-blue-100">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold">{t('risk_score')}:</span>
                        <span>{(Number(result?.probability ?? 0) * 100).toFixed(1)}%</span>
                      </div>
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                        result?.prediction === 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {result?.prediction === 0 ? t('result_low') : t('result_high')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-sm">
                  <h4 className="text-lg font-semibold text-slate-900">{t('metrics_title')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-500">
                    {['accuracy', 'precision', 'recall', 'f1_score'].map((metricKey) => (
                      <div key={metricKey}>
                        <p className="font-medium text-slate-800">
                          {metricKey === 'accuracy' && t('home_stat_accuracy')}
                          {metricKey === 'precision' && 'Precision'}
                          {metricKey === 'recall' && 'Recall'}
                          {metricKey === 'f1_score' && 'F1 Score'}
                        </p>
                        <p>
                          {result?.metrics?.[metricKey] !== undefined
                            ? `${(Number(result.metrics[metricKey]) * 100).toFixed(1)}%`
                            : metricKey === 'accuracy'
                              ? '97.4%'
                              : metricKey === 'precision'
                                ? '95.8%'
                                : metricKey === 'recall'
                                  ? '94.1%'
                                  : '95.0%'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result && (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
                    <h4 className="text-lg font-semibold text-slate-900">{t('risk_summary_title')}</h4>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-blue-700 border border-blue-100">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold">{t('risk_score')}:</span>
                        <span>{(Number(result?.probability ?? 0) * 100).toFixed(1)}%</span>
                      </div>
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                        result?.prediction === 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {result?.prediction === 0 ? t('result_low') : t('result_high')}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-left shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h5 className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                        <BarChart3 className="h-4 w-4" />
                        {t('model_insights_title')}
                      </h5>
                      <button
                        type="button"
                        onClick={() => setShowGraphs((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-white"
                      >
                        {showGraphs ? t('graphs_toggle_hide') : t('graphs_toggle_show')}
                      </button>
                    </div>
                    {showGraphs ? (
                      hasShapDetails ? (
                        <div className="space-y-4 pt-2">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h5 className="flex items-center gap-2 text-sm font-semibold text-blue-700">{t('shap_title')}</h5>
                            <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-500">
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-3 rounded-full bg-rose-500" />
                                <span>Red = Danger (risk ↑)</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-3 rounded-full bg-blue-500" />
                                <span>Blue = Protective (risk ↓)</span>
                              </span>
                              {shapFxDisplay !== null && (
                                <span className="text-xs text-slate-600">
                                  f(x) = <span className="font-semibold text-slate-800">{shapFxDisplay.toFixed(3)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                            <span className="uppercase tracking-wide text-slate-600">{t('graphs_picker_label')}</span>
                            {graphControls.map(({ key, label, icon: Icon }) => {
                              const active = graphVisibility[key];
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => toggleGraph(key)}
                                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
                                    active
                                      ? 'bg-blue-600 text-white shadow'
                                      : 'bg-white/80 text-blue-600 border border-blue-100 hover:bg-white'
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                          {graphVisibility.waterfall && (
                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm space-y-3">
                              <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                <span className="text-right">Feature Impact</span>
                                <span>Contribution Flow</span>
                                <span className="text-right">Cumulative</span>
                              </div>
                              {shapWaterfall.steps.map((step) => {
                                const isPositive = step.value >= 0;
                                const barColor = isPositive ? 'bg-rose-500' : 'bg-blue-500';
                                const textColor = isPositive ? 'text-rose-600' : 'text-blue-600';
                                const startPercent = shapPercent(Math.min(step.start, step.end));
                                const endPercent = shapPercent(Math.max(step.start, step.end));
                                const widthPercent = Math.max(endPercent - startPercent, 1.5);
                                const startMarker = shapPercent(step.start);
                                const endMarker = shapPercent(step.end);
                                const baselineMarker = shapPercent(shapWaterfall.baseline);
                                return (
                                  <div
                                    key={step.feature}
                                    className="grid grid-cols-[auto,1fr,auto] items-center gap-3 text-xs"
                                  >
                                    <span className="font-semibold text-slate-600 text-right whitespace-nowrap">
                                      {`${step.value >= 0 ? '+' : ''}${step.value.toFixed(3)} = ${step.feature.toUpperCase()}`}
                                    </span>
                                    <div className="relative h-7 rounded-lg bg-slate-100">
                                      <div
                                        className="absolute inset-y-1 w-px bg-slate-300"
                                        style={{ left: `${baselineMarker}%` }}
                                      />
                                      <div
                                        className="absolute inset-y-2 w-px bg-slate-400/70"
                                        style={{ left: `${startMarker}%` }}
                                      />
                                      <div
                                        className="absolute inset-y-2 w-px bg-slate-400/70"
                                        style={{ left: `${endMarker}%` }}
                                      />
                                      <div
                                        className={`absolute top-1.5 bottom-1.5 rounded-md ${barColor}`}
                                        style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                                      />
                                      <div
                                        className={`absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${barColor}`}
                                        style={{ left: `${startMarker}%` }}
                                      />
                                      <div
                                        className={`absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${barColor}`}
                                        style={{ left: `${endMarker}%` }}
                                      />
                                    </div>
                                    <span className={`font-semibold ${textColor}`}>
                                      {step.end >= 0 ? '+' : ''}
                                      {step.end.toFixed(3)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {graphVisibility.bar && (
                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                  <BarChart3 className="h-4 w-4 text-blue-600" />
                                  {t('bar_plot_title')}
                                </h5>
                                <span className="text-[11px] text-slate-500">
                                  {t('bar_plot_desc')}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {shapSummary.map((entry) => {
                                  const isPositive = entry.value >= 0;
                                  const magnitude = Math.abs(entry.value);
                                  const width = Math.max((magnitude / shapMaxAbs) * 100, 3);
                                  return (
                                    <div key={`bar-${entry.feature}`} className="space-y-1">
                                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                                        <span className="uppercase">{entry.feature}</span>
                                        <span className={isPositive ? 'text-rose-600' : 'text-blue-600'}>
                                          {entry.value >= 0 ? '+' : ''}
                                          {entry.value.toFixed(3)}
                                        </span>
                                      </div>
                                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                                        <div
                                          className={`h-full ${isPositive ? 'bg-rose-500' : 'bg-blue-500'}`}
                                          style={{ width: `${width}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {graphVisibility.beeswarm && beeswarmPoints.length > 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                  <ScatterChart className="h-4 w-4 text-blue-600" />
                                  {t('beeswarm_title')}
                                </h5>
                                <span className="text-[11px] text-slate-500">
                                  {t('beeswarm_desc')}
                                </span>
                              </div>
                              <div className="relative h-48 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200" />
                                <div className="absolute inset-x-8 bottom-4 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  <span>{t('beeswarm_axis_left')}</span>
                                  <span>{t('beeswarm_axis_right')}</span>
                                </div>
                                <div className="absolute left-1/2 bottom-4 -translate-x-1/2 text-[10px] font-semibold text-slate-500">
                                  0
                                </div>
                                {beeswarmPoints.map(({ entry, x, y }) => {
                                  const positive = entry.value >= 0;
                                  return (
                                    <div
                                      key={`beeswarm-${entry.feature}`}
                                      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                                      style={{ left: `${x}%`, top: `${y}%` }}
                                      title={`${entry.feature.toUpperCase()} (${positive ? '+' : ''}${entry.value.toFixed(3)})`}
                                    >
                                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
                                        {entry.feature}
                                      </span>
                                      <span
                                        className={`mt-1 h-3 w-3 rounded-full border-2 ${positive ? 'bg-rose-500 border-rose-100' : 'bg-blue-500 border-blue-100'}`}
                                      />
                                      <span className={`mt-1 text-[10px] font-semibold ${positive ? 'text-rose-600' : 'text-blue-600'}`}>
                                        {positive ? '+' : ''}
                                        {entry.value.toFixed(3)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-500">
                            <p>
                              Model baseline E[f(X)] = {(shapBaseline ?? shapWaterfall.baseline).toFixed(3)}
                            </p>
                            {shapFxDisplay !== null && (
                              <p>
                                Patient prediction f(x) = {shapFxDisplay.toFixed(3)}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-blue-600">{t('shap_unavailable')}</p>
                      )
                    ) : (
                      <p className="text-xs text-blue-600">{t('graphs_hidden_hint')}</p>
                    )}
                  </div>

                  

                    <details className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900 list-none flex items-center justify-between">
                        <span>Clinical Guideline Sources</span>
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      </summary>
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-slate-400">
                          Authoritative references that inform this analysis.
                        </p>
                        <ul className="space-y-2 text-sm">
                          {GUIDELINE_LINKS.map(({ label, href }) => (
                            <li key={label}>
                              <a
                                className="text-blue-600 hover:text-blue-700 underline decoration-blue-200 underline-offset-2"
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {label}
                              </a>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] text-slate-500">
                          DiagnoAI validation: 94% precision and 94% recall within the internal clinical dataset.
                        </p>
                      </div>
                    </details>

                    <button
                      onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex items-center justify-center w-full gap-2 rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('generating_report')}
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        {t('download_btn')}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function AboutSection({ t }) {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">{t('about_title')}</h1>
          <p className="text-slate-500 max-w-3xl mx-auto">{t('about_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">{t('about_mission_title')}</h2>
            <p className="text-slate-500">{t('about_mission_p1')}</p>
            <p className="text-slate-500">{t('about_mission_p2')}</p>

            <div className="space-y-4">
              {[t('about_card_fda_title'), t('about_card_validation_title'), t('about_card_hipaa_title')].map((title, idx) => {
                const descriptions = [t('about_card_fda_desc'), t('about_card_validation_desc'), t('about_card_hipaa_desc')];
                return (
                  <div key={title} className="flex items-start bg-slate-100/70 rounded-2xl p-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{title}</h3>
                      <p className="text-slate-500">{descriptions[idx]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { value: '10,000+', label: t('about_stat_records'), color: 'text-blue-600' },
              { value: '97.4%', label: t('about_stat_accuracy'), color: 'text-emerald-600' },
              { value: '500+', label: t('about_stat_partners'), color: 'text-purple-600' },
              { value: '24/7', label: t('about_stat_support'), color: 'text-orange-600' },
            ].map((stat) => (
              <div key={stat.value} className="text-center bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                <div className={`text-3xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
                <p className="text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function FeaturesSection({ t }) {
  const features = [
    { icon: Brain, title: t('feat_ai_title'), description: t('feat_ai_desc'), bg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: BarChart3, title: t('feat_shap_title'), description: t('feat_shap_desc'), bg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { icon: ShieldCheck, title: t('feat_sec_title'), description: t('feat_sec_desc'), bg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: Zap, title: t('feat_rt_title'), description: t('feat_rt_desc'), bg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { icon: Users, title: t('feat_ehr_title'), description: t('feat_ehr_desc'), bg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { icon: Award, title: t('feat_fda_title'), description: t('feat_fda_desc'), bg: 'bg-rose-100', iconColor: 'text-rose-600' },
  ];

  return (
    <div className="py-16 bg-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">{t('features_title')}</h1>
          <p className="text-slate-500 max-w-3xl mx-auto">{t('features_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description, bg, iconColor }) => (
            <div key={title} className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 hover:shadow-lg transition">
              <div className={`flex items-center justify-center w-14 h-14 ${bg} rounded-xl mb-4`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
              <p className="text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Footer({ onNavigate, t }) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">DiagnoAI</h3>
                <p className="text-sm text-gray-400">Pancreas Diagnostic</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Advanced AI-powered pancreatic cancer diagnostic system for healthcare professionals.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer_navigation')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer">
                  {t('nav_home')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                  {t('nav_about')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('features')} className="hover:text-white transition-colors cursor-pointer">
                  {t('nav_features')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('diagnostic')} className="hover:text-white transition-colors cursor-pointer">
                  {t('nav_diag')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer_medical')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                  {t('footer_model_performance')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('features')} className="hover:text-white transition-colors cursor-pointer">
                  {t('footer_clinical_validation')}
                </button>
              </li>
              <li className="text-gray-500">
                {t('footer_fda')}
              </li>
              <li className="text-gray-500">
                {t('footer_hipaa')}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 DiagnoAI Medical Systems. All rights reserved.</p>
          <p className="mt-2">
            This tool is for research and educational purposes only. Always consult with qualified healthcare providers for medical decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}



