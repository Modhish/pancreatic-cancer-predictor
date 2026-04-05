export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export const buildAuthHeaders = (
  token?: string,
  headers: HeadersInit = {},
): HeadersInit => {
  const normalized = new Headers(headers);
  if (token) {
    normalized.set("Authorization", `Bearer ${token}`);
  }
  return normalized;
};

