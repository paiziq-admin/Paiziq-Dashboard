import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, apiFetch } from "../api/client";
import {
  clearSession,
  loadSession,
  normalizeEndpoint,
  saveSession,
  type Session,
} from "../api/config";
import { fetchEnvironments, fetchOrgs } from "../api/resources";
import type { Environment, Org } from "../api/types";

export type TimeRange = "24h" | "7d" | "30d";

export const TIME_RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const RANGE_MS: Record<TimeRange, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function getTimeBounds(range: TimeRange, now = Date.now()) {
  return { from_ms: now - RANGE_MS[range], to_ms: now };
}

interface SessionContextValue {
  session: Session | null;
  notice: string | null;
  signIn: (endpoint: string, apiKey: string) => Promise<void>;
  enterDemo: () => void;
  signOut: () => void;
}

interface WorkspaceContextValue {
  organizations: Org[];
  environments: Environment[];
  organizationId: string;
  environmentId: string;
  selectedOrganization: Org | null;
  selectedEnvironment: Environment | null;
  timeRange: TimeRange;
  loading: boolean;
  error: ApiError | null;
  setOrganizationId: (id: string) => void;
  setEnvironmentId: (id: string) => void;
  setTimeRange: (range: TimeRange) => void;
  refreshWorkspace: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const WORKSPACE_KEY = "paiziq.dashboard.workspace";

interface StoredWorkspace {
  organizationId?: string;
  environmentId?: string;
  timeRange?: TimeRange;
}

function loadWorkspace(): StoredWorkspace {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(WORKSPACE_KEY) ?? "{}") as StoredWorkspace;
  } catch {
    return {};
  }
}

function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const expire = () => {
      clearSession();
      setSession(null);
      setNotice("Your session expired. Sign in again to continue.");
    };
    window.addEventListener("paiziq:session-expired", expire);
    return () => window.removeEventListener("paiziq:session-expired", expire);
  }, []);

  const signIn = useCallback(async (endpointInput: string, apiKeyInput: string) => {
    const endpoint = normalizeEndpoint(endpointInput);
    const apiKey = apiKeyInput.trim();
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      throw new ApiError(0, "invalid_endpoint", "Enter a complete backend URL.");
    }
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new ApiError(0, "invalid_endpoint", "Backend URL must use HTTP or HTTPS.");
    }
    if (!apiKey) {
      throw new ApiError(0, "missing_api_key", "Enter an API key.");
    }

    // A one-row read probe verifies both connectivity and read scope before
    // credentials are persisted.
    await apiFetch<unknown[]>("/v1/agents?limit=1", { endpoint, apiKey });
    const next: Session = { mode: "live", endpoint, apiKey };
    saveSession(next);
    setSession(next);
    setNotice(null);
  }, []);

  const enterDemo = useCallback(() => {
    const next: Session = { mode: "demo", endpoint: "", apiKey: "" };
    saveSession(next);
    setSession(next);
    setNotice(null);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
    setNotice(null);
  }, []);

  const value = useMemo(
    () => ({ session, notice, signIn, enterDemo, signOut }),
    [enterDemo, notice, session, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const stored = useMemo(loadWorkspace, []);
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [organizationId, setOrganizationId] = useState(stored.organizationId ?? "");
  const [environmentId, setEnvironmentId] = useState(stored.environmentId ?? "");
  const [timeRange, setTimeRange] = useState<TimeRange>(
    TIME_RANGE_OPTIONS.some((item) => item.value === stored.timeRange)
      ? stored.timeRange!
      : "24h",
  );
  const [orgLoading, setOrgLoading] = useState(false);
  const [envLoading, setEnvLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);
  const selectOrganization = useCallback((id: string) => {
    setOrganizationId(id);
    setEnvironmentId("");
    setEnvironments([]);
  }, []);

  useEffect(() => {
    if (session?.mode !== "live") {
      setOrganizations([]);
      setEnvironments([]);
      setOrganizationId("");
      setEnvironmentId("");
      setError(null);
      setOrgLoading(false);
      setEnvLoading(false);
      return;
    }

    let active = true;
    setOrgLoading(true);
    setError(null);
    fetchOrgs()
      .then(({ data }) => {
        if (!active) return;
        setOrganizations(data);
        setOrganizationId((current) =>
          data.some((org) => org.id === current) ? current : (data[0]?.id ?? ""),
        );
      })
      .catch((cause) => {
        if (!active) return;
        setOrganizations([]);
        setOrganizationId("");
        setError(toApiError(cause));
      })
      .finally(() => {
        if (active) setOrgLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision, session]);

  useEffect(() => {
    if (session?.mode !== "live" || !organizationId) {
      setEnvironments([]);
      setEnvironmentId("");
      setEnvLoading(false);
      return;
    }

    let active = true;
    setEnvLoading(true);
    setError(null);
    fetchEnvironments(organizationId)
      .then(({ data }) => {
        if (!active) return;
        setEnvironments(data);
        setEnvironmentId((current) =>
          data.some((environment) => environment.id === current)
            ? current
            : (data[0]?.id ?? ""),
        );
      })
      .catch((cause) => {
        if (!active) return;
        setEnvironments([]);
        setEnvironmentId("");
        setError(toApiError(cause));
      })
      .finally(() => {
        if (active) setEnvLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, revision, session]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({ organizationId, environmentId, timeRange }),
    );
  }, [environmentId, organizationId, timeRange]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      organizations,
      environments,
      organizationId,
      environmentId,
      selectedOrganization:
        organizations.find((organization) => organization.id === organizationId) ?? null,
      selectedEnvironment:
        environments.find((environment) => environment.id === environmentId) ?? null,
      timeRange,
      loading: orgLoading || envLoading,
      error,
      setOrganizationId: selectOrganization,
      setEnvironmentId,
      setTimeRange,
      refreshWorkspace: () => setRevision((value) => value + 1),
    }),
    [
      environmentId,
      environments,
      envLoading,
      error,
      orgLoading,
      organizationId,
      organizations,
      selectOrganization,
      timeRange,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </SessionProvider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside DashboardProviders");
  return value;
}

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside DashboardProviders");
  return value;
}

function toApiError(cause: unknown): ApiError {
  return cause instanceof ApiError
    ? cause
    : new ApiError(0, "unknown_error", cause instanceof Error ? cause.message : String(cause));
}
