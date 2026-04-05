import React, { useEffect, useState } from "react";
import {
  Lock,
  Microscope,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { UserRole } from "../hooks/useAuth";

interface AuthPageProps {
  mode: "signin" | "signup";
  onSignIn: (payload: { email: string; password: string }) => Promise<void>;
  onSignUp: (payload: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
    organization?: string;
  }) => Promise<void>;
  onSwitchMode: (mode: "signin" | "signup") => void;
}

const roleCards: Array<{
  role: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    role: "patient",
    title: "Patient",
    description: "Track your own results and follow changes over time.",
    icon: User,
  },
  {
    role: "doctor",
    title: "Doctor",
    description: "Sign analyses with patient names and review your case history.",
    icon: Stethoscope,
  },
  {
    role: "researcher",
    title: "Researcher",
    description: "Study stored analyses in a dedicated analytics dashboard.",
    icon: Microscope,
  },
];

export default function AuthPage({
  mode,
  onSignIn,
  onSignUp,
  onSwitchMode,
}: AuthPageProps): JSX.Element {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [organization, setOrganization] = useState("");
  const showOrganizationField =
    mode === "signup" && (role === "doctor" || role === "researcher");

  useEffect(() => {
    if (!showOrganizationField && organization) {
      setOrganization("");
    }
  }, [organization, showOrganizationField]);

  const handleSubmit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") {
        await onSignIn({ email, password });
      } else {
        await onSignUp({
          full_name: fullName,
          email,
          password,
          role,
          organization: showOrganizationField ? organization : undefined,
        });
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Request failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id={mode}
      className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 lg:px-12"
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="card-sleek rounded-[2rem] p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
            Secure Access
          </div>

          <h1 className="mt-6 font-display text-4xl font-bold text-[var(--text)]">
            {mode === "signin"
              ? "Sign in to your DiagnoAI workspace."
              : "Create a role-based DiagnoAI account."}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
            {mode === "signin"
              ? "Access your saved analyses, profile history, and role-specific tools."
              : "Choose the role that matches how you will use the platform. Your account controls history, signed analyses, and access to researcher analytics."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {roleCards.map(({ role: cardRole, title, description, icon: Icon }) => {
              const selected = role === cardRole;
              return (
                <button
                  key={cardRole}
                  type="button"
                  onClick={() => setRole(cardRole)}
                  disabled={mode === "signin"}
                  className={`rounded-3xl border p-5 text-left transition ${
                    selected
                      ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--surface)_80%,var(--accent)_8%)]"
                      : "border-[var(--border)] bg-[var(--surface-2)]"
                  } ${mode === "signin" ? "cursor-default opacity-70" : ""}`}
                >
                  <Icon className="h-5 w-5 text-[var(--accent)]" />
                  <p className="mt-4 font-display text-lg font-semibold text-[var(--text)]">
                    {title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-sleek rounded-[2rem] p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-[var(--text)]">
                {mode === "signin" ? "Sign In" : "Sign Up"}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {mode === "signin"
                  ? "Use your registered account to continue."
                  : "Create your credentials and role profile."}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                  Full name
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                  placeholder="Ahmed Mohamed"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                placeholder="name@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                placeholder="Minimum 8 characters"
              />
            </label>

            {mode === "signup" && (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                    Account role
                  </span>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value as UserRole)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                  >
                    {roleCards.map((item) => (
                      <option key={item.role} value={item.role}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>

                {showOrganizationField && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                      Organization
                    </span>
                    <input
                      type="text"
                      value={organization}
                      onChange={(event) => setOrganization(event.target.value)}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                      placeholder="Hospital, lab, or university"
                    />
                  </label>
                )}
              </>
            )}
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-4 font-display text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-[var(--accent)]/30 transition hover:brightness-110 disabled:opacity-60"
          >
            {busy
              ? "Please wait..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>

          <p className="mt-5 text-sm text-[var(--muted)]">
            {mode === "signin"
              ? "Need a new account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => onSwitchMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-[var(--accent)]"
            >
              {mode === "signin" ? "Create one" : "Sign in instead"}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
