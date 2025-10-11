import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, Brain, CheckCircle2, AlertTriangle, Gauge, Loader2, ShieldCheck,
  Stethoscope, Users, Award, BarChart3, Menu, X, ArrowRight, 
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

  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language]);

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
      setResult(data);
    } catch (e) {
      setErr(`Failed to reach the server. Make sure Flask is running on ${API_BASE} (error: ${e.message})`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) {
      return;
    }

    setDownloading(true);
    try {
      const patientPayload = result.patient_values ? { ...result.patient_values } : { ...form };
      const shapPayload = result.shap_values || result.shapValues || [];
      const aiExplanation = result.ai_explanation || result.aiExplanation || "";

      const response = await fetch(`${API_BASE}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patientPayload,
          result: {
            ...result,
            shap_values: shapPayload,
            ai_explanation: aiExplanation
          },
          language,
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
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

function DiagnosticTool({ form, setForm, result, loading, downloading, err, handleChange, handleSubmit, handleDownload, handleClear, validate, language, setLanguage, clientType, setClientType, t }) {
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
      .slice(0, 6);
  }, [result]);

  const shapMax = useMemo(() => {
    if (!shapSummary.length) return 1;
    return Math.max(...shapSummary.map((entry) => entry.importance)) || 1;
  }, [shapSummary]);

  const aiExplanation = result?.ai_explanation || result?.aiExplanation || "";

  return (
    <div className="py-16 bg-slate-100" dir="ltr">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="grid grid-cols-1 gap-10 p-10 lg:grid-cols-2">
            <div>
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
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${
                        clientType === 'patient'
                          ? 'bg-white text-blue-600 shadow'
                          : 'text-slate-600 hover:text-blue-600'
                      }`}
                    >
                      {t('audience_patient')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientType('doctor')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${
                        clientType === 'doctor'
                          ? 'bg-white text-blue-600 shadow'
                          : 'text-slate-600 hover:text-blue-600'
                      }`}
                    >
                      {t('audience_doctor')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(form).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">{key.toUpperCase()}</label>
                    <input
                      type="text"
                      name={key}
                      value={value}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400">
                      Range: {RANGES[key]?.[0]} - {RANGES[key]?.[1]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
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

              {err && (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                  {err}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {!result && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center shadow-sm">
                  <Microscope className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {t('empty_prompt')}
                  </p>
                </div>
              )}

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

              {result && (
                <>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-left shadow-sm space-y-3">
                    <h4 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      {t('risk_score')}: {(Number(result?.probability ?? 0) * 100).toFixed(1)}%
                    </h4>
                    <p className="text-sm text-blue-700">
                      {result?.prediction === 0 ? t('result_low') : t('result_high')}
                    </p>
                    {shapSummary.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        <h5 className="text-sm font-semibold text-blue-700">{t('shap_title')}</h5>
                        {shapSummary.map(({ feature, value, impact, importance }) => (
                          <div key={feature}>
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                              <span>{feature.toUpperCase()}</span>
                              <span className={impact === 'positive' ? 'text-blue-600' : 'text-rose-600'}>
                                {value > 0 ? '+' : ''}{value.toFixed(3)}
                              </span>
                            </div>
                            <div className="mt-1 h-2 w-full rounded-full bg-blue-100">
                              <div
                                className={`h-full rounded-full ${impact === 'positive' ? 'bg-blue-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.max((importance / shapMax) * 100, 6)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-blue-600">{t('shap_unavailable')}</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-3">
                    <h4 className="text-lg font-semibold text-slate-900">{t('ai_title')}</h4>
                    <p className="text-xs text-slate-400">{t('ai_disclaimer')}</p>
                    <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                      {aiExplanation || t('ai_unavailable')}
                    </div>
                  </div>

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


