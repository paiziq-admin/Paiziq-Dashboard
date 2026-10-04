import { useEffect, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { ApiError } from "../../../api/client";
import { fetchPaymentExecution } from "../../../api/resources";
import type { Payment, PaymentExecutionEvidence } from "../../../api/types";
import { formatDateTime } from "../../../lib/formatters";
import { ActionButton, EmptyState, GlassPanel, KeyValueGrid, StatusBadge } from "../../primitives";
import { TraceJsonViewer } from "./TraceJsonViewer";

const states = {
  reserved: { label: "Reserved", tone: "warning", description: "Funds are reserved. The provider request has not started." },
  submitted: { label: "In progress", tone: "warning", description: "The provider request has started. Wait for its result. Do not submit another payment." },
  confirmed: { label: "Confirmed", tone: "success", description: "The executor recorded a successful provider result. The reserved amount is committed." },
  failed: { label: "Failed", tone: "danger", description: "The executor recorded a failed provider result. Inspect the evidence before you create a new request." },
  unknown: { label: "Unknown", tone: "warning", description: "The provider result is unknown. Do not retry this payment. Reconcile the existing request with the provider first. Its funds remain reserved." },
} as const;

/** Read-only: payment approval and legacy terminal states never prove a charge. */
export function ExecutionEvidencePanel({ payment }: { payment: Payment }) {
  const [result, setResult] = useState<PaymentExecutionEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setResult(null);
    fetchPaymentExecution(payment.id)
      .then(({ data }) => { if (active) setResult(data); })
      .catch((cause) => { if (active) setError(cause); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [payment.id, revision]);

  return (
    <GlassPanel className="mb-[16px] min-w-0 p-[20px]" aria-label="Execution evidence">
      <div className="mb-[12px] flex flex-wrap items-center justify-between gap-[10px]">
        <h2 className="panel-title mb-0">Execution Evidence</h2>
        <ActionButton className="h-[31px]" disabled={loading} onClick={() => setRevision((value) => value + 1)}>
          <RefreshCw size={13} /> Refresh evidence
        </ActionButton>
      </div>
      {loading ? (
        <p className="m-0 text-[12.5px] text-[var(--muted-foreground)]" role="status">Loading execution evidence...</p>
      ) : error ? (
        <EvidenceError error={error} />
      ) : result ? (
        <EvidenceContent evidence={result} />
      ) : (
        <EmptyState title="Execution evidence unavailable" body="No execution evidence was returned. Payment approval does not confirm a charge." />
      )}
    </GlassPanel>
  );
}

function EvidenceError({ error }: { error: unknown }) {
  const status = error instanceof ApiError ? error.status : null;
  const message = status === 404
    ? "This server has no execution evidence for this payment. Older servers may not support this view. The payment state does not confirm a provider result."
    : status === 403
      ? "This API key cannot read execution evidence. Use a read-capable key for this environment."
      : status === 429
        ? `The server limited this request. Refresh evidence${error instanceof ApiError && error.retryAfterSeconds ? ` after ${error.retryAfterSeconds} seconds` : " later"}.`
        : "Execution evidence could not be loaded. Refresh evidence to try the read again. The payment state does not confirm a provider result.";
  return <div role="alert"><EmptyState title={status === 403 ? "Execution evidence permission denied" : "Execution evidence unavailable"} body={message} /></div>;
}

function EvidenceContent({ evidence }: { evidence: PaymentExecutionEvidence }) {
  const execution = evidence.execution;
  const state = execution ? states[execution.status] : null;
  const legacyTerminal = !execution && ["executed", "failed"].includes(evidence.legacy_state);
  const budget = evidence.budget;
  return (
    <>
      <div className="mb-[14px] flex flex-wrap items-start gap-[10px]" role={execution?.status === "unknown" ? "alert" : "status"}>
        <StatusBadge tone={state?.tone ?? "neutral"}>{state?.label ?? (legacyTerminal ? "Unverified legacy report" : "Not started")}</StatusBadge>
        <p className="m-0 min-w-0 flex-1 text-[12.5px] leading-[1.6] text-[var(--text-secondary)]">
          {state?.description ?? (legacyTerminal
            ? `The payment has a legacy ${evidence.legacy_state} state. No managed execution claim confirms the provider result.`
            : "No managed execution claim is recorded. Approval alone does not confirm a charge.")}
        </p>
      </div>
      <div className="responsive-stack grid min-w-0 grid-cols-2 gap-[20px]">
        <div className="min-w-0">
          <h3 className="label-caps mb-[10px]">Authorization and reservation</h3>
          <KeyValueGrid rows={[
            ["Authority", "Hosted service"],
            ["Execution ID", <Identifier value={execution?.id} />],
            ["Logical action", <Identifier value={execution?.logical_action_id} />],
            ["Authorized amount", execution ? exactAmount(execution.amount, execution.currency) : "Not recorded"],
            ["Decision ID", <Identifier value={execution?.decision_id} />],
            ["Policy version", execution ? execution.policy_version ?? "Default policy" : "Not recorded"],
            ["Reservation", evidence.reservation ? `${exactAmount(evidence.reservation.amount, evidence.reservation.currency)} · ${evidence.reservation.status}` : "None recorded"],
            ["Provider reference", <Identifier value={execution?.gateway_reference} />],
            ["Last update", execution ? formatDateTime(execution.updated_at_ms) : "Not recorded"],
          ]} />
        </div>
        <div className="min-w-0">
          <h3 className="label-caps mb-[10px]">Scoped spend · {budget.currency}</h3>
          <KeyValueGrid rows={[
            ["Organization", <Identifier value={budget.scope.org_id} />],
            ["Environment", <Identifier value={budget.scope.env_id} />],
            ["Agent", <Identifier value={budget.scope.agent_id} />],
            ["As of", formatDateTime(budget.as_of_ms)],
            ["Committed · past 24 h", exactAmount(budget.committed_amount, budget.currency)],
            ["Reserved · all unresolved", exactAmount(budget.reserved_amount, budget.currency)],
            ["Daily limit", budget.daily_budget == null ? "No limit recorded" : exactAmount(budget.daily_budget, budget.currency)],
            ["Committed · past 30 days", exactAmount(budget.monthly_committed_amount, budget.currency)],
            ["Monthly limit", budget.monthly_budget == null ? "No limit recorded" : exactAmount(budget.monthly_budget, budget.currency)],
          ]} />
          <p className="mb-0 mt-[10px] text-[11.5px] leading-[1.5] text-[var(--muted-foreground)]">Limits show the current active policy. Committed spend uses rolling windows. Each limit includes all unresolved reservations, even when they are older than the window. These totals apply to this agent, environment, and currency.</p>
        </div>
      </div>
      <EvidenceDisclosure title="Immutable authorization evidence" className="mt-[16px] min-w-0 rounded-[10px] border border-[var(--border)] p-[12px]">
        {execution ? (
          <div className="mt-[12px] min-w-0">
            <p className="mt-0 text-[12px] leading-[1.5] text-[var(--muted-foreground)]">The service saved these snapshots when it claimed execution. It rechecked the request against the active policy at that time. Later policy changes do not change this record.</p>
            <KeyValueGrid rows={[
              ["Request digest", <Identifier value={execution.request_digest} />],
              ["Policy digest", <Identifier value={execution.policy_digest} />],
              ["Provider idempotency key", <Identifier value={execution.provider_idempotency_key} />],
            ]} />
            <div className="mt-[12px]"><TraceJsonViewer label="authorization evidence" value={{ request_snapshot: evidence.request_snapshot, policy_snapshot: evidence.policy_snapshot }} /></div>
          </div>
        ) : <p className="mb-0 text-[12px] text-[var(--muted-foreground)]">No immutable execution authorization was recorded for this payment.</p>}
      </EvidenceDisclosure>
      <EvidenceDisclosure title={`Execution event history (${evidence.events.length})`} className="mt-[10px] min-w-0 rounded-[10px] border border-[var(--border)] p-[12px]">
        {evidence.events_truncated ? <p className="mb-0 text-[12px] text-[var(--muted-foreground)]">Showing the latest {evidence.events.length} of {evidence.events_total} recorded events. Earlier events remain in the service ledger.</p> : null}
        {evidence.events.length ? (
          <ol className="mb-0 mt-[12px] flex list-none flex-col gap-[10px] p-0">
            {[...evidence.events].sort((a, b) => a.at_ms - b.at_ms).map((event) => (
              <li className="min-w-0 rounded-[8px] bg-[var(--muted)] p-[12px]" key={event.id}>
                <div className="mb-[8px] flex flex-wrap items-start justify-between gap-[8px]">
                  <span className="mono break-all text-[12px] font-semibold">{event.type}</span>
                  <span className="text-[11.5px] text-[var(--muted-foreground)]">{formatDateTime(event.at_ms)}</span>
                </div>
                <div className="mb-[8px] text-[11.5px] text-[var(--muted-foreground)]">Actor: <Identifier value={event.actor} /> · Event: <Identifier value={event.id} /></div>
                <EvidenceDisclosure title="Event evidence" className="min-w-0">
                  <div className="mt-[10px]"><TraceJsonViewer label={`event ${event.id}`} value={event.payload} /></div>
                </EvidenceDisclosure>
              </li>
            ))}
          </ol>
        ) : <p className="mb-0 text-[12px] text-[var(--muted-foreground)]">No execution events are recorded.</p>}
      </EvidenceDisclosure>
    </>
  );
}

/** Large event payloads are mounted only when the operator opens them. */
function EvidenceDisclosure({ title, className, children }: { title: string; className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details className={className} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="focus-ring cursor-pointer rounded-[5px] text-[12.5px] font-bold">{title}</summary>
      {open ? children : null}
    </details>
  );
}

function Identifier({ value }: { value?: string | null }) {
  return <span className="mono break-all text-[11.5px]">{value ?? "Not recorded"}</span>;
}

function exactAmount(value: string, currency: string) {
  return `${value} ${currency}`;
}
