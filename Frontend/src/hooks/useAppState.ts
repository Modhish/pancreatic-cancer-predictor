import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import i18n, { createTranslator, SUPPORTED_LANGUAGES } from "../translations";
import { RANGES } from "../constants/ranges";
import { fixMojibake } from "../utils/aiAnalysis";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const DEFAULT_LANGUAGE = "en";

// Configure frontend i18n once at module load
i18n.configure({
  locales: SUPPORTED_LANGUAGES.map((l) => l.value),
  defaultLocale: DEFAULT_LANGUAGE,
});

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const SECTION_IDS = ["home", "about", "features", "diagnostic"] as const;
type SectionId = (typeof SECTION_IDS)[number];
const DEFAULT_SECTION: SectionId = "home";
const SECTION_SET = new Set<string>(SECTION_IDS);

const SUPPORTED_LANGUAGE_VALUES = new Set(
  SUPPORTED_LANGUAGES.map((lang) => lang.value),
);

const canonicalSectionPath = (section: SectionId): string =>
  section === "home" ? "/home" : `/${section}`;

const normalizeSectionFromPath = (pathname: string): SectionId => {
  if (!pathname || pathname === "/") {
    return DEFAULT_SECTION;
  }
  const sanitized = pathname
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
  if (!sanitized) {
    return DEFAULT_SECTION;
  }
  return SECTION_SET.has(sanitized) ? (sanitized as SectionId) : DEFAULT_SECTION;
};

type AiPayload = Partial<Record<string, unknown>> | null | undefined;

type Base64Buffer = {
  from: (
    input: string,
    encoding: string,
  ) => {
    toString: (encoding: string) => string;
  };
};

const decodeBase64Utf8 = (value?: string | null): string | null => {
  if (!value) return null;
  try {
    let binary: string | null = null;
    if (typeof atob === "function") {
      binary = atob(value);
    } else if (typeof globalThis !== "undefined") {
      const bufferCtor = (globalThis as { Buffer?: Base64Buffer }).Buffer;
      if (bufferCtor) {
        binary = bufferCtor.from(value, "base64").toString("binary");
      }
    }
    if (!binary) return null;
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    if (typeof TextDecoder !== "undefined") {
      return new TextDecoder("utf-8").decode(bytes);
    }
    let encoded = "";
    bytes.forEach((byte) => {
      encoded += `%${byte.toString(16).padStart(2, "0")}`;
    });
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
};

const getAiExplanationFromPayload = (payload: AiPayload): string => {
  if (!payload) return "";
  const b64 =
    (payload.ai_explanation_b64 as string | undefined) ??
    (payload.aiExplanationB64 as string | undefined);
  const decoded = decodeBase64Utf8(b64);
  if (decoded && decoded.trim()) {
    return fixMojibake(decoded);
  }
  const fallback =
    (payload.ai_explanation as string | undefined) ??
    (payload.aiExplanation as string | undefined) ??
    "";
  return fixMojibake(fallback);
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
} as const;

export type FormState = typeof defaultForm;
export type FormKey = keyof FormState;

export interface AppResult {
  probability?: number;
  risk_level?: string;
  client_type?: string;
  audience_commentaries?: Record<string, string>;
  // Optional per-language cache (key: `${lang}:${audience}`)
  audience_commentaries_by_lang?: Record<string, string>;
  ai_explanation?: string;
  aiExplanation?: string;
  ai_explanation_b64?: string;
  aiExplanationB64?: string;
  shap_values?: any[];
  shapValues?: any[];
  patient_values?: Record<string, number | string>;
  [key: string]: unknown;
}

export interface UseAppState {
  currentSection: string;
  setCurrentSection: (section: string) => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  result: AppResult | null;
  loading: boolean;
  downloading: boolean;
  err: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  clientType: string;
  setClientType: (type: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  analysisRefreshing: boolean;
  t: (key: string) => string;
  validate: { ok: boolean; message: string };
  activeAiExplanation: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => Promise<void>;
  handleDownload: () => Promise<void>;
  handleClear: () => void;
}

export default function useAppState(): UseAppState {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentSection, setCurrentSectionState] =
    useState<SectionId>(() => normalizeSectionFromPath(location.pathname));
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<AppResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientType, setClientType] = useState("patient");
  const [language, setLanguageState] = useState<string>(() => {
    const langFromQuery = searchParams.get("lang");
    if (langFromQuery) {
      const normalizedQuery = langFromQuery.toLowerCase();
      if (SUPPORTED_LANGUAGE_VALUES.has(normalizedQuery)) {
        return normalizedQuery;
      }
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language");
      if (saved) {
        const normalized = saved.toLowerCase();
        if (SUPPORTED_LANGUAGE_VALUES.has(normalized)) {
          return normalized;
        }
      }
      return DEFAULT_LANGUAGE;
    }
    return DEFAULT_LANGUAGE;
  });
  const [analysisRefreshing, setAnalysisRefreshing] = useState(false);
  const inFlightCommentaryKey = useRef<string | null>(null);
  const lastCompletedCommentaryKey = useRef<string | null>(null);

  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    const normalizedSection = normalizeSectionFromPath(location.pathname);
    setCurrentSectionState((prev) =>
      prev === normalizedSection ? prev : normalizedSection,
    );
    const canonicalPath = canonicalSectionPath(normalizedSection);
    if (location.pathname !== canonicalPath) {
      navigate(
        { pathname: canonicalPath, search: location.search },
        { replace: true },
      );
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const langFromQuery = searchParams.get("lang");
    if (langFromQuery) {
      const normalized = langFromQuery.toLowerCase();
      if (SUPPORTED_LANGUAGE_VALUES.has(normalized)) {
        if (normalized !== language) {
          setLanguageState(normalized);
        }
        return;
      }
    }
    const params = new URLSearchParams(searchParams);
    params.set("lang", language);
    setSearchParams(params, { replace: true });
  }, [language, searchParams, setSearchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language);
    }
    try {
      i18n.setLocale(language);
    } catch {
      // ignore
    }
  }, [language]);

  const setCurrentSection = useCallback(
    (section: string) => {
      const normalized = SECTION_SET.has(section)
        ? (section as SectionId)
        : DEFAULT_SECTION;
      setCurrentSectionState((prev) =>
        prev === normalized ? prev : normalized,
      );
      const targetPath = canonicalSectionPath(normalized);
      if (location.pathname !== targetPath) {
        navigate(
          { pathname: targetPath, search: location.search },
          { replace: false },
        );
      }
    },
    [location.pathname, location.search, navigate],
  );

  const setLanguage = useCallback(
    (value: string) => {
      const normalizedValue = (value || DEFAULT_LANGUAGE).toLowerCase();
      const normalized = SUPPORTED_LANGUAGE_VALUES.has(normalizedValue)
        ? normalizedValue
        : DEFAULT_LANGUAGE;
      setLanguageState((prev) =>
        prev === normalized ? prev : normalized,
      );
      const params = new URLSearchParams(searchParams);
      if (params.get("lang") !== normalized) {
        params.set("lang", normalized);
        setSearchParams(params, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = useMemo(() => {
    const fields = Object.entries(form) as [FormKey, string][];
    const errors: string[] = [];
    for (const [key, val] of fields) {
      if (val === "" || Number.isNaN(Number(val))) {
        errors.push(`${key.toUpperCase()}: invalid number`);
        continue;
      }
      const num = Number(val);
      const range = RANGES[key as keyof typeof RANGES];
      if (range && (num < range[0] || num > range[1])) {
        errors.push(
          `${key.toUpperCase()}: ${num} outside normal range (${range[0]}-${range[1]})`,
        );
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
        let msg = `${res.status} ${res.statusText}`;
        try {
          const errJson = await res.json();
          if (errJson?.validation_errors) {
            msg = errJson.validation_errors.join("; ");
          } else if (errJson?.error) {
            msg = errJson.error;
          }
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const data = await res.json();
      const aiExplanation = getAiExplanationFromPayload(data);
      const variants =
        (data.audience_commentaries as Record<string, string> | undefined) ??
        {};
      if (!variants[clientType]) {
        variants[clientType] = aiExplanation;
      }
      const langKey = `${language}:${clientType}`;
      const perLang: Record<string, string> = { [langKey]: aiExplanation };
      for (const [aud, text] of Object.entries(variants)) {
        perLang[`${language}:${aud}`] = text;
      }
      setResult({
        ...data,
        ai_explanation: aiExplanation,
        client_type: clientType,
        audience_commentaries: variants,
        audience_commentaries_by_lang: perLang,
      });
    } catch (e) {
      setErr(
        `Failed to reach the server. Make sure Flask is running on ${API_BASE} (error: ${e.message})`,
      );
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
      const patientPayload = result.patient_values
        ? { ...result.patient_values }
        : { ...form };
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
            language,
          },
          language,
        }),
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
        } catch {
          // ignore
        }
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
    setForm(
      Object.keys(defaultForm).reduce(
        (acc, k) => ({ ...acc, [k]: "" }),
        {},
      ),
    );
    setResult(null);
    setErr("");
  };

  const baseAiExplanation = getAiExplanationFromPayload(result);
  const activeAiExplanation =
    result?.audience_commentaries_by_lang?.[`${language}:${clientType}`] ??
    result?.audience_commentaries?.[clientType] ??
    baseAiExplanation;

  useEffect(() => {
    if (!result) {
      return;
    }

    const lang = String(language || "en").toLowerCase();
    const currentLang = String(result.language || "").toLowerCase();
    const cachedLangKey = `${lang}:${clientType}`;
    const cached =
      result.audience_commentaries_by_lang?.[cachedLangKey] ??
      result.audience_commentaries?.[clientType];

    if (
      cached &&
      currentLang === lang &&
      result.ai_explanation === cached &&
      result.client_type === clientType
    ) {
      // We already have the right commentary; no fetch needed.
      setAnalysisRefreshing(false);
      return;
    }

    const commentaryKey = `${lang}:${clientType}:${
      result.ai_explanation_b64 || result.ai_explanation || ""
    }:${result.probability ?? ""}:${result.prediction ?? ""}`;

    if (
      inFlightCommentaryKey.current === commentaryKey ||
      lastCompletedCommentaryKey.current === commentaryKey
    ) {
      return;
    }

    inFlightCommentaryKey.current = commentaryKey;

    let cancelled = false;
    const regenerateForAudience = async () => {
      setAnalysisRefreshing(true);
      try {
        const response = await fetch(`${API_BASE}/api/commentary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis: result,
            patient_values: result.patient_values,
            shap_values: result.shap_values || result.shapValues || [],
            language,
            client_type: clientType,
          }),
        });
        if (!response.ok) {
          let msg = `${response.status} ${response.statusText}`;
          try {
            const errJson = await response.json();
            if (errJson?.error) msg = errJson.error;
          } catch {
            // ignore
          }
          throw new Error(msg);
        }
        const data = await response.json();
        const newText = getAiExplanationFromPayload(data);
        if (cancelled) return;
        setResult((prev) => {
          if (!prev) return prev;
          const incomingLanguage = data.language || language;
          const prevLanguage = String(prev.language || "").toLowerCase();
          const shouldResetMap =
            String(incomingLanguage || "").toLowerCase() !== prevLanguage;
          const previousMap = shouldResetMap ? {} : prev.audience_commentaries ?? {};
          const previousByLang = shouldResetMap
            ? {}
            : prev.audience_commentaries_by_lang ?? {};
          const mergedMap = {
            ...previousMap,
            ...(data.audience_commentaries as Record<string, string> | undefined ?? {}),
          };
          const mergedByLang: Record<string, string> = { ...previousByLang };
          if (newText) {
            mergedMap[clientType] = newText;
            mergedByLang[`${incomingLanguage}:${clientType}`] = newText;
          }
          const audienceFromApi =
            (data.audience_commentaries as Record<string, string> | undefined) ?? {};
          for (const [aud, text] of Object.entries(audienceFromApi)) {
            mergedByLang[`${incomingLanguage}:${aud}`] = text;
          }
          return {
            ...prev,
            ai_explanation: newText ?? prev.ai_explanation,
            ai_explanation_b64:
              data.ai_explanation_b64 ?? prev.ai_explanation_b64,
            audience_commentaries: mergedMap,
            audience_commentaries_by_lang: mergedByLang,
            client_type: clientType,
            language: incomingLanguage,
            risk_level: data.risk_level || prev.risk_level,
            prediction:
              typeof data.prediction === "number"
                ? data.prediction
                : prev.prediction,
            probability:
              typeof data.probability === "number"
                ? data.probability
                : prev.probability,
          };
        });
      } catch (e) {
        if (!cancelled) {
          setErr(`Failed to refresh commentary: ${e.message}`);
        }
      } finally {
        if (!cancelled) {
          setAnalysisRefreshing(false);
        }
        inFlightCommentaryKey.current = null;
        lastCompletedCommentaryKey.current = commentaryKey;
      }
    };

    regenerateForAudience();
    return () => {
      cancelled = true;
    };
  }, [language, clientType, result]);

  return {
    // state
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
    // derived
    t,
    validate,
    activeAiExplanation,
    // handlers
    handleChange,
    handleSubmit,
    handleDownload,
    handleClear,
  };
}
