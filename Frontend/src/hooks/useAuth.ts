import { useCallback, useEffect, useState } from "react";
import { API_BASE, buildAuthHeaders } from "../utils/api";

export type UserRole = "patient" | "doctor" | "researcher" | "admin";

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  organization?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthPayload {
  token: string;
  user: AuthUser;
}

interface SignUpInput {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  organization?: string;
}

interface SignInInput {
  email: string;
  password: string;
}

const TOKEN_KEY = "diagnoai.auth.token";
const USER_KEY = "diagnoai.auth.user";

const safeParseUser = (): AuthUser | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export default function useAuth() {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem(TOKEN_KEY) || "";
  });
  const [user, setUser] = useState<AuthUser | null>(() => safeParseUser());
  const [loading, setLoading] = useState<boolean>(() => Boolean(token));

  const persist = useCallback((payload: AuthPayload | null) => {
    if (typeof window === "undefined") {
      return;
    }

    if (!payload) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
      return;
    }

    window.localStorage.setItem(TOKEN_KEY, payload.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }, []);

  const applyAuth = useCallback(
    (payload: AuthPayload | null) => {
      setToken(payload?.token || "");
      setUser(payload?.user || null);
      persist(payload);
    },
    [persist],
  );

  const authorizedFetch = useCallback(
    (input: string, init: RequestInit = {}) => {
      const headers = buildAuthHeaders(token, init.headers);
      return fetch(input, { ...init, headers });
    },
    [token],
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: buildAuthHeaders(token),
        });
        if (!response.ok) {
          throw new Error("Session expired");
        }
        const data = (await response.json()) as { user?: AuthUser };
        if (!cancelled && data.user) {
          applyAuth({ token, user: data.user });
        }
      } catch {
        if (!cancelled) {
          applyAuth(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [applyAuth, token]);

  const completeAuth = useCallback(
    async (path: string, payload: Record<string, unknown>) => {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as AuthPayload & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      applyAuth(data);
      return data.user;
    },
    [applyAuth],
  );

  const signUp = useCallback(
    (payload: SignUpInput) => completeAuth("/api/auth/signup", payload),
    [completeAuth],
  );

  const signIn = useCallback(
    (payload: SignInInput) => completeAuth("/api/auth/signin", payload),
    [completeAuth],
  );

  const signOut = useCallback(() => {
    applyAuth(null);
    setLoading(false);
  }, [applyAuth]);

  return {
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    signIn,
    signUp,
    signOut,
    authorizedFetch,
  };
}
