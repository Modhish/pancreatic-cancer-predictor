import React, { useMemo, useState } from "react";
import {
  Activity, Brain, CheckCircle2, AlertTriangle, Gauge, Loader2, ShieldCheck,
} from "lucide-react";
import Plot from "react-plotly.js";

/**
 * CONFIG
 * You can override API URL with a Vite env var:
 *   VITE_API_URL=http://127.0.0.1:5000
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const defaultForm = {
  wbc: "5.8",
  rbc: "4",
  plt: "184",
  hgb: "127",
  hct: "40",
  mpv: "11",
  pdw: "16",
  mono: "0.42",
  baso_abs: "0.01",
  baso_pct: "0.2",
  glucose: "6.3",
  act: "26",
  bilirubin: "17",
};

export default function App() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [llmExplanation, setLlmExplanation] = useState(""); // LLM Explanation

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const validate = useMemo(() => {
    // Simple numeric validation; you can tighten ranges if you want
    const fields = Object.entries(form);
    const bad = fields.filter(([, v]) => v === "" || Number.isNaN(Number(v)));
    return {
      ok: bad.length === 0,
      message: bad.length
        ? `Please check the numeric values: ${bad.map(([k]) => k).join(", ")}`
        : "",
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
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setResult(data);
      setLlmExplanation(data.aiExplanation || "No LLM explanation available.");
    } catch (e) {
      setErr(`Failed to reach the server. Make sure Flask is running on ${API_BASE} (error: ${e.message})`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setForm(Object.keys(defaultForm).reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
    setResult(null);
    setErr("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-3">
          <Activity className="h-7 w-7 text-indigo-700" />
          <h1 className="text-2xl font-bold text-indigo-900">
            Pancreatic Cancer Diagnostic Tool
          </h1>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
            <p className="text-blue-100">
              Machine learning system with SHAP interpretation and LLM commentary
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
            {/* LEFT: form */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Input Data</h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.keys(form).map((key) => (
                  <Field
                    key={key}
                    label={key.toUpperCase()}
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                  />
                ))}
              </div>

              {err && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  {err}
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" /> Calculating…
                    </span>
                  ) : (
                    "Calculate"
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-600"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* RIGHT: results */}
            <div className="space-y-4">
              {!result ? (
                <EmptyState />
              ) : (
                <>
                  {/* SHAP Diagram */}
                  <section className="rounded-xl bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-800">Results</h3>
                    <div className="mb-2 text-sm text-gray-600">
                      f(x) = {Number(result?.probability ?? 0).toFixed(2)}
                    </div>

                    <Plot
                      data={[
                        {
                          type: "bar",
                          orientation: "h", // horizontal bar chart
                          x: result.shapValues.map((val) => val.value),
                          y: result.shapValues.map((val) => val.feature),
                          marker: {
                            color: result.shapValues.map((val) =>
                              val.impact === "positive" ? "rgb(255, 99, 132)" : "rgb(54, 162, 235)"
                            ),
                          },
                        },
                      ]}
                      layout={{
                        title: "SHAP Feature Impact",
                        xaxis: { title: "SHAP Value" },
                        yaxis: { title: "Features", showgrid: false },
                        margin: { l: 150, t: 20, r: 20, b: 20 },
                        showlegend: false,
                      }}
                    />
                  </section>

                  {/* Verdict */}
                  <section className={`rounded-xl p-4 ${result.prediction === 0
                      ? "border-2 border-green-500 bg-green-50"
                      : "border-2 border-red-500 bg-red-50"
                    }`}>
                    <div className="mb-2 flex items-center gap-2">
                      {result.prediction === 0 ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      )}
                      <h3 className="text-lg font-bold">
                        Result: {result.prediction === 0
                          ? "No disease suspected"
                          : "Further examination required"}
                      </h3>
                    </div>
                    <p className="text-xl font-semibold">
                      ({Number(result?.probability ?? 0).toFixed(2)})
                    </p>
                  </section>

                  {/* LLM Explanation */}
                  <section className="rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <h3 className="font-bold text-purple-900">AI Analysis</h3>
                    </div>

                    <AIBlock text={llmExplanation} />

                    <div className="mt-3 text-xs italic text-gray-600">
                      * This analysis is generated by AI based on SHAP interpretation. It does not replace a doctor's consultation.
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>

        <footer className="mx-auto mt-6 flex max-w-7xl items-center justify-end gap-2 text-sm text-gray-500">
          <Gauge className="h-4 w-4" />
          <span>Frontend • Vite + React + Tailwind</span>
          <span>•</span>
          <ShieldCheck className="h-4 w-4" />
          <span>Backend • Flask @ {API_BASE}</span>
        </footer>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function Field({ label, name, value, onChange }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 p-10 text-gray-400">
      <div className="text-center">
        <Activity className="mx-auto mb-3 h-14 w-14 opacity-20" />
        <p>Enter lab results and click "Calculate"</p>
      </div>
    </div>
  );
}

function AIBlock({ text }) {
  if (!text) return <p className="text-gray-700">—</p>;
  const lines = String(text).split(/\r?\n/).filter(Boolean);
  return (
    <div className="space-y-2 rounded-md bg-white p-3">
      {lines.map((ln, i) => (
        <p key={i} className="text-gray-800">
          {ln}
        </p>
      ))}
    </div>
  );
}
