import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, CircleDot, RefreshCw, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { ApiError } from "../../../api/client";
import {
  fetchDecisions,
  fetchPayment,
  fetchTrace,
  fetchWebhookDeliveries,
  fetchWebhookDelivery,
  searchEvents,
  transitionPayment,
} from "../../../api/resources";
import type {
  Decision,
  Payment,
  PaymentState,
  Trace,
  WebhookDelivery,
  WebhookDeliveryDetail,
} from "../../../api/types";
import { useSession } from "../../../context/DashboardContext";
import { formatAmount, formatClock, formatDateTime } from "../../../lib/formatters";
import { AsyncBoundary, InlineError } from "../../feedback/AsyncBoundary";
import {
  ActionButton,
  DecisionBadge,
  EmptyState,
  GlassPanel,
  GridCell,
  GridRow,
  GridTable,
  KeyValueGrid,
  StatusBadge,
  Timeline,
  type TimelineEvent,
} from "../../primitives";
import { TraceJsonViewer } from "./TraceJsonViewer";

interface DetailData {
  payment: Payment;
  decisions: Decision[];
  trace: Trace | null;
  deliveries: WebhookDeliveryDetail[];
}

interface SectionErrors {
  decisions?: unknown;
  trace?: unknown;
  webhooks?: unknown;
}

type TransitionTarget = Exclude<PaymentState, "proposed">;

export function PaymentDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [sectionErrors, setSectionErrors] = useState<SectionErrors>({});
  const [revision, setRevision] = useState(0);
  const [reason, setReason] = useState("");
  const [transitioning, setTransitioning] = useState<TransitionTarget | null>(null);
  const [transitionError, setTransitionError] = useState<unknown>(null);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  useEffect(() => {
    setReason("");
    setTransitionError(null);
    setTransitionMessage(null);
  }, [id]);

  useEffect(() => {
    if (session?.mode !== "live" || !id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setSectionErrors({});

    fetchPayment(id)
      .then(async ({ data: payment }) => {
        const [decisions, trace, deliveries] = await Promise.allSettled([
          fetchDecisions({ payment_id: payment.id, limit: 200, offset: 0 }),
          fetchRelatedTrace(payment),
          fetchRelatedDeliveries(payment),
        ]);
        if (!active) return;
        const errors: SectionErrors = {};
        if (decisions.status === "rejected") errors.decisions = decisions.reason;
        if (trace.status === "rejected") errors.trace = trace.reason;
        if (deliveries.status === "rejected") errors.webhooks = deliveries.reason;
        setSectionErrors(errors);
        setData({
          payment,
          decisions:
            decisions.status === "fulfilled"
              ? [...decisions.value.data].sort((a, b) => b.created_at_ms - a.created_at_ms)
              : [],
          trace: trace.status === "fulfilled" ? trace.value : null,
          deliveries: deliveries.status === "fulfilled" ? deliveries.value : [],
        });
      })
      .catch((cause) => {
        if (active) setError(cause);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, revision, session]);

  const timeline = useMemo(() => (data ? buildTimeline(data) : []), [data]);
  const allowedTransitions = data ? transitionsFor(data.payment.state) : [];

  const applyTransition = async (target: TransitionTarget) => {
    if (!data || !reason.trim()) return;
    setTransitioning(target);
    setTransitionError(null);
    setTransitionMessage(null);
    try {
      await transitionPayment(data.payment.id, { to: target, reason: reason.trim() });
      setTransitionMessage(`Payment transitioned to ${target.replace("_", " ")}.`);
      setReason("");
      setRevision((value) => value + 1);
    } catch (cause) {
      setTransitionError(cause);
    } finally {
      setTransitioning(null);
    }
  };

  return (
    <section data-screen-label="Payment Detail / Trace">
      <button
        className="focus-ring button-reset mb-[12px] inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]"
        type="button"
        onClick={() => navigate("/payments")}
      >
        ← Back to Payment Feed
      </button>

      <AsyncBoundary
        empty={session?.mode === "demo" || !id}
        emptyTitle={session?.mode === "demo" ? "Demo mode has no payment details" : "Payment ID is missing"}
        emptyBody={
          session?.mode === "demo"
            ? "Connect a backend to inspect transitions, decisions, traces, and webhooks."
            : "Return to the payment feed and choose a payment."
        }
        error={error}
        loading={loading}
        loadingLabel="Loading payment trace"
        onRetry={() => setRevision((value) => value + 1)}
      >
        {data ? (
          <>
            <GlassPanel variant="header" className="mb-[16px] flex flex-wrap items-start justify-between gap-[14px] p-[20px]">
              <div>
                <div className="mb-[10px] flex items-center gap-[10px]">
                  <DecisionIcon state={data.payment.state} />
                  <span className="mono break-all text-[19px] font-extrabold tracking-[-0.01em]">{data.payment.id}</span>
                </div>
                <div className="flex flex-wrap items-center gap-[10px]">
                  <DecisionBadge decision={data.payment.state} />
                  <span className="text-[12.5px] text-[var(--muted-foreground)]">
                    Created {formatDateTime(data.payment.created_at_ms)}
                  </span>
                  {data.payment.updated_at_ms !== data.payment.created_at_ms ? (
                    <span className="text-[12.5px] text-[var(--muted-foreground)]">
                      Updated {formatDateTime(data.payment.updated_at_ms)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[28px] font-extrabold tracking-[-0.02em]">{formatAmount(data.payment)}</div>
                <div className="mono text-[12px] text-[var(--muted-foreground)]">{data.payment.agent_id}</div>
              </div>
            </GlassPanel>

            <div className="responsive-stack grid grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)] items-start gap-[16px]">
              <div className="flex min-w-0 flex-col gap-[16px]">
                <GlassPanel className="p-[20px]">
                  <div className="mb-[16px] flex items-center justify-between gap-[10px]">
                    <div className="panel-title mb-0">Event Timeline</div>
                    <StatusBadge>{timeline.length} events</StatusBadge>
                  </div>
                  {timeline.length ? (
                    <Timeline events={timeline} />
                  ) : (
                    <EmptyState title="No timeline events" body="The payment has no transitions, decisions, or correlated trace spans yet." />
                  )}
                </GlassPanel>

                <GlassPanel className="p-[20px]">
                  <div className="mb-[12px] flex flex-wrap items-start justify-between gap-[10px]">
                    <div>
                      <div className="panel-title mb-[3px]">Agent Trace JSON</div>
                      <div className="mono text-[11px] text-[var(--muted-foreground)]">
                        {data.trace ? `trace ${data.trace.trace_id}` : "No correlated trace ID"}
                      </div>
                    </div>
                    <ActionButton className="h-[31px]" onClick={() => setRevision((value) => value + 1)}>
                      <RefreshCw size={13} /> Refresh
                    </ActionButton>
                  </div>
                  {sectionErrors.trace ? (
                    <InlineError error={sectionErrors.trace} onRetry={() => setRevision((value) => value + 1)} />
                  ) : data.trace?.spans.length ? (
                    <TraceJsonViewer value={data.trace} />
                  ) : (
                    <EmptyState
                      title="No correlated trace found"
                      body="The backend exposes traces by trace ID. This view tried the payment request ID, payment ID, and event search without finding a matching span."
                    />
                  )}
                </GlassPanel>

                <GlassPanel className="p-[20px]">
                  <div className="panel-title">Webhook Delivery Logs</div>
                  {sectionErrors.webhooks ? (
                    <InlineError error={sectionErrors.webhooks} onRetry={() => setRevision((value) => value + 1)} />
                  ) : data.deliveries.length ? (
                    <div className="flex flex-col gap-[10px]">
                      {data.deliveries.map((delivery) => (
                        <details className="rounded-[10px] border border-[var(--border)] bg-[var(--muted)] p-[12px]" key={delivery.id}>
                          <summary className="focus-ring flex cursor-pointer list-none flex-wrap items-center gap-[10px] rounded-[7px] text-[12.5px]">
                            <span className="mono font-semibold text-[var(--accent-dark)]">{delivery.id}</span>
                            <StatusBadge tone={deliveryTone(delivery.state)}>{delivery.state}</StatusBadge>
                            <span>{delivery.event_type}</span>
                            <span className="ml-auto text-[var(--muted-foreground)]">
                              {delivery.attempts} attempts · {formatDateTime(delivery.updated_at_ms)}
                            </span>
                          </summary>
                          <div className="mt-[12px]">
                            {delivery.logs.length ? (
                              <GridTable
                                columns="72px 90px minmax(180px,1fr) 150px"
                                headers={["Attempt", "HTTP", "Error", "Time"]}
                                minWidth={560}
                              >
                                {delivery.logs.map((log) => (
                                  <GridRow columns="72px 90px minmax(180px,1fr) 150px" key={`${delivery.id}-${log.attempt}`}>
                                    <GridCell className="mono">{log.attempt}</GridCell>
                                    <GridCell>
                                      <StatusBadge tone={log.status_code && log.status_code < 300 ? "success" : "danger"}>
                                        {log.status_code ?? "No response"}
                                      </StatusBadge>
                                    </GridCell>
                                    <GridCell className="truncate text-[12px] text-[var(--muted-foreground)]">{log.error ?? "-"}</GridCell>
                                    <GridCell className="text-[12px]">{formatDateTime(log.at_ms)}</GridCell>
                                  </GridRow>
                                ))}
                              </GridTable>
                            ) : (
                              <div className="text-[12px] text-[var(--muted-foreground)]">No delivery attempts have been logged.</div>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No related webhooks"
                      body="No webhook delivery payload references this payment."
                    />
                  )}
                </GlassPanel>
              </div>

              <div className="flex min-w-0 flex-col gap-[16px]">
                <GlassPanel className="p-[20px]">
                  <div className="panel-title mb-[14px]">Payment Information</div>
                  <KeyValueGrid
                    rows={[
                      ["Environment", <span className="mono text-[12px]">{data.payment.env_id}</span>],
                      ["Agent", <span className="mono text-[12px]">{data.payment.agent_id}</span>],
                      ["Principal", <span className="mono text-[12px]">{data.payment.principal_id}</span>],
                      ["Merchant", data.payment.merchant],
                      ["Request ID", <span className="mono break-all text-[12px]">{data.payment.request_id ?? "-"}</span>],
                    ]}
                  />
                  {data.payment.intent_description ? (
                    <div className="mt-[14px] border-t border-[var(--border)] pt-[12px]">
                      <div className="label-caps mb-[4px]">Intent</div>
                      <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">{data.payment.intent_description}</p>
                    </div>
                  ) : null}
                </GlassPanel>

                <GlassPanel className="p-[20px]">
                  <div className="mb-[12px] flex items-center justify-between gap-[8px]">
                    <div className="panel-title mb-0">Decisions</div>
                    <StatusBadge>{data.decisions.length}</StatusBadge>
                  </div>
                  {sectionErrors.decisions ? (
                    <InlineError error={sectionErrors.decisions} onRetry={() => setRevision((value) => value + 1)} />
                  ) : data.decisions.length ? (
                    <div className="flex flex-col gap-[12px]">
                      {data.decisions.map((decision) => (
                        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--muted)] p-[12px]" key={decision.id}>
                          <div className="mb-[8px] flex flex-wrap items-center gap-[7px]">
                            <DecisionBadge decision={decision.verdict} />
                            <span className="mono text-[11px] text-[var(--muted-foreground)]">{decision.id}</span>
                            <span className="ml-auto text-[11px] text-[var(--muted-foreground)]">{formatDateTime(decision.created_at_ms)}</span>
                          </div>
                          <div className="mb-[7px] text-[11.5px] text-[var(--muted-foreground)]">
                            Policy version {decision.policy_version ?? "default"}
                          </div>
                          {decision.reasons.length ? (
                            <ul className="my-[6px] pl-[18px] text-[12.5px] leading-[1.45]">
                              {decision.reasons.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                          ) : null}
                          {decision.risk_flags.length ? (
                            <div className="mt-[8px] flex flex-wrap gap-[5px]">
                              {decision.risk_flags.map((flag) => <StatusBadge key={flag} tone="warning">{flag}</StatusBadge>)}
                            </div>
                          ) : (
                            <div className="mt-[7px] text-[11.5px] text-[var(--muted-foreground)]">No risk flags</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No decisions" body="This payment has not been evaluated by the decision engine." />
                  )}
                </GlassPanel>

                <GlassPanel className="p-[20px]">
                  <div className="panel-title mb-[8px]">State Transitions</div>
                  {data.payment.transitions?.length ? (
                    <div className="mb-[14px] flex flex-col gap-[8px]">
                      {data.payment.transitions.map((transition, index) => (
                        <div className="rounded-[9px] bg-[var(--muted)] p-[9px_10px] text-[12px]" key={`${transition.at_ms}-${index}`}>
                          <div className="flex flex-wrap items-center gap-[6px]">
                            <DecisionBadge decision={transition.from as PaymentState} />
                            <span>→</span>
                            <DecisionBadge decision={transition.to as PaymentState} />
                          </div>
                          <div className="mt-[5px] text-[var(--muted-foreground)]">
                            {formatDateTime(transition.at_ms)} · {transition.actor}
                            {transition.reason ? ` · ${transition.reason}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-[14px] text-[12px] text-[var(--muted-foreground)]">No state changes have been recorded.</div>
                  )}

                  {allowedTransitions.length ? (
                    <>
                      <label className="mb-[5px] block text-[12px] font-bold" htmlFor="transition-reason">
                        Audit reason <span className="text-[var(--danger)]">*</span>
                      </label>
                      <textarea
                        className="control mb-[10px] min-h-[70px] w-full resize-y p-[9px] text-[12.5px] font-normal"
                        id="transition-reason"
                        placeholder="Explain this manual transition..."
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                      />
                      <div className="flex flex-wrap gap-[8px]">
                        {allowedTransitions.map((item) => (
                          <ActionButton
                            disabled={!reason.trim() || transitioning !== null}
                            key={item.target}
                            variant={item.variant}
                            onClick={() => applyTransition(item.target)}
                          >
                            {transitioning === item.target ? "Updating..." : item.label}
                          </ActionButton>
                        ))}
                      </div>
                      <p className="mb-0 mt-[8px] text-[11px] text-[var(--muted-foreground)]">
                        Mutations require an ingest- or admin-capable API key; read-only keys will receive a permission error.
                      </p>
                    </>
                  ) : (
                    <div className="rounded-[9px] bg-[var(--muted)] p-[10px] text-[12px] text-[var(--muted-foreground)]">
                      {["rejected", "executed", "failed"].includes(data.payment.state)
                        ? "This payment is in a terminal state."
                        : "No manual transition is available from this state."}
                    </div>
                  )}
                  {transitionError ? <div className="mt-[10px]"><InlineError error={transitionError} /></div> : null}
                  {transitionMessage ? (
                    <div className="mt-[10px] rounded-[9px] bg-[rgba(74,138,104,0.14)] p-[9px_12px] text-[12.5px] font-bold text-[var(--success-text)]">
                      {transitionMessage}
                    </div>
                  ) : null}
                </GlassPanel>
              </div>
            </div>
          </>
        ) : null}
      </AsyncBoundary>
    </section>
  );
}

function DecisionIcon({ state }: { state: PaymentState }) {
  const icon =
    state === "approved" || state === "executed"
      ? <Check size={16} />
      : state === "rejected" || state === "failed"
        ? <X size={16} />
        : state === "needs_review"
          ? <AlertTriangle size={16} />
          : <CircleDot size={16} />;
  const tone =
    state === "approved" || state === "executed"
      ? "var(--success-text)"
      : state === "rejected" || state === "failed"
        ? "var(--danger-text)"
        : state === "needs_review"
          ? "var(--warning-text)"
          : "var(--muted-foreground)";
  return (
    <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--muted)]" style={{ color: tone }}>
      {icon}
    </span>
  );
}

function transitionsFor(state: PaymentState): Array<{
  target: TransitionTarget;
  label: string;
  variant: "approve" | "reject" | "secondary";
}> {
  if (state === "proposed") {
    return [
      { target: "approved", label: "Approve", variant: "approve" },
      { target: "needs_review", label: "Send to review", variant: "secondary" },
      { target: "rejected", label: "Reject", variant: "reject" },
    ];
  }
  if (state === "needs_review") {
    // Review resolution must go through /v1/reviews so the review record and
    // payment state remain synchronized.
    return [];
  }
  if (state === "approved") {
    return [
      { target: "executed", label: "Mark executed", variant: "approve" },
      { target: "failed", label: "Mark failed", variant: "reject" },
    ];
  }
  return [];
}

function buildTimeline(data: DetailData): TimelineEvent[] {
  const events: Array<TimelineEvent & { at: number }> = [
    {
      event: "Payment proposed",
      details: `${data.payment.merchant} · ${formatAmount(data.payment)}`,
      time: formatClock(data.payment.created_at_ms),
      state: "system",
      at: data.payment.created_at_ms,
    },
  ];
  data.payment.transitions?.forEach((transition) => {
    events.push({
      event: `State changed to ${transition.to.replace("_", " ")}`,
      details: `${transition.actor}${transition.reason ? ` · ${transition.reason}` : ""}`,
      time: formatClock(transition.at_ms),
      state: "done",
      at: transition.at_ms,
    });
  });
  data.decisions.forEach((decision) => {
    events.push({
      event: `Decision: ${decision.verdict.replace("_", " ")}`,
      details: decision.reasons.join("; ") || "No reasons supplied",
      time: formatClock(decision.created_at_ms),
      state: "done",
      at: decision.created_at_ms,
    });
  });
  data.trace?.spans.forEach((span) => {
    if (span.start_ms == null) return;
    events.push({
      event: span.name,
      details: `${span.status}${span.duration_ms != null ? ` · ${span.duration_ms}ms` : ""}`,
      time: formatClock(span.start_ms),
      state: span.status === "error" ? "pending" : "system",
      at: span.start_ms,
    });
  });
  return events.sort((a, b) => a.at - b.at).map(({ at: _at, ...event }) => event);
}

async function fetchRelatedTrace(payment: Payment): Promise<Trace | null> {
  const candidates = Array.from(new Set([payment.request_id, payment.id].filter(Boolean))) as string[];
  for (const candidate of candidates) {
    try {
      const direct = await fetchTrace(candidate);
      if (direct.data.spans.length) return direct.data;
    } catch (cause) {
      if (cause instanceof ApiError && [401, 403].includes(cause.status)) throw cause;
    }
  }
  for (const candidate of candidates) {
    try {
      const found = await searchEvents({
        q: `"${candidate.replace(/"/g, '""')}"`,
        limit: 10,
        offset: 0,
      });
      for (const traceId of Array.from(new Set(found.data.map((item) => item.trace_id)))) {
        const trace = await fetchTrace(traceId);
        if (trace.data.spans.length) return trace.data;
      }
    } catch (cause) {
      if (cause instanceof ApiError && [401, 403].includes(cause.status)) throw cause;
      // FTS query behavior varied in early backends. A correlation miss should
      // not prevent the rest of the payment detail from rendering.
    }
  }
  return null;
}

async function fetchRelatedDeliveries(payment: Payment): Promise<WebhookDeliveryDetail[]> {
  const related: WebhookDelivery[] = [];
  let offset = 0;
  let total: number;
  do {
    const page = await fetchWebhookDeliveries({
      env_id: payment.env_id,
      payment_id: payment.id,
      limit: 200,
      offset,
    });
    related.push(...page.data);
    total = page.meta?.total ?? related.length;
    if (page.data.length === 0) break;
    offset += page.data.length;
  } while (offset < total);

  const details: WebhookDeliveryDetail[] = [];
  for (let index = 0; index < related.length; index += 20) {
    const batch = await Promise.all(
      related.slice(index, index + 20).map(async (delivery) => {
        try {
          return (await fetchWebhookDelivery(delivery.id)).data;
        } catch {
          return { ...delivery, logs: [] };
        }
      }),
    );
    details.push(...batch);
  }
  return details.sort((a, b) => b.created_at_ms - a.created_at_ms);
}

function deliveryTone(state: WebhookDeliveryDetail["state"]): "success" | "warning" | "danger" {
  if (state === "delivered") return "success";
  if (state === "dead") return "danger";
  return "warning";
}
