import React from "react";
import { Lock, Shield } from "lucide-react";

interface AuthRequiredPageProps {
  title: string;
  description: string;
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function AuthRequiredPage({
  title,
  description,
  onSignIn,
  onSignUp,
}: AuthRequiredPageProps): JSX.Element {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-8">
      <div className="card-sleek rounded-[2rem] p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-[var(--text)]">
          {title}
        </h1>
        <p className="mt-4 text-base leading-8 text-[var(--muted)]">
          {description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/25"
          >
            <Lock className="h-4 w-4" />
            Sign In
          </button>
          <button
            type="button"
            onClick={onSignUp}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)]"
          >
            Create Account
          </button>
        </div>
      </div>
    </section>
  );
}
