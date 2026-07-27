// Dashboard session configuration (PZ-046/PZ-047).
//
// The session holds the backend endpoint + API key entered at login,
// or `mode: "demo"` for the offline prototype experience. Credentials
// live in sessionStorage so reloads survive but closing the tab clears
// them; `clearSession` is the explicit logout path.

export type SessionMode = "live" | "demo";

export interface Session {
  mode: SessionMode;
  endpoint: string;
  apiKey: string;
}

const STORAGE_KEY = "paiziq.dashboard.session";

export function normalizeEndpoint(endpoint: string): string {
  return endpoint.trim().replace(/\/+$/, "");
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    // Never revive credentials written by pre-sessionStorage builds.
    window.localStorage.removeItem(STORAGE_KEY);
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (parsed.mode === "demo") return { mode: "demo", endpoint: "", apiKey: "" };
    if (parsed.mode === "live" && parsed.endpoint && parsed.apiKey) {
      return {
        mode: "live",
        endpoint: normalizeEndpoint(parsed.endpoint),
        apiKey: parsed.apiKey.trim(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  const normalized =
    session.mode === "demo"
      ? { mode: "demo" as const, endpoint: "", apiKey: "" }
      : {
          mode: "live" as const,
          endpoint: normalizeEndpoint(session.endpoint),
          apiKey: session.apiKey.trim(),
        };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.localStorage.removeItem(STORAGE_KEY);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
}
