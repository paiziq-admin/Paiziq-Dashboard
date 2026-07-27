import type { ReactNode } from "react";
import { AlertTriangle, Ban, RefreshCw } from "lucide-react";
import { ApiError } from "../../../api/client";
import type { Environment } from "../../../api/types";
import { useWorkspace } from "../../../context/DashboardContext";
import { ActionButton, EmptyState, GlassPanel } from "../../primitives";

export type AdminEnvironment = Environment & { org_name: string };

export function useAdminEnvironments() {
  const workspace = useWorkspace();
  return {
    environments: workspace.environments.map((environment) => ({
      ...environment,
      org_name: workspace.selectedOrganization?.name ?? environment.org_id,
    })),
    selectedId: workspace.environmentId,
    setSelectedId: workspace.setEnvironmentId,
    loading: workspace.loading,
    error: workspace.error,
    reload: workspace.refreshWorkspace,
  };
}

export function EnvironmentSelect({
  environments,
  value,
  onChange,
  className = "",
}: {
  environments: AdminEnvironment[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 items-center gap-[8px] text-[12px] font-bold ${className}`}>
      <span className="whitespace-nowrap text-[var(--muted-foreground)]">Environment</span>
      <select
        aria-label="Admin environment"
        className="control min-w-0 max-w-[280px]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {environments.map((environment) => (
          <option key={environment.id} value={environment.id}>
            {environment.org_name} / {environment.name} ({environment.kind})
          </option>
        ))}
      </select>
    </label>
  );
}

export function LoadingPanel({ label = "Loading" }: { label?: string }) {
  return (
    <GlassPanel className="flex min-h-[180px] items-center justify-center gap-[9px] p-[24px] text-[13px] text-[var(--muted-foreground)]">
      <span className="status-spinner" />
      {label}
    </GlassPanel>
  );
}

export function ErrorPanel({
  error,
  onRetry,
  title,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const forbidden = error instanceof ApiError && error.status === 403;
  const unauthorized = error instanceof ApiError && error.status === 401;
  const heading =
    title ??
    (forbidden
      ? "Permission denied"
      : unauthorized
        ? "Authentication required"
        : "Could not load this data");
  const body = forbidden
    ? "This API key does not have permission to use this capability."
    : unauthorized
      ? "Connect a live backend session with a valid API key, then try again."
      : errorMessage(error);

  return (
    <GlassPanel>
      <EmptyState
        title={heading}
        body={body}
        icon={forbidden ? <Ban size={22} /> : <AlertTriangle size={22} />}
        action={onRetry ? "Try again" : undefined}
        onAction={onRetry}
      />
    </GlassPanel>
  );
}

export function CapabilityNotice({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "warning" | "success";
}) {
  const borderColor =
    tone === "warning"
      ? "rgba(217,151,59,0.28)"
      : tone === "success"
        ? "rgba(74,138,104,0.28)"
        : "var(--border)";
  const background =
    tone === "warning"
      ? "rgba(217,151,59,0.10)"
      : tone === "success"
        ? "rgba(74,138,104,0.10)"
        : "var(--muted)";
  const color =
    tone === "warning"
      ? "var(--warning-text)"
      : tone === "success"
        ? "var(--success-text)"
        : "var(--text-secondary)";
  return (
    <div
      className="rounded-[10px] border p-[10px_12px] text-[12px]"
      style={{ borderColor, background, color }}
    >
      <div className="mb-[2px] font-bold">{title}</div>
      {children}
    </div>
  );
}

export function RefreshButton({
  busy,
  onClick,
  label = "Refresh",
}: {
  busy?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <ActionButton disabled={busy} onClick={onClick} type="button">
      <RefreshCw className={busy ? "animate-spin" : ""} size={13} />
      <span className="ml-[6px]">{label}</span>
    </ActionButton>
  );
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

export function formatTimestamp(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function formatJsonValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
