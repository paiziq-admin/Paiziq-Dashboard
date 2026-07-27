import type { ReactNode } from "react";
import { AlertTriangle, LockKeyhole, RefreshCw } from "lucide-react";
import { ApiError } from "../../api/client";
import { ActionButton, EmptyState, GlassPanel } from "../primitives";

interface AsyncBoundaryProps {
  loading: boolean;
  error?: unknown;
  empty?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  loadingLabel?: string;
  onRetry?: () => void;
  children: ReactNode;
}

export function AsyncBoundary({
  loading,
  error,
  empty = false,
  emptyTitle = "Nothing here yet",
  emptyBody = "New data will appear here when it becomes available.",
  loadingLabel = "Loading live data",
  onRetry,
  children,
}: AsyncBoundaryProps) {
  if (loading) return <LoadingState label={loadingLabel} />;

  if (error) {
    const apiError = error instanceof ApiError ? error : null;
    if (apiError?.status === 404) {
      return (
        <GlassPanel>
          <EmptyState
            title="Resource not found"
            body={apiError.message || "This resource may have been removed or the link may be out of date."}
            action={onRetry ? "Try again" : undefined}
            onAction={onRetry}
          />
        </GlassPanel>
      );
    }
    if (apiError?.status === 403) {
      return (
        <GlassPanel>
          <EmptyState
            icon={<LockKeyhole size={22} />}
            title="Permission denied"
            body="This API key does not have permission to read this resource. Ask an administrator for a read-capable role."
          />
        </GlassPanel>
      );
    }
    return (
      <GlassPanel>
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title={apiError?.status === 429 ? "Too many requests" : "Live data is unavailable"}
          body={
            apiError?.status === 429
              ? `The backend asked us to slow down. Try again${apiError.retryAfterSeconds ? ` in ${apiError.retryAfterSeconds}s` : " shortly"}.`
              : (apiError?.message ?? (error instanceof Error ? error.message : "The request could not be completed."))
          }
          action={onRetry ? "Try again" : undefined}
          onAction={onRetry}
        />
      </GlassPanel>
    );
  }

  if (empty) {
    return (
      <GlassPanel>
        <EmptyState title={emptyTitle} body={emptyBody} />
      </GlassPanel>
    );
  }

  return children;
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <GlassPanel className="flex min-h-[220px] items-center justify-center p-[32px]">
      <div className="flex flex-col items-center gap-[12px] text-[12.5px] font-semibold text-[var(--muted-foreground)]">
        <span className="status-spinner h-[22px] w-[22px]" />
        <span>{label}...</span>
      </div>
    </GlassPanel>
  );
}

export function InlineError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-[10px] rounded-[10px] border border-[rgba(192,91,71,0.24)] bg-[rgba(192,91,71,0.10)] p-[10px_12px] text-[12.5px] text-[var(--danger-text)]">
      <span>{message}</span>
      {onRetry ? (
        <ActionButton className="h-[30px]" onClick={onRetry}>
          <RefreshCw size={13} /> Retry
        </ActionButton>
      ) : null}
    </div>
  );
}
