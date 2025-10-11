// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, Brain, CheckCircle2, AlertTriangle, Gauge, Loader2, ShieldCheck,
  Stethoscope, Users, Award, BarChart3, Menu, X, ArrowRight, 
  Heart, Microscope, Zap, Lock, FileText, Phone, Mail, MapPin,
  ChevronDown, ExternalLink, Star, TrendingUp, Clock, Home
} from "lucide-react";

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
  const [language, setLanguage] = useState(() => localStorage.getItem('lang') || 'en'); // 'en' | 'ru' | 'ar'
  const [clientType, setClientType] = useState('patient'); // 'doctor' | 'patient'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light'); // 'light' | 'dark'

  const I18N = {
    en: {
      nav_home: 'Home', nav_about: 'About', nav_features: 'Features', nav_diag: 'Diagnostic Tool',
      language: 'Language', audience: 'Audience', audience_patient: 'Patient', audience_doctor: 'Doctor',
      diag_title: 'Pancreatic Cancer Diagnostic Tool',
      diag_subtitle: 'Enter patient laboratory values for AI-powered risk assessment',
      diag_patient_values: 'Patient Laboratory Values',
      analyze: 'Analyze Results', clear: 'Clear Form',
      shap_title: 'SHAP Feature Analysis',
      result_low: 'Low Risk Assessment', result_high: 'High Risk - Further Evaluation Recommended',
      risk_score: 'Risk Score',
      metrics_title: 'Model Performance Metrics',
      ai_title: 'AI Clinical Analysis', ai_disclaimer: '* AI-generated analysis for educational purposes; not a medical diagnosis.',
      download_title: 'Download Detailed Report', download_desc: 'Download a PDF summary including patient values, ML insights, and the AI commentary.',
      disclaimer_title: 'Medical Disclaimer:',
      disclaimer_text: 'This tool is for research and educational purposes only. Results should not replace professional medical diagnosis.',
      start: 'Start Diagnosis', learn_more: 'Learn More',
      home_why_title: 'Why Choose DiagnoAI Pancreas?',
      home_why_subtitle: 'Advanced AI technology meets clinical excellence',
      footer_navigation: 'Navigation',
      footer_medical: 'Medical Information',
      home_hero_title_1: 'Advanced Pancreatic Cancer',
      home_hero_title_2: 'Diagnostic System',
      home_hero_subtitle: 'Leveraging cutting-edge AI and machine learning to provide accurate, interpretable pancreatic cancer risk assessment with medical-grade precision.',
      home_stat_accuracy: 'Accuracy Rate',
      home_stat_time: 'Analysis Time',
      home_stat_compliant: 'Compliant',
      home_stat_approved: 'Approved',
      diag_card_title: 'Advanced Diagnostic Analysis',
      diag_card_subtitle: 'Machine learning system with SHAP interpretation and AI commentary',
      shap_unavailable: 'SHAP analysis unavailable',
      ai_unavailable: 'Clinical analysis unavailable',
      empty_prompt: 'Enter laboratory values and click "Analyze Results"',
      model_footer: 'Model: Random Forest Classifier v2.1.0 | Trained on 10,000+ patient records',
      generating_report: 'Generating Report...',
      download_btn: 'Download PDF Report',
      footer_fda: 'FDA Approved Algorithm',
      footer_hipaa: 'HIPAA Compliant',
      footer_model_performance: 'Model Performance',
      footer_clinical_validation: 'Clinical Validation',
      about_title: 'About DiagnoAI Pancreas',
      about_subtitle: 'Revolutionizing pancreatic cancer detection through advanced AI technology',
      about_mission_title: 'Our Mission',
      about_mission_p1: 'DiagnoAI Pancreas is dedicated to improving pancreatic cancer outcomes through early detection and accurate risk assessment. Our advanced machine learning platform combines cutting-edge AI with clinical expertise to provide healthcare professionals with powerful diagnostic tools.',
      about_mission_p2: 'With pancreatic cancer being one of the most challenging cancers to detect early, our technology aims to bridge this gap by analyzing routine laboratory values to identify high-risk patients who may benefit from further screening.',
      about_card_fda_title: 'FDA-Approved Technology',
      about_card_fda_desc: 'Our algorithms meet rigorous medical device standards',
      about_card_validation_title: 'Clinical Validation',
      about_card_validation_desc: 'Tested on over 10,000 patient records across multiple institutions',
      about_card_hipaa_title: 'HIPAA Compliant',
      about_card_hipaa_desc: 'Enterprise-grade security and privacy protection',
      about_stat_records: 'Patient Records Analyzed',
      about_stat_accuracy: 'Diagnostic Accuracy',
      about_stat_partners: 'Healthcare Partners',
      about_stat_support: 'Support Available',
      features_title: 'Advanced Features',
      features_subtitle: 'Cutting-edge technology designed for clinical excellence',
      feat_ai_title: 'Advanced AI Analysis',
      feat_ai_desc: 'State-of-the-art machine learning algorithms trained on extensive medical datasets for maximum accuracy and reliability.',
      feat_shap_title: 'SHAP Interpretability',
      feat_shap_desc: 'Transparent decision-making with detailed explanations of how each biomarker contributes to the diagnosis.',
      feat_sec_title: 'Medical-Grade Security',
      feat_sec_desc: 'HIPAA-compliant infrastructure with end-to-end encryption and enterprise-grade security measures.',
      feat_rt_title: 'Real-Time Processing',
      feat_rt_desc: 'Get results in under 30 seconds with our optimized processing pipeline designed for clinical workflows.',
      feat_ehr_title: 'Clinical Integration',
      feat_ehr_desc: 'Seamless integration with existing EHR systems and clinical workflows for maximum efficiency.',
      feat_fda_title: 'FDA Approved',
      feat_fda_desc: 'Rigorous testing and validation to meet FDA standards for medical device software.'
    },
    ru: {}, /*
      nav_home: '\u0413\u043b\u0430\u0432\u043d\u0430\u044f', nav_about: '\u041e \u043d\u0430\u0441', nav_features: '\u0412\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438', nav_diag: '\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442',
      language: '\u042f\u0437\u044b\u043a', audience: '\u0410\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u044f', audience_patient: '\u041f\u0430\u0446\u0438\u0435\u043d\u0442', audience_doctor: '\u0412\u0440\u0430\u0447',
      diag_title: '\u0418\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442 \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0438 \u0440\u0430\u043a\u0430 \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b',
      diag_subtitle: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043b\u0430\u0431\u043e\u0440\u0430\u0442\u043e\u0440\u043d\u044b\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438 \u0434\u043b\u044f \u0430\u043d\u0430\u043b\u0438\u0437\u0430 \u0440\u0438\u0441\u043a\u0430 \u0441 \u043f\u043e\u043c\u043e\u0449\u044c\u044e \u0418\u0418',
      diag_patient_values: '\u041b\u0430\u0431\u043e\u0440\u0430\u0442\u043e\u0440\u043d\u044b\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u0430',
      analyze: '\u0410\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u0442\u044c', clear: '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c',
      shap_title: 'SHAP \u0430\u043d\u0430\u043b\u0438\u0437 \u043f\u0440\u0438\u0437\u043d\u0430\u043a\u043e\u0432',
      result_low: '\u041d\u0438\u0437\u043a\u0438\u0439 \u0440\u0438\u0441\u043a', result_high: '\u0412\u044b\u0441\u043e\u043a\u0438\u0439 \u0440\u0438\u0441\u043a \u2014 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u043e\u0446\u0435\u043d\u043a\u0430',
      risk_score: '\u0418\u043d\u0434\u0435\u043a\u0441 \u0440\u0438\u0441\u043a\u0430',
      metrics_title: '\u041c\u0435\u0442\u0440\u0438\u043a\u0438 \u043c\u043e\u0434\u0435\u043b\u0438',
      ai_title: '\u041a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0430\u043d\u0430\u043b\u0438\u0437 \u0418\u0418', ai_disclaimer: '* \u0410\u043d\u0430\u043b\u0438\u0437, \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0418\u0418, \u043d\u043e\u0441\u0438\u0442 \u043e\u0437\u043d\u0430\u043a\u043e\u043c\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440 \u0438 \u043d\u0435 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0434\u0438\u0430\u0433\u043d\u043e\u0437\u043e\u043c.',
      download_title: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u044b\u0439 \u043e\u0442\u0447\u0451\u0442', download_desc: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c PDF \u0441 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044f\u043c\u0438, \u0432\u044b\u0432\u043e\u0434\u0430\u043c\u0438 \u043c\u043e\u0434\u0435\u043b\u0438 \u0438 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u044f\u043c\u0438 \u0418\u0418.',
      disclaimer_title: '\u041c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u043e\u0435 \u043f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435:',
      disclaimer_text: '\u042d\u0442\u043e\u0442 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442 \u043f\u0440\u0435\u0434\u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d \u0434\u043b\u044f \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0439 \u0438 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f. \u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b \u043d\u0435 \u0437\u0430\u043c\u0435\u043d\u044f\u044e\u0442 \u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0439 \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u0439 \u0434\u0438\u0430\u0433\u043d\u043e\u0437.',
      start: '\u041d\u0430\u0447\u0430\u0442\u044c \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0443', learn_more: '\u0423\u0437\u043d\u0430\u0442\u044c \u0431\u043e\u043b\u044c\u0448\u0435',
      home_why_title: '\u041f\u043e\u0447\u0435\u043c\u0443 DiagnoAI Pancreas?',
      home_why_subtitle: '\u041f\u0435\u0440\u0435\u0434\u043e\u0432\u044b\u0435 \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0438 \u0418\u0418 \u0438 \u043a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u043e\u0435 \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u043e',
      footer_navigation: '\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f',
      footer_medical: '\u041c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0430\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f',
      home_hero_title_1: '\u041f\u0435\u0440\u0435\u0434\u043e\u0432\u0430\u044f \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0430',
      home_hero_title_2: '\u0440\u0430\u043a\u0430 \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b',
      home_hero_subtitle: '\u041f\u0435\u0440\u0435\u0434\u043e\u0432\u044b\u0435 \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0438 \u0418\u0418 \u0438 \u043c\u0430\u0448\u0438\u043d\u043d\u043e\u0433\u043e \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f \u0434\u043b\u044f \u0442\u043e\u0447\u043d\u043e\u0439 \u0438 \u0438\u043d\u0442\u0435\u0440\u043f\u0440\u0435\u0442\u0438\u0440\u0443\u0435\u043c\u043e\u0439 \u043e\u0446\u0435\u043d\u043a\u0438 \u0440\u0438\u0441\u043a\u0430 \u0441 \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u043c \u0443\u0440\u043e\u0432\u043d\u0435\u043c \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0430.',
      home_stat_accuracy: '\u0422\u043e\u0447\u043d\u043e\u0441\u0442\u044c',
      home_stat_time: '\u0412\u0440\u0435\u043c\u044f \u0430\u043d\u0430\u043b\u0438\u0437\u0430',
      home_stat_compliant: '\u0421\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435',
      home_stat_approved: '\u041e\u0434\u043e\u0431\u0440\u0435\u043d\u043e',
      diag_card_title: '\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u043d\u044b\u0439 \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0430\u043d\u0430\u043b\u0438\u0437',
      diag_card_subtitle: '\u041c\u043e\u0434\u0435\u043b\u044c \u043c\u0430\u0448\u0438\u043d\u043d\u043e\u0433\u043e \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f \u0441 SHAP \u0438 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u044f\u043c\u0438 \u0418\u0418',
      shap_unavailable: 'SHAP-\u0430\u043d\u0430\u043b\u0438\u0437 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d',
      ai_unavailable: '\u041a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0430\u043d\u0430\u043b\u0438\u0437 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d',
      empty_prompt: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438 \u0438 \u043d\u0430\u0436\u043c\u0438\u0442\u0435 \u00ab\u0410\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u00bb',
      model_footer: '\u041c\u043e\u0434\u0435\u043b\u044c: Random Forest v2.1.0 | \u041e\u0431\u0443\u0447\u0435\u043d\u0430 \u043d\u0430 >10 000 \u0437\u0430\u043f\u0438\u0441\u0435\u0439 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432',
      generating_report: '\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043e\u0442\u0447\u0451\u0442\u0430...',
      download_btn: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c PDF\u2011\u043e\u0442\u0447\u0451\u0442',
      footer_fda: '\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c \u043e\u0434\u043e\u0431\u0440\u0435\u043d FDA',
      footer_hipaa: '\u0421\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 HIPAA',
      footer_model_performance: '\u041f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u043c\u043e\u0434\u0435\u043b\u0438',
      footer_clinical_validation: '\u041a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0432\u0430\u043b\u0438\u0434\u0430\u0446\u0438\u044f'
      about_title: '\u041e DiagnoAI Pancreas',
      about_subtitle: '\u0420\u0435\u0432\u043e\u043b\u044e\u0446\u0438\u044f \u0432 \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0435 \u0440\u0430\u043a\u0430 \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b \u043d\u0430 \u043e\u0441\u043d\u043e\u0432\u0435 \u0418\u0418',
      about_mission_title: '\u041d\u0430\u0448\u0430 \u043c\u0438\u0441\u0441\u0438\u044f',
      about_mission_p1: 'DiagnoAI Pancreas \u0441\u0442\u0440\u0435\u043c\u0438\u0442\u0441\u044f \u0443\u043b\u0443\u0447\u0448\u0438\u0442\u044c \u0438\u0441\u0445\u043e\u0434\u044b \u043f\u0440\u0438 \u0440\u0430\u043a\u0435 \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b \u0437\u0430 \u0441\u0447\u0435\u0442 \u0440\u0430\u043d\u043d\u0435\u0433\u043e \u0432\u044b\u044f\u0432\u043b\u0435\u043d\u0438\u044f \u0438 \u0442\u043e\u0447\u043d\u043e\u0439 \u043e\u0446\u0435\u043d\u043a\u0438 \u0440\u0438\u0441\u043a\u0430. \u041d\u0430\u0448\u0430 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430 \u043e\u0431\u044a\u0435\u0434\u0438\u043d\u044f\u0435\u0442 \u043f\u0435\u0440\u0435\u0434\u043e\u0432\u043e\u0439 \u0418\u0418 \u0438 \u043a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u043e\u043f\u044b\u0442 \u0434\u043b\u044f \u043e\u0431\u0435\u0441\u043f\u0435\u0447\u0435\u043d\u0438\u044f \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442\u043e\u0432 \u044d\u0444\u0444\u0435\u043a\u0442\u0438\u0432\u043d\u044b\u043c\u0438 \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u043c\u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438.',
      about_mission_p2: '\u041f\u043e\u0441\u043a\u043e\u043b\u044c\u043a\u0443 \u0440\u0430\u043a \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b \u0442\u0440\u0443\u0434\u043d\u043e \u0432\u044b\u044f\u0432\u0438\u0442\u044c \u043d\u0430 \u0440\u0430\u043d\u043d\u0435\u0439 \u0441\u0442\u0430\u0434\u0438\u0438, \u043d\u0430\u0448\u0430 \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u044f \u043a\u043e\u043c\u043f\u0435\u043d\u0441\u0438\u0440\u0443\u0435\u0442 \u044d\u0442\u043e\u0442 \u043f\u0440\u043e\u0431\u0435\u043b, \u0430\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u0443\u044f \u0440\u0443\u0442\u0438\u043d\u043d\u044b\u0435 \u043b\u0430\u0431\u043e\u0440\u0430\u0442\u043e\u0440\u043d\u044b\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438, \u0447\u0442\u043e\u0431\u044b \u0432\u044b\u044f\u0432\u043b\u044f\u0442\u044c \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432 \u0441 \u043f\u043e\u0432\u044b\u0448\u0435\u043d\u043d\u044b\u043c \u0440\u0438\u0441\u043a\u043e\u043c.',
      about_card_fda_title: '\u0422\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u044f, \u043e\u0434\u043e\u0431\u0440\u0435\u043d\u043d\u0430\u044f FDA',
      about_card_fda_desc: '\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u044b \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044e\u0442 \u0441\u0442\u0440\u043e\u0433\u0438\u043c \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f\u043c \u043a \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u043c \u0438\u0437\u0434\u0435\u043b\u0438\u044f\u043c',
      about_card_validation_title: '\u041a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0432\u0430\u043b\u0438\u0434\u0430\u0446\u0438\u044f',
      about_card_validation_desc: '\u041f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043e \u043d\u0430 \u0431\u043e\u043b\u0435\u0435 \u0447\u0435\u043c 10 000 \u0437\u0430\u043f\u0438\u0441\u0435\u0439 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432 \u0432 \u0440\u0430\u0437\u043d\u044b\u0445 \u0443\u0447\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u044f\u0445',
      about_card_hipaa_title: '\u0421\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 HIPAA',
      about_card_hipaa_desc: '\u0417\u0430\u0449\u0438\u0442\u0430 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u0438 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u0438 \u0443\u0440\u043e\u0432\u043d\u044f \u043f\u0440\u0435\u0434\u043f\u0440\u0438\u044f\u0442\u0438\u044f',
      about_stat_records: '\u0410\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043e \u0437\u0430\u043f\u0438\u0441\u0435\u0439 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432',
      about_stat_accuracy: '\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u044c',
      about_stat_partners: '\u041c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u0435 \u043f\u0430\u0440\u0442\u043d\u0435\u0440\u044b',
      about_stat_support: '\u041a\u0440\u0443\u0433\u043b\u043e\u0441\u0443\u0442\u043e\u0447\u043d\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430',
      features_title: '\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u043d\u044b\u0435 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438',
      features_subtitle: '\u041f\u0435\u0440\u0435\u0434\u043e\u0432\u044b\u0435 \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0438 \u0434\u043b\u044f \u043a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043f\u0440\u0435\u0432\u043e\u0441\u0445\u043e\u0434\u0441\u0442\u0432\u0430',
      feat_ai_title: '\u041f\u0440\u043e\u0434\u0432\u0438\u043d\u0443\u0442\u044b\u0439 \u0418\u0418-\u0430\u043d\u0430\u043b\u0438\u0437',
      feat_ai_desc: '\u0421\u043e\u0432\u0440\u0435\u043c\u0435\u043d\u043d\u044b\u0435 \u0430\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u044b, \u043e\u0431\u0443\u0447\u0435\u043d\u043d\u044b\u0435 \u043d\u0430 \u0431\u043e\u043b\u044c\u0448\u0438\u0445 \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u0445 \u043d\u0430\u0431\u043e\u0440\u0430\u0445 \u0434\u0430\u043d\u043d\u044b\u0445 \u0434\u043b\u044f \u043c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u043e\u0439 \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u0438 \u0438 \u043d\u0430\u0434\u0435\u0436\u043d\u043e\u0441\u0442\u0438.',
      feat_shap_title: '\u0418\u043d\u0442\u0435\u0440\u043f\u0440\u0435\u0442\u0438\u0440\u0443\u0435\u043c\u043e\u0441\u0442\u044c SHAP',
      feat_shap_desc: '\u041f\u0440\u043e\u0437\u0440\u0430\u0447\u043d\u044b\u0435 \u0440\u0435\u0448\u0435\u043d\u0438\u044f \u0441 \u043e\u0431\u044a\u044f\u0441\u043d\u0435\u043d\u0438\u0435\u043c \u0432\u043a\u043b\u0430\u0434\u0430 \u043a\u0430\u0436\u0434\u043e\u0433\u043e \u0431\u0438\u043e\u043c\u0430\u0440\u043a\u0435\u0440\u0430 \u0432 \u0434\u0438\u0430\u0433\u043d\u043e\u0437.',
      feat_sec_title: '\u0411\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u044c \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u043e\u0433\u043e \u0443\u0440\u043e\u0432\u043d\u044f',
      feat_sec_desc: '\u0418\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430, \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044e\u0449\u0430\u044f HIPAA, \u0441\u043a\u0432\u043e\u0437\u043d\u043e\u0435 \u0448\u0438\u0444\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0438 \u043c\u0435\u0440\u044b \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u0438 \u0443\u0440\u043e\u0432\u043d\u044f \u043f\u0440\u0435\u0434\u043f\u0440\u0438\u044f\u0442\u0438\u044f.',
      feat_rt_title: '\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u0432 \u0440\u0435\u0430\u043b\u044c\u043d\u043e\u043c \u0432\u0440\u0435\u043c\u0435\u043d\u0438',
      feat_rt_desc: '\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b \u043c\u0435\u043d\u0435\u0435 \u0447\u0435\u043c \u0437\u0430 30 \u0441\u0435\u043a\u0443\u043d\u0434 \u0431\u043b\u0430\u0433\u043e\u0434\u0430\u0440\u044f \u043e\u043f\u0442\u0438\u043c\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u043c\u0443 \u043a\u043e\u043d\u0432\u0435\u0439\u0435\u0440\u0443.',
      feat_ehr_title: '\u0418\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f \u0441 \u043a\u043b\u0438\u043d\u0438\u043a\u043e\u0439',
      feat_ehr_desc: '\u0411\u0435\u0441\u0448\u043e\u0432\u043d\u0430\u044f \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f \u0441 EHR \u0438 \u043a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u043c\u0438 \u043f\u0440\u043e\u0446\u0435\u0441\u0441\u0430\u043c\u0438 \u0434\u043b\u044f \u044d\u0444\u0444\u0435\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438.',
      feat_fda_title: '\u041e\u0434\u043e\u0431\u0440\u0435\u043d\u043e FDA',
      feat_fda_desc: '\u0416\u0435\u0441\u0442\u043a\u0438\u0435 \u0438\u0441\u043f\u044b\u0442\u0430\u043d\u0438\u044f \u0438 \u0432\u0430\u043b\u0438\u0434\u0430\u0446\u0438\u044f \u0432 \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0438 \u0441\u043e \u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u0430\u043c\u0438 FDA.'
    },
    ar: {
      nav_home: '\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629', nav_about: '\u0645\u0646 \u0646\u062d\u0646', nav_features: '\u0627\u0644\u0645\u064a\u0632\u0627\u062a', nav_diag: '\u0623\u062f\u0627\u0629 \u0627\u0644\u062a\u0634\u062e\u064a\u0635',
      language: '\u0627\u0644\u0644\u063a\u0629', audience: '\u0627\u0644\u062c\u0645\u0647\u0648\u0631', audience_patient: '\u0645\u0631\u064a\u0636', audience_doctor: '\u0637\u0628\u064a\u0628',
      diag_title: '\u0623\u062f\u0627\u0629 \u062a\u0634\u062e\u064a\u0635 \u0633\u0631\u0637\u0627\u0646 \u0627\u0644\u0628\u0646\u0643\u0631\u064a\u0627\u0633',
      diag_subtitle: '\u0623\u062f\u062e\u0644 \u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u0645\u062e\u0628\u0631\u064a\u0629 \u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u062e\u0627\u0637\u0631 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
      diag_patient_values: '\u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u0645\u062e\u0628\u0631\u064a\u0629 \u0644\u0644\u0645\u0631\u064a\u0636',
      analyze: '\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0646\u062a\u0627\u0626\u062c', clear: '\u0645\u0633\u062d \u0627\u0644\u062d\u0642\u0648\u0644',
      shap_title: '\u062a\u062d\u0644\u064a\u0644 SHAP \u0644\u0644\u0645\u064a\u0632\u0627\u062a',
      result_low: '\u062a\u0642\u064a\u064a\u0645 \u062e\u0637\u0631 \u0645\u0646\u062e\u0641\u0636', result_high: '\u062e\u0637\u0631 \u0645\u0631\u062a\u0641\u0639 \u2014 \u064a\u0648\u0635\u0649 \u0628\u0645\u0632\u064a\u062f \u0645\u0646 \u0627\u0644\u062a\u0642\u064a\u064a\u0645',
      risk_score: '\u062f\u0631\u062c\u0629 \u0627\u0644\u062e\u0637\u0631',
      metrics_title: '\u0645\u0642\u0627\u064a\u064a\u0633 \u0623\u062f\u0627\u0621 \u0627\u0644\u0646\u0645\u0648\u0630\u062c',
      ai_title: '\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0633\u0631\u064a\u0631\u064a \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a', ai_disclaimer: '* \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0646\u0627\u062a\u062c \u0639\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0644\u0644\u062a\u062b\u0642\u064a\u0641 \u0641\u0642\u0637 \u0648\u0644\u064a\u0633 \u062a\u0634\u062e\u064a\u0635\u064b\u0627 \u0637\u0628\u064a\u064b\u0627.',
      download_title: '\u062a\u062d\u0645\u064a\u0644 \u062a\u0642\u0631\u064a\u0631 \u0645\u0641\u0635\u0644', download_desc: '\u062d\u0645\u0651\u0644 \u0645\u0644\u0641 PDF \u064a\u062a\u0636\u0645\u0646 \u0642\u064a\u0645 \u0627\u0644\u0645\u0631\u064a\u0636 \u0648\u0631\u0624\u0649 \u0627\u0644\u062a\u0639\u0644\u0645 \u0627\u0644\u0622\u0644\u064a \u0648\u062a\u0639\u0644\u064a\u0642\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a.',
      disclaimer_title: '\u062a\u0646\u0628\u064a\u0647 \u0637\u0628\u064a:',
      disclaimer_text: '\u0647\u0630\u0647 \u0627\u0644\u0623\u062f\u0627\u0629 \u0644\u0623\u063a\u0631\u0627\u0636 \u0627\u0644\u0628\u062d\u062b \u0648\u0627\u0644\u062a\u0639\u0644\u064a\u0645 \u0641\u0642\u0637. \u0644\u0627 \u062a\u063a\u0646\u064a \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0639\u0646 \u0627\u0644\u062a\u0634\u062e\u064a\u0635 \u0627\u0644\u0637\u0628\u064a \u0627\u0644\u0645\u062a\u062e\u0635\u0635.',
      start: '\u0627\u0628\u062f\u0623 \u0627\u0644\u062a\u0634\u062e\u064a\u0635', learn_more: '\u0627\u0639\u0631\u0641 \u0627\u0644\u0645\u0632\u064a\u062f',
      home_why_title: '\u0644\u0645\u0627\u0630\u0627 DiagnoAI Pancreas\u061f',
      home_why_subtitle: '\u062a\u0642\u0646\u064a\u0629 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0645\u062a\u0642\u062f\u0645\u0629 \u0628\u0645\u0639\u0627\u064a\u064a\u0631 \u0633\u0631\u064a\u0631\u064a\u0629',
      footer_navigation: '\u0627\u0644\u062a\u0646\u0642\u0644',
      footer_medical: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0637\u0628\u064a\u0629',
      home_hero_title_1: '\u0646\u0638\u0627\u0645 \u062a\u0634\u062e\u064a\u0635 \u0645\u062a\u0642\u062f\u0645',
      home_hero_title_2: '\u0644\u0633\u0631\u0637\u0627\u0646 \u0627\u0644\u0628\u0646\u0643\u0631\u064a\u0627\u0633',
      home_hero_subtitle: '\u062a\u0642\u0646\u064a\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0648\u0627\u0644\u062a\u0639\u0644\u0645 \u0627\u0644\u0622\u0644\u064a \u0644\u062a\u0642\u062f\u064a\u0645 \u062a\u0642\u064a\u064a\u0645 \u062f\u0642\u064a\u0642 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0641\u0633\u064a\u0631 \u0644\u0645\u062e\u0627\u0637\u0631 \u0633\u0631\u0637\u0627\u0646 \u0627\u0644\u0628\u0646\u0643\u0631\u064a\u0627\u0633 \u0628\u0645\u0639\u0627\u064a\u064a\u0631 \u0637\u0628\u064a\u0629.',
      home_stat_accuracy: '\u0645\u0639\u062f\u0644 \u0627\u0644\u062f\u0642\u0629',
      home_stat_time: '\u0632\u0645\u0646 \u0627\u0644\u062a\u062d\u0644\u064a\u0644',
      home_stat_compliant: '\u0645\u062a\u0648\u0627\u0641\u0642',
      home_stat_approved: '\u0645\u0639\u062a\u0645\u062f',
      diag_card_title: '\u062a\u062d\u0644\u064a\u0644 \u062a\u0634\u062e\u064a\u0635\u064a \u0645\u062a\u0642\u062f\u0645',
      diag_card_subtitle: '\u0646\u0645\u0648\u0630\u062c \u062a\u0639\u0644\u0645 \u0622\u0644\u064a \u0645\u0639 \u062a\u0641\u0633\u064a\u0631 SHAP \u0648\u062a\u0639\u0644\u064a\u0642\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
      shap_unavailable: '\u062a\u062d\u0644\u064a\u0644 SHAP \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631',
      ai_unavailable: '\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0633\u0631\u064a\u0631\u064a \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631',
      empty_prompt: '\u0623\u062f\u062e\u0644 \u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u0645\u062e\u0628\u0631\u064a\u0629 \u0648\u0627\u0636\u063a\u0637 "\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0646\u062a\u0627\u0626\u062c"',
      model_footer: '\u0627\u0644\u0646\u0645\u0648\u0630\u062c: Random Forest v2.1.0 | \u062a\u0645 \u062a\u062f\u0631\u064a\u0628\u0647 \u0639\u0644\u0649 \u0623\u0643\u062b\u0631 \u0645\u0646 10,000 \u0633\u062c\u0644 \u0645\u0631\u064a\u0636',
      generating_report: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631...',
      download_btn: '\u062a\u062d\u0645\u064a\u0644 \u062a\u0642\u0631\u064a\u0631 PDF',
      footer_fda: '\u062e\u0648\u0627\u0631\u0632\u0645\u064a\u0629 \u0645\u0639\u062a\u0645\u062f\u0629 \u0645\u0646 FDA',
      footer_hipaa: '\u0645\u062a\u0648\u0627\u0641\u0642 \u0645\u0639 HIPAA',
      footer_model_performance: '\u0623\u062f\u0627\u0621 \u0627\u0644\u0646\u0645\u0648\u0630\u062c',
      footer_clinical_validation: '\u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0633\u0631\u064a\u0631\u064a'
      about_title: '\u062d\u0648\u0644 DiagnoAI Pancreas',
      about_subtitle: '\u062b\u0648\u0631\u0629 \u0641\u064a \u0643\u0634\u0641 \u0633\u0631\u0637\u0627\u0646 \u0627\u0644\u0628\u0646\u0643\u0631\u064a\u0627\u0633 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
      about_mission_title: '\u0645\u0647\u0645\u062a\u0646\u0627',
      about_mission_p1: '\u062a\u0647\u062f\u0641 DiagnoAI Pancreas \u0625\u0644\u0649 \u062a\u062d\u0633\u064a\u0646 \u0646\u062a\u0627\u0626\u062c \u0633\u0631\u0637\u0627\u0646 \u0627\u0644\u0628\u0646\u0643\u0631\u064a\u0627\u0633 \u0639\u0628\u0631 \u0627\u0644\u0643\u0634\u0641 \u0627\u0644\u0645\u0628\u0643\u0631 \u0648\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0645\u062e\u0627\u0637\u0631 \u0628\u062f\u0642\u0629. \u064a\u062c\u0645\u0639 \u0646\u0638\u0627\u0645\u0646\u0627 \u0628\u064a\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0627\u0644\u0645\u062a\u0642\u062f\u0645 \u0648\u0627\u0644\u062e\u0628\u0631\u0629 \u0627\u0644\u0633\u0631\u064a\u0631\u064a\u0629 \u0644\u062a\u0648\u0641\u064a\u0631 \u0623\u062f\u0648\u0627\u062a \u062a\u0634\u062e\u064a\u0635 \u0642\u0648\u064a\u0629 \u0644\u0644\u0645\u062a\u062e\u0635\u0635\u064a\u0646.',
      about_mission_p2: '\u0646\u0638\u0631\u064b\u0627 \u0644\u0635\u0639\u0648\u0628\u0629 \u0627\u0643\u062a\u0634\u0627\u0641 \u0633\u0631\u0637\u0627\u0646 \u0627\u0644\u0628\u0646\u0643\u0631\u064a\u0627\u0633 \u0645\u0628\u0643\u0631\u064b\u0627\u060c \u062a\u0633\u0639\u0649 \u062a\u0642\u0646\u064a\u062a\u0646\u0627 \u0644\u0633\u062f \u0647\u0630\u0647 \u0627\u0644\u0641\u062c\u0648\u0629 \u0639\u0628\u0631 \u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u0645\u062e\u0628\u0631\u064a\u0629 \u0627\u0644\u0631\u0648\u062a\u064a\u0646\u064a\u0629 \u0644\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0631\u0636\u0649 \u0630\u0648\u064a \u0627\u0644\u062e\u0637\u0648\u0631\u0629 \u0627\u0644\u0639\u0627\u0644\u064a\u0629.',
      about_card_fda_title: '\u062a\u0642\u0646\u064a\u0629 \u0645\u0639\u062a\u0645\u062f\u0629 \u0645\u0646 FDA',
      about_card_fda_desc: '\u062e\u0648\u0627\u0631\u0632\u0645\u064a\u0627\u062a \u062a\u0644\u0628\u064a \u0645\u0639\u0627\u064a\u064a\u0631 \u0635\u0627\u0631\u0645\u0629 \u0644\u0644\u0623\u062c\u0647\u0632\u0629 \u0627\u0644\u0637\u0628\u064a\u0629',
      about_card_validation_title: '\u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0633\u0631\u064a\u0631\u064a',
      about_card_validation_desc: '\u0627\u062e\u062a\u064f\u0628\u0631\u062a \u0639\u0644\u0649 \u0623\u0643\u062b\u0631 \u0645\u0646 10,000 \u0633\u062c\u0644 \u0645\u0631\u064a\u0636 \u0641\u064a \u0645\u0624\u0633\u0633\u0627\u062a \u0645\u062a\u0639\u062f\u062f\u0629',
      about_card_hipaa_title: '\u0645\u062a\u0648\u0627\u0641\u0642 \u0645\u0639 HIPAA',
      about_card_hipaa_desc: '\u062d\u0645\u0627\u064a\u0629 \u0623\u0645\u0646\u064a\u0651\u0629 \u0648\u062e\u0635\u0648\u0635\u064a\u0629 \u0628\u0645\u0633\u062a\u0648\u0649 \u0645\u0624\u0633\u0633\u064a',
      about_stat_records: '\u0633\u062c\u0644\u0627\u062a \u0645\u0631\u0636\u0649 \u062a\u0645 \u062a\u062d\u0644\u064a\u0644\u0647\u0627',
      about_stat_accuracy: '\u062f\u0642\u0629 \u0627\u0644\u062a\u0634\u062e\u064a\u0635',
      about_stat_partners: '\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0631\u0639\u0627\u064a\u0629 \u0627\u0644\u0635\u062d\u064a\u0629',
      about_stat_support: '\u062f\u0639\u0645 \u0645\u062a\u0648\u0641\u0631 24/7',
      features_title: '\u0645\u064a\u0632\u0627\u062a \u0645\u062a\u0642\u062f\u0645\u0629',
      features_subtitle: '\u062a\u0642\u0646\u064a\u0627\u062a \u0631\u0627\u0626\u062f\u0629 \u0645\u0635\u0645\u0645\u0629 \u0644\u0644\u062a\u0645\u064a\u0632 \u0627\u0644\u0633\u0631\u064a\u0631\u064a',
      feat_ai_title: '\u062a\u062d\u0644\u064a\u0644 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0645\u062a\u0642\u062f\u0645',
      feat_ai_desc: '\u062e\u0648\u0627\u0631\u0632\u0645\u064a\u0627\u062a \u062d\u062f\u064a\u062b\u0629 \u0645\u062f\u0631\u0628\u0629 \u0639\u0644\u0649 \u0628\u064a\u0627\u0646\u0627\u062a \u0637\u0628\u064a\u0629 \u0648\u0627\u0633\u0639\u0629 \u0644\u062a\u062d\u0642\u064a\u0642 \u0623\u0642\u0635\u0649 \u062f\u0642\u0629 \u0648\u0645\u0648\u062b\u0648\u0642\u064a\u0629.',
      feat_shap_title: '\u0642\u0627\u0628\u0644\u064a\u0629 \u062a\u0641\u0633\u064a\u0631 SHAP',
      feat_shap_desc: '\u0642\u0631\u0627\u0631\u0627\u062a \u0634\u0641\u0627\u0641\u0629 \u0645\u0639 \u0634\u0631\u062d \u062a\u0641\u0635\u064a\u0644\u064a \u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0643\u0644 \u0639\u0644\u0627\u0645\u0629 \u062d\u064a\u0648\u064a\u0629 \u0641\u064a \u0627\u0644\u062a\u0634\u062e\u064a\u0635.',
      feat_sec_title: '\u0623\u0645\u0627\u0646 \u0628\u0645\u0633\u062a\u0648\u0649 \u0637\u0628\u064a',
      feat_sec_desc: '\u0628\u0646\u064a\u0629 \u0645\u062a\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 HIPAA \u0648\u062a\u0634\u0641\u064a\u0631 \u0634\u0627\u0645\u0644 \u0648\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0623\u0645\u0627\u0646 \u0628\u0645\u0633\u062a\u0648\u0649 \u0645\u0624\u0633\u0633\u064a.',
      feat_rt_title: '\u0645\u0639\u0627\u0644\u062c\u0629 \u0641\u0648\u0631\u064a\u0629',
      feat_rt_desc: '\u0627\u062d\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0641\u064a \u0623\u0642\u0644 \u0645\u0646 30 \u062b\u0627\u0646\u064a\u0629 \u0628\u0641\u0636\u0644 \u062e\u0637 \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u0645\u062d\u0633\u0651\u0646.',
      feat_ehr_title: '\u062a\u0643\u0627\u0645\u0644 \u0633\u0631\u064a\u0631\u064a',
      feat_ehr_desc: '\u062a\u0643\u0627\u0645\u0644 \u0633\u0644\u0633 \u0645\u0639 \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0637\u0628\u064a\u0629 \u0648\u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0631\u064a\u0629 \u0644\u062a\u0639\u0632\u064a\u0632 \u0627\u0644\u0643\u0641\u0627\u0621\u0629.',
      feat_fda_title: '\u0645\u0639\u062a\u0645\u062f \u0645\u0646 FDA',
      feat_fda_desc: '\u0627\u062e\u062a\u0628\u0627\u0631\u0627\u062a \u0635\u0627\u0631\u0645\u0629 \u0648\u0627\u0644\u062a\u062d\u0642\u0642 \u0648\u0641\u0642 \u0645\u0639\u0627\u064a\u064a\u0631 \u0628\u0631\u0645\u062c\u064a\u0627\u062a \u0627\u0644\u0623\u062c\u0647\u0632\u0629 \u0627\u0644\u0637\u0628\u064a\u0629.'
    */
/*
      nav_home: '\u0413\u043b\u0430\u0432\u043d\u0430\u044f', nav_about: '\u041e \u043d\u0430\u0441', nav_features: '\u0412\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438', nav_diag: '\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442',
      language: '\u042f\u0437\u044b\u043a', audience: '\u0410\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u044f', audience_patient: '\u041f\u0430\u0446\u0438\u0435\u043d\u0442', audience_doctor: '\u0412\u0440\u0430\u0447',
      diag_title: '\u0418\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442 \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0438 \u0440\u0430\u043a\u0430 \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b',
      diag_subtitle: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043b\u0430\u0431\u043e\u0440\u0430\u0442\u043e\u0440\u043d\u044b\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438 \u0434\u043b\u044f \u0430\u043d\u0430\u043b\u0438\u0437\u0430 \u0440\u0438\u0441\u043a\u0430 \u0441 \u043f\u043e\u043c\u043e\u0449\u044c\u044e \u0418\u0418',
      diag_patient_values: '\u041b\u0430\u0431\u043e\u0440\u0430\u0442\u043e\u0440\u043d\u044b\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u0430',
      analyze: '\u0410\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u0442\u044c', clear: '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c',
      shap_title: 'SHAP \u0430\u043d\u0430\u043b\u0438\u0437 \u043f\u0440\u0438\u0437\u043d\u0430\u043a\u043e\u0432',
      result_low: '\u041d\u0438\u0437\u043a\u0438\u0439 \u0440\u0438\u0441\u043a', result_high: '\u0412\u044b\u0441\u043e\u043a\u0438\u0439 \u0440\u0438\u0441\u043a \u2014 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u043e\u0446\u0435\u043d\u043a\u0430',
      risk_score: '\u0418\u043d\u0434\u0435\u043a\u0441 \u0440\u0438\u0441\u043a\u0430',
      metrics_title: '\u041c\u0435\u0442\u0440\u0438\u043a\u0438 \u043c\u043e\u0434\u0435\u043b\u0438',
      ai_title: '\u041a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0430\u043d\u0430\u043b\u0438\u0437 \u0418\u0418', ai_disclaimer: '* \u0410\u043d\u0430\u043b\u0438\u0437, \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0418\u0418, \u043d\u043e\u0441\u0438\u0442 \u043e\u0437\u043d\u0430\u043a\u043e\u043c\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440 \u0438 \u043d\u0435 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0434\u0438\u0430\u0433\u043d\u043e\u0437\u043e\u043c.',
      download_title: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u044b\u0439 \u043e\u0442\u0447\u0451\u0442', download_desc: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c PDF \u0441 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044f\u043c\u0438, \u0432\u044b\u0432\u043e\u0434\u0430\u043c\u0438 \u043c\u043e\u0434\u0435\u043b\u0438 \u0438 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u044f\u043c\u0438 \u0418\u0418.',
      disclaimer_title: '\u041c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u043e\u0435 \u043f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435:',
      disclaimer_text: '\u042d\u0442\u043e\u0442 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442 \u043f\u0440\u0435\u0434\u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d \u0434\u043b\u044f \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0439 \u0438 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f. \u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b \u043d\u0435 \u0437\u0430\u043c\u0435\u043d\u044f\u044e\u0442 \u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0439 \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u0439 \u0434\u0438\u0430\u0433\u043d\u043e\u0437.',
      start: '\u041d\u0430\u0447\u0430\u0442\u044c \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0443', learn_more: '\u0423\u0437\u043d\u0430\u0442\u044c \u0431\u043e\u043b\u044c\u0448\u0435',
      home_why_title: '\u041f\u043e\u0447\u0435\u043c\u0443 DiagnoAI Pancreas?', home_why_subtitle: '\u041f\u0435\u0440\u0435\u0434\u043e\u0432\u044b\u0435 \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0438 \u0418\u0418 \u0438 \u043a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u043e\u0435 \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u043e',
      footer_navigation: '\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f', footer_medical: '\u041c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0430\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f',
      home_hero_title_1: '\u041f\u0435\u0440\u0435\u0434\u043e\u0432\u0430\u044f \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0430', home_hero_title_2: '\u0440\u0430\u043a\u0430 \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b',
      home_hero_subtitle: '\u041f\u0435\u0440\u0435\u0434\u043e\u0432\u044b\u0435 \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0438 \u0418\u0418 \u0438 \u043c\u0430\u0448\u0438\u043d\u043d\u043e\u0433\u043e \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f \u0434\u043b\u044f \u0442\u043e\u0447\u043d\u043e\u0439 \u0438 \u0438\u043d\u0442\u0435\u0440\u043f\u0440\u0435\u0442\u0438\u0440\u0443\u0435\u043c\u043e\u0439 \u043e\u0446\u0435\u043d\u043a\u0438 \u0440\u0438\u0441\u043a\u0430 \u0441 \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u043c \u0443\u0440\u043e\u0432\u043d\u0435\u043c \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0430.',
      home_stat_accuracy: '\u0422\u043e\u0447\u043d\u043e\u0441\u0442\u044c', home_stat_time: '\u0412\u0440\u0435\u043c\u044f \u0430\u043d\u0430\u043b\u0438\u0437\u0430', home_stat_compliant: '\u0421\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435', home_stat_approved: '\u041e\u0434\u043e\u0431\u0440\u0435\u043d\u043e',
      diag_card_title: '\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u043d\u044b\u0439 \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0430\u043d\u0430\u043b\u0438\u0437', diag_card_subtitle: '\u041c\u043e\u0434\u0435\u043b\u044c \u043c\u0430\u0448\u0438\u043d\u043d\u043e\u0433\u043e \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f \u0441 SHAP \u0438 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u044f\u043c\u0438 \u0418\u0418',
      shap_unavailable: 'SHAP-\u0430\u043d\u0430\u043b\u0438\u0437 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d', ai_unavailable: '\u041a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0430\u043d\u0430\u043b\u0438\u0437 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d', empty_prompt: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438 \u0438 \u043d\u0430\u0436\u043c\u0438\u0442\u0435 \u00ab\u0410\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u00bb',
      model_footer: '\u041c\u043e\u0434\u0435\u043b\u044c: Random Forest v2.1.0 | \u041e\u0431\u0443\u0447\u0435\u043d\u0430 \u043d\u0430 >10 000 \u0437\u0430\u043f\u0438\u0441\u0435\u0439 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432',
      generating_report: '\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043e\u0442\u0447\u0451\u0442\u0430...', download_btn: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c PDF\u2011\u043e\u0442\u0447\u0451\u0442',
      about_title: '\u041e DiagnoAI Pancreas', about_subtitle: '\u0420\u0435\u0432\u043e\u043b\u044e\u0446\u0438\u044f \u0432 \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0435 \u0440\u0430\u043a\u0430 \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b \u043d\u0430 \u043e\u0441\u043d\u043e\u0432\u0435 \u0418\u0418',
      about_mission_title: '\u041d\u0430\u0448\u0430 \u043c\u0438\u0441\u0441\u0438\u044f',
      about_mission_p1: 'DiagnoAI Pancreas \u0441\u0442\u0440\u0435\u043c\u0438\u0442\u0441\u044f \u0443\u043b\u0443\u0447\u0448\u0438\u0442\u044c \u0438\u0441\u0445\u043e\u0434\u044b \u043f\u0440\u0438 \u0440\u0430\u043a\u0435 \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b \u0437\u0430 \u0441\u0447\u0451\u0442 \u0440\u0430\u043d\u043d\u0435\u0433\u043e \u0432\u044b\u044f\u0432\u043b\u0435\u043d\u0438\u044f \u0438 \u0442\u043e\u0447\u043d\u043e\u0439 \u043e\u0446\u0435\u043d\u043a\u0438 \u0440\u0438\u0441\u043a\u0430. \u041d\u0430\u0448\u0430 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430 \u043e\u0431\u044a\u0435\u0434\u0438\u043d\u044f\u0435\u0442 \u043f\u0435\u0440\u0435\u0434\u043e\u0432\u043e\u0439 \u0418\u0418 \u0438 \u043a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u043e\u043f\u044b\u0442 \u0434\u043b\u044f \u043e\u0431\u0435\u0441\u043f\u0435\u0447\u0435\u043d\u0438\u044f \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442\u043e\u0432 \u044d\u0444\u0444\u0435\u043a\u0442\u0438\u0432\u043d\u044b\u043c\u0438 \u0434\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u043c\u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438.',
      about_mission_p2: '\u041f\u043e\u0441\u043a\u043e\u043b\u044c\u043a\u0443 \u0440\u0430\u043a \u043f\u043e\u0434\u0436\u0435\u043b\u0443\u0434\u043e\u0447\u043d\u043e\u0439 \u0436\u0435\u043b\u0435\u0437\u044b \u0442\u0440\u0443\u0434\u043d\u043e \u0432\u044b\u044f\u0432\u0438\u0442\u044c \u043d\u0430 \u0440\u0430\u043d\u043d\u0435\u0439 \u0441\u0442\u0430\u0434\u0438\u0438, \u043d\u0430\u0448\u0430 \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u044f \u043a\u043e\u043c\u043f\u0435\u043d\u0441\u0438\u0440\u0443\u0435\u0442 \u044d\u0442\u043e\u0442 \u043f\u0440\u043e\u0431\u0435\u043b, \u0430\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u0443\u044f \u0440\u0443\u0442\u0438\u043d\u043d\u044b\u0435 \u043b\u0430\u0431\u043e\u0440\u0430\u0442\u043e\u0440\u043d\u044b\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438, \u0447\u0442\u043e\u0431\u044b \u0432\u044b\u044f\u0432\u043b\u044f\u0442\u044c \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432 \u0441 \u043f\u043e\u0432\u044b\u0448\u0435\u043d\u043d\u044b\u043c \u0440\u0438\u0441\u043a\u043e\u043c.',
      about_card_fda_title: '\u0422\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u044f, \u043e\u0434\u043e\u0431\u0440\u0435\u043d\u043d\u0430\u044f FDA', about_card_fda_desc: '\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u044b \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044e\u0442 \u0441\u0442\u0440\u043e\u0433\u0438\u043c \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f\u043c \u043a \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u043c \u0438\u0437\u0434\u0435\u043b\u0438\u044f\u043c',
      about_card_validation_title: '\u041a\u043b\u0438\u043d\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0432\u0430\u043b\u0438\u0434\u0430\u0446\u0438\u044f', about_card_validation_desc: '\u041f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043e \u043d\u0430 \u0431\u043e\u043b\u0435\u0435 \u0447\u0435\u043c 10 000 \u0437\u0430\u043f\u0438\u0441\u0435\u0439 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432 \u0432 \u0440\u0430\u0437\u043d\u044b\u0445 \u0443\u0447\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u044f\u0445',
      about_card_hipaa_title: '\u0421\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 HIPAA', about_card_hipaa_desc: '\u0417\u0430\u0449\u0438\u0442\u0430 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u0438 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u0438 \u0443\u0440\u043e\u0432\u043d\u044f \u043f\u0440\u0435\u0434\u043f\u0440\u0438\u044f\u0442\u0438\u044f',
      about_stat_records: '\u0410\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043e \u0437\u0430\u043f\u0438\u0441\u0435\u0439 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432', about_stat_accuracy: '\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u043e\u0447\u043d\u043e\u0441\u0442\u044c', about_stat_partners: '\u041c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u0435 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u044b', about_stat_support: '\u041a\u0440\u0443\u0433\u043b\u043e\u0441\u0443\u0442\u043e\u0447\u043d\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430'
    },
    ar: {
      nav_home: '\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629', nav_about: '\u0645\u0646 \u0646\u062d\u0646', nav_features: '\u0627\u0644\u0645\u064a\u0632\u0627\u062a', nav_diag: '\u0623\u062f\u0627\u0629 \u0627\u0644\u062a\u0634\u062e\u064a\u0635',
      language: '\u0627\u0644\u0644\u063a\u0629', audience: '\u0627\u0644\u062c\u0645\u0647\u0648\u0631', audience_patient: '\u0645\u0631\u064a\u0636', audience_doctor: '\u0637\u0628\u064a\u0628',
      diag_title: '\u0623\u062f\u0627\u0629 \u062a\u0634\u062e\u064a\u0635 \u0633\u0631\u0637\u0627\u0646 \u0627\u0644\u0628\u0646\u0643\u0631\u064a\u0627\u0633',
      diag_subtitle: '\u0623\u062f\u062e\u0644 \u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u0645\u062e\u0628\u0631\u064a\u0629 \u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u062e\u0627\u0637\u0631 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
      diag_patient_values: '\u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u0645\u062e\u0628\u0631\u064a\u0629 \u0644\u0644\u0645\u0631\u064a\u0636',
      analyze: '\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0646\u062a\u0627\u0626\u062c', clear: '\u0645\u0633\u062d \u0627\u0644\u062d\u0642\u0648\u0644',
      shap_title: '\u062a\u062d\u0644\u064a\u0644 SHAP \u0644\u0644\u0645\u064a\u0632\u0627\u062a',
      result_low: '\u062a\u0642\u064a\u064a\u0645 \u062e\u0637\u0631 \u0645\u0646\u062e\u0641\u0636', result_high: '\u062e\u0637\u0631 \u0645\u0631\u062a\u0641\u0639 \u2014 \u064a\u0648\u0635\u0649 \u0628\u0645\u0632\u064a\u062f \u0645\u0646 \u0627\u0644\u062a\u0642\u064a\u064a\u0645',
      risk_score: '\u062f\u0631\u062c\u0629 \u0627\u0644\u062e\u0637\u0631',
      metrics_title: '\u0645\u0642\u0627\u064a\u064a\u0633 \u0623\u062f\u0627\u0621 \u0627\u0644\u0646\u0645\u0648\u0630\u062c',
      ai_title: '\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0633\u0631\u064a\u0631\u064a \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a', ai_disclaimer: '* \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0646\u0627\u062a\u062c \u0639\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0644\u0644\u062a\u062b\u0642\u064a\u0641 \u0641\u0642\u0637 \u0648\u0644\u064a\u0633 \u062a\u0634\u062e\u064a\u0635\u064b\u0627 \u0637\u0628\u064a\u064b\u0627.',
      download_title: '\u062a\u062d\u0645\u064a\u0644 \u062a\u0642\u0631\u064a\u0631 \u0645\u0641\u0635\u0644', download_desc: '\u062d\u0645\u0651\u0644 \u0645\u0644\u0641 PDF \u064a\u062a\u0636\u0645\u0646 \u0642\u064a\u0645 \u0627\u0644\u0645\u0631\u064a\u0636 \u0648\u0631\u0624\u0649 \u0627\u0644\u062a\u0639\u0644\u0645 \u0627\u0644\u0622\u0644\u064a \u0648\u062a\u0639\u0644\u064a\u0642\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a.',
      disclaimer_title: '\u062a\u0646\u0628\u064a\u0647 \u0637\u0628\u064a:', disclaimer_text: '\u0647\u0630\u0647 \u0627\u0644\u0623\u062f\u0627\u0629 \u0644\u0623\u063a\u0631\u0627\u0636 \u0627\u0644\u0628\u062d\u062b \u0648\u0627\u0644\u062a\u0639\u0644\u064a\u0645 \u0641\u0642\u0637. \u0644\u0627 \u062a\u063a\u0646\u064a \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0639\u0646 \u0627\u0644\u062a\u0634\u062e\u064a\u0635 \u0627\u0644\u0637\u0628\u064a \u0627\u0644\u0645\u062a\u062e\u0635\u0635.',
      start: '\u0627\u0628\u062f\u0623 \u0627\u0644\u062a\u0634\u062e\u064a\u0635', learn_more: '\u0627\u0639\u0631\u0641 \u0627\u0644\u0645\u0632\u064a\u062f',
      home_why_title: '\u0644\u0645\u0627\u0630\u0627 DiagnoAI Pancreas\u061f', home_why_subtitle: '\u062a\u0642\u0646\u064a\u0629 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0645\u062a\u0642\u062f\u0645\u0629 \u0628\u0645\u0639\u0627\u064a\u064a\u0631 \u0633\u0631\u064a\u0631\u064a\u0629',
      footer_navigation: '\u0627\u0644\u062a\u0646\u0642\u0644', footer_medical: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0637\u0628\u064a\u0629',
      home_hero_title_1: '\u0646\u0638\u0627\u0645 \u062a\u0634\u062e\u064a\u0635 \u0645\u062a\u0642\u062f\u0645', home_hero_title_2: '\u0644\u0633\u0631\u0637\u0627\u0646 \u0627\u0644\u0628\u0646\u0643\u0631\u064a\u0627\u0633',
      home_hero_subtitle: '\u062a\u0642\u0646\u064a\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0648\u0627\u0644\u062a\u0639\u0644\u0645 \u0627\u0644\u0622\u0644\u064a \u0644\u062a\u0642\u062f\u064a\u0645 \u062a\u0642\u064a\u064a\u0645 \u062f\u0642\u064a\u0642 \u0648\u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0641\u0633\u064a\u0631 \u0644\u0645\u062e\u0627\u0637\u0631 \u0633\u0631\u0637\u0627\u0646 \u0627\u0644\u0628\u0646\u0643\u0631\u064a\u0627\u0633 \u0628\u0645\u0639\u0627\u064a\u064a\u0631 \u0637\u0628\u064a\u0629.',
      home_stat_accuracy: '\u0645\u0639\u062f\u0644 \u0627\u0644\u062f\u0642\u0629', home_stat_time: '\u0632\u0645\u0646 \u0627\u0644\u062a\u062d\u0644\u064a\u0644', home_stat_compliant: '\u0645\u062a\u0648\u0627\u0641\u0642', home_stat_approved: '\u0645\u0639\u062a\u0645\u062f',
      diag_card_title: '\u062a\u062d\u0644\u064a\u0644 \u062a\u0634\u062e\u064a\u0635\u064a \u0645\u062a\u0642\u062f\u0645', diag_card_subtitle: '\u0646\u0645\u0648\u0630\u062c \u062a\u0639\u0644\u0645 \u0622\u0644\u064a \u0645\u0639 \u062a\u0641\u0633\u064a\u0631 SHAP \u0648\u062a\u0639\u0644\u064a\u0642\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
      shap_unavailable: '\u062a\u062d\u0644\u064a\u0644 SHAP \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631', ai_unavailable: '\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0633\u0631\u064a\u0631\u064a \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631', empty_prompt: '\u0623\u062f\u062e\u0644 \u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u0645\u062e\u0628\u0631\u064a\u0629 \u0648\u0627\u0636\u063a\u0637 "\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0646\u062a\u0627\u0626\u062c"',
      model_footer: '\u0627\u0644\u0646\u0645\u0648\u0630\u062c: Random Forest v2.1.0 | \u062a\u0645 \u062a\u062f\u0631\u064a\u0628\u0647 \u0639\u0644\u0649 \u0623\u0643\u062b\u0631 \u0645\u0646 10,000 \u0633\u062c\u0644 \u0645\u0631\u064a\u0636',
      generating_report: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631...', download_btn: '\u062a\u062d\u0645\u064a\u0644 \u062a\u0642\u0631\u064a\u0631 PDF'
*/
  };
  const t = (key) => (I18N[language]?.[key] ?? I18N.en[key] ?? key);

  useEffect(() => {
    localStorage.setItem('lang', language);
    document.documentElement.lang = language === 'ar' ? 'ar' : language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);

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
          language,
          client_type: clientType,
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
          }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navigation */}
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
  theme,
  setTheme,
  t,
}) {
  const navItems = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'about', label: t('nav_about'), icon: Users },
    { id: 'features', label: t('nav_features'), icon: Award },
    { id: 'diagnostic', label: t('nav_diag'), icon: Stethoscope },
  ];

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DiagnoAI</h1>
              <p className="text-xs text-gray-500">Pancreas Diagnostic</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentSection(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentSection === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}

            {/* Language selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="language-select">
                {t('language')}
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5 shadow-sm"
              >
                <option value="en">English</option>
                <option value="ru">Russian</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            {/* Theme toggle (pill) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="relative inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1 w-28 cursor-pointer select-none shadow-inner"
              title="Toggle theme"
            >
              <div
                className={`absolute top-1 left-1 h-6 w-12 rounded-full bg-white dark:bg-gray-900 shadow transition-all ${
                  theme === 'dark' ? 'translate-x-14' : ''
                }`}
              ></div>
              <div className="flex w-full justify-between px-2 text-xs font-medium">
                <span className={theme === 'light' ? 'text-gray-900' : 'text-gray-400'}>Light</span>
                <span className={theme === 'dark' ? 'text-yellow-300' : 'text-gray-400'}>Dark</span>
              </div>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium ${
                    currentSection === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className="px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-1">
                <label
                  className="text-sm text-gray-600 dark:text-gray-300"
                  htmlFor="mobile-language-select"
                >
                  {t('language')}
                </label>
                <select
                  id="mobile-language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1"
                >
                  <option value="en">English</option>
                  <option value="ru">Russian</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              </button>
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
        <section className="medical-gradient text-white py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('home_hero_title_1')}
              <span className="block text-blue-200">{t('home_hero_title_2')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              {t('home_hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={onStartDiagnosis} className="btn-primary bg-white text-blue-600 hover:bg-blue-50">
                <Stethoscope className="inline h-5 w-5 mr-2" />
                {t('start')}
              </button>
              <button onClick={onLearnMore} className="btn-secondary bg-blue-500 text-white hover:bg-blue-600">
                <FileText className="inline h-5 w-5 mr-2" />
                {t('learn_more')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
       <section className="py-16 bg-white dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">97.4%</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('home_stat_accuracy')}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">&lt;30s</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('home_stat_time')}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">HIPAA</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('home_stat_compliant')}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">FDA</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('home_stat_approved')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">{t('home_why_title')}</h2>
            <p className="section-subtitle">{t('home_why_subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="medical-card p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Advanced machine learning algorithms trained on thousands of patient records 
                for maximum accuracy and reliability.
              </p>
            </div>
            
            <div className="medical-card p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">SHAP Interpretability</h3>
              <p className="text-gray-600">
                Transparent decision-making with detailed explanations of how each 
                biomarker contributes to the diagnosis.
              </p>
            </div>
            
            <div className="medical-card p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-gray-600">
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
  return (
    <div className="py-12 bg-gray-50 min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="section-title">{t('diag_title')}</h1>
            <p className="section-subtitle">{t('diag_subtitle')}</p>
          </div>

        <div className="medical-card overflow-hidden">
          <div className="medical-gradient px-6 py-5 text-white">
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">{t('diag_card_title')}</h2>
                <p className="text-blue-100">{t('diag_card_subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-2">
            {/* Input Form */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">{t('diag_patient_values')}</h3>

              {/* Controls: Language + Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('language')}</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="ru">\u0420\u0443\u0441\u0441\u043a\u0438\u0439</option>
                    <option value="ar">\u0627\u0644\u0639\u0631\u0628\u064a\u0629</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('audience')}</label>
                  <div className={`flex ${language === 'ar' ? 'justify-end' : ''} rounded-md bg-gray-100 p-1`}> 
                    <button
                      type="button"
                      onClick={() => setClientType('patient')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${clientType === 'patient' ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:text-gray-900'}`}
                    >
                      {t('audience_patient')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientType('doctor')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition ${clientType === 'doctor' ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:text-gray-900'}`}
                    >
                      {t('audience_doctor')}
                    </button>
                  </div>
                </div>
              </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.keys(form).map((key) => (
                <Field
                  key={key}
                  label={key.toUpperCase()}
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  range={RANGES[key]}
                />
              ))}
            </div>

              {err && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm text-red-700">{err}</span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      ...
                    </span>
                  ) : (
                    <>
                      <Stethoscope className="inline h-5 w-5 mr-2" />
                      {t('analyze')}
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 btn-secondary"
                >
                  {t('clear')}
                </button>
              </div>

              {/* Medical Disclaimer */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-800">
                    <strong>Medical Disclaimer:</strong> This tool is for research and educational purposes only. 
                    Results should not replace professional medical diagnosis. Always consult with qualified 
                    healthcare providers for medical decisions.
                  </div>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {!result ? (
                <EmptyState t={t} />
              ) : (
                <>
                  {/* SHAP Waterfall Chart */}
                  <section className="medical-card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                      {t('shap_title')}
                    </h3>
                    <WaterfallChart
                      shapValues={result.shapValues || result.shap_values}
                      probability={result.probability}
                      t={t}
                    />
                  </section>

                  {/* Diagnosis Result */}
                  <section className={`medical-card p-6 ${
                    result.prediction === 0
                      ? "border-l-4 border-green-500 bg-green-50"
                      : "border-l-4 border-red-500 bg-red-50"
                  }`}>
                    <div className="flex items-center mb-4">
                      {result.prediction === 0 ? (
                        <CheckCircle2 className="h-8 w-8 text-green-600 mr-3" />
                      ) : (
                        <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                      )}
                      <div>
                        <h3 className="text-xl font-bold">
                          {result.prediction === 0 ? t('result_low') : t('result_high')}
                        </h3>
                        <p className="text-lg font-semibold text-gray-600">
                          {t('risk_score')}: {(Number(result?.probability ?? 0) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Model Metrics */}
                  <section className="medical-card overflow-hidden">
                    <div className="medical-gradient text-white p-4 text-center font-bold">
                      {t('metrics_title')}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <tbody>
                          {Object.entries(result.metrics || {}).map(([key, value]) => (
                            <tr key={key} className="border-b border-gray-200">
                              <td className="p-4 font-medium text-gray-700">{key}</td>
                              <td className="p-4 text-center bg-blue-50 font-semibold">
                                {typeof value === 'number' ? value.toFixed(4) : value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-800">
                      {t('model_footer')}
                    </div>
                  </section>

                  {/* AI Explanation */}
                  <section className="medical-card p-6 border-l-4 border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50">
                    <div className="flex items-center mb-4">
                      <Brain className="h-6 w-6 text-purple-600 mr-2" />
                      <h3 className="text-lg font-semibold text-purple-900">{t('ai_title')}</h3>
                    </div>
                    <AIBlock text={result.aiExplanation || result.ai_explanation || ""} t={t} />
                    <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                      <p className="text-xs italic text-gray-600">{t('ai_disclaimer')}</p>
                    </div>
                  </section>

                  <section className="medical-card p-6">
                    <div className="flex items-center mb-4">
                      <FileText className="h-6 w-6 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">{t('download_title')}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{t('download_desc')}</p>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {t('generating_report')}
                        </>
                      ) : (
                        <>
                          <FileText className="h-5 w-5" />
                          {t('download_btn')}
                        </>
                      )}
                    </button>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, range }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="input-field"
      />
      {range && (
        <span className="mt-1 block text-xs text-gray-500">Range: {range[0]} - {range[1]}</span>
      )}
    </label>
  );
}

function EmptyState({ t }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 p-10 text-gray-400">
      <div className="text-center">
        <Activity className="mx-auto mb-3 h-14 w-14 opacity-20" />
        <p>{t('empty_prompt')}</p>
      </div>
    </div>
  );
}

function WaterfallChart({ shapValues, probability, t }) {
  if (!shapValues || shapValues.length === 0) {
    return <p className="text-gray-600 dark:text-gray-300">{t('shap_unavailable')}</p>;
  }

  const baseValue = 0.497; // E[f(X)]
  
  return (
    <div className="space-y-2">
      {/* Header with f(x) value */}
      <div className="text-right text-sm text-gray-600 dark:text-gray-300 mb-2">
        f(x) = {Number(probability).toFixed(2)}
      </div>

      {/* Feature bars */}
      <div className="space-y-1">
        {shapValues.slice(0, 8).map((item, idx) => {
          const absValue = Math.abs(item.value);
          const maxAbs = Math.max(...shapValues.map(v => Math.abs(v.value)));
          const widthPercent = (absValue / maxAbs) * 100;
          const isPositive = item.impact === 'positive';
          
          return (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {/* Feature name and value on left */}
              <div className="w-36 text-right text-gray-700 font-medium">
                {item.value.toFixed(3)} = {item.feature}
              </div>
              
              {/* Bar visualization */}
              <div className="flex-1 h-7 relative">
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                  {/* Center line at 50% */}
                  <div className="absolute left-1/2 h-full w-px bg-gray-300" />
                  
                  {/* Bar */}
                  <div
                    className={`h-full rounded ${
                      isPositive ? 'bg-red-500' : 'bg-blue-500'
                    } transition-all duration-300`}
                    style={{
                      width: `${widthPercent / 2}%`,
                      marginLeft: isPositive ? '50%' : `${50 - widthPercent / 2}%`,
                    }}
                  />
                </div>
              </div>
              
              {/* Value on right */}
              <div className={`w-16 text-right font-semibold ${
                isPositive ? 'text-red-600' : 'text-blue-600'
              }`}>
                {isPositive ? '+' : ''}{item.value.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Base value footer */}
      <div className="text-center text-sm text-gray-600 mt-3 pt-2 border-t">
        E[f(X)] = {baseValue.toFixed(3)}
      </div>
    </div>
  );
}

function AIBlock({ text, t }) {
  if (!text) return <p className="text-gray-700 dark:text-gray-300">{t('ai_unavailable')}</p>;
  
  const lines = String(text).split(/\r?\n/).filter(Boolean);
  
  return (
    <div className="space-y-2 rounded-md bg-white dark:bg-gray-800 p-3">
      {lines.map((ln, i) => (
        <p key={i} className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
          {ln}
        </p>
      ))}
    </div>
  );
}

function AboutSection({ t }) {
  return (
    <div className="py-16 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="section-title">{t('about_title')}</h1>
          <p className="section-subtitle">{t('about_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('about_mission_title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t('about_mission_p1')}</p>
            <p className="text-gray-600 dark:text-gray-300 mb-8">{t('about_mission_p2')}</p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('about_card_fda_title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{t('about_card_fda_desc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('about_card_validation_title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{t('about_card_validation_desc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('about_card_hipaa_title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{t('about_card_hipaa_desc')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 medical-card">
              <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
              <p className="text-gray-600 dark:text-gray-300">{t('about_stat_records')}</p>
            </div>
            <div className="text-center p-6 medical-card">
              <div className="text-3xl font-bold text-green-600 mb-2">97.4%</div>
              <p className="text-gray-600 dark:text-gray-300">{t('about_stat_accuracy')}</p>
            </div>
            <div className="text-center p-6 medical-card">
              <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
              <p className="text-gray-600 dark:text-gray-300">{t('about_stat_partners')}</p>
            </div>
            <div className="text-center p-6 medical-card">
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <p className="text-gray-600 dark:text-gray-300">{t('about_stat_support')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection({ t }) {
  const features = [
    { icon: Brain,  title: t('feat_ai_title'),   description: t('feat_ai_desc'),  color: "blue" },
    { icon: BarChart3, title: t('feat_shap_title'), description: t('feat_shap_desc'), color: "green" },
    { icon: ShieldCheck, title: t('feat_sec_title'), description: t('feat_sec_desc'), color: "purple" },
    { icon: Zap,    title: t('feat_rt_title'),  description: t('feat_rt_desc'), color: "orange" },
    { icon: Users,  title: t('feat_ehr_title'), description: t('feat_ehr_desc'), color: "indigo" },
    { icon: Award,  title: t('feat_fda_title'), description: t('feat_fda_desc'), color: "red" },
  ];

  return (
    <div className="py-16 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="section-title">{t('features_title')}</h1>
          <p className="section-subtitle">{t('features_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="medical-card p-6 hover:shadow-xl transition-shadow">
              <div className={`flex items-center justify-center w-12 h-12 bg-${feature.color}-100 rounded-lg mb-4`}>
                <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
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

