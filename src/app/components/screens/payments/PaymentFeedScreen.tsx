import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { payments, type PaymentDecision } from "../../../data/payments";
import { formatAmount, formatTime, truncateSignals } from "../../../lib/formatters";
import { DecisionBadge, EmptyState, FilterBar, GlassPanel, GridCell, GridRow, GridTable, RiskBadge, StatusBadge, StatusDot } from "../../primitives";

const columns = "minmax(150px,1.1fr) 100px minmax(130px,1fr) 90px 110px minmax(110px,1fr) 60px 130px minmax(120px,1fr)";

export function PaymentFeedScreen() {
  const [decision, setDecision] = useState<PaymentDecision | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const rows = useMemo(() => (decision === "all" ? payments : payments.filter((payment) => payment.decision === decision)), [decision]);
  const selected = payments.find((payment) => payment.id === selectedId) ?? null;

  return (
    <section data-screen-label="Live Payment Feed">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[8px]">
        <h1 className="page-title flex items-center gap-[10px]">
          Live Payment Feed
          <span className="inline-flex items-center gap-[6px] rounded-[999px] bg-[rgba(74,138,104,0.14)] px-[10px] py-[3px] text-[11px] font-bold text-[var(--success-text)]">
            <StatusDot pulse size={6} tone="success" />
            LIVE
          </span>
        </h1>
        <span className="text-[12px] text-[var(--muted-foreground)]">{rows.length} payments</span>
      </div>

      <FilterBar>
        <select className="control-sm" aria-label="Date range">
          <option>Last 24 hours</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
        <select className="control-sm" aria-label="Decision status" value={decision} onChange={(event) => setDecision(event.target.value as PaymentDecision | "all")}>
          <option value="all">All decisions</option>
          <option value="approved">Approved</option>
          <option value="blocked">Blocked</option>
          <option value="review_required">Review Required</option>
          <option value="pending">Pending</option>
        </select>
        <input className="control-sm w-[90px]" placeholder="Risk 0-100" aria-label="Risk range" />
        <input className="control-sm w-[130px]" placeholder="Amount min-max" aria-label="Amount range" />
        <select className="control-sm" aria-label="Agent">
          <option>All agents</option>
          <option>checkout-service-prod</option>
          <option>mobile-app-v3</option>
          <option>web-checkout-v2</option>
        </select>
        <select className="control-sm" aria-label="Currency">
          <option>All currencies</option>
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
        </select>
      </FilterBar>

      <div className="mobile-wrap flex items-start gap-[14px]">
        <GlassPanel className="min-w-0 flex-1 overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState title="No payments match these filters" body="Try widening the date range or clearing the decision filter." action="Clear filters" onAction={() => setDecision("all")} />
          ) : (
            <>
              <GridTable columns={columns} headers={["Payment ID", "Time", "Agent", "User", "Amount", "Recipient", "Risk", "Decision", "Signals"]} minWidth={960}>
                {rows.map((payment) => (
                  <GridRow columns={columns} key={payment.id} selected={selectedId === payment.id} onClick={() => setSelectedId(payment.id)}>
                    <GridCell className="mono whitespace-nowrap">
                      <button
                        className="focus-ring button-reset font-medium text-[var(--accent-dark)] hover:underline"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/payments/${payment.id}`);
                        }}
                      >
                        {payment.id}
                      </button>
                    </GridCell>
                    <GridCell className="mono whitespace-nowrap text-[var(--text-secondary)]">{formatTime(payment.timestamp)}</GridCell>
                    <GridCell className="truncate">{payment.agent}</GridCell>
                    <GridCell className="mono text-[12px] text-[var(--text-secondary)]">{payment.user}</GridCell>
                    <GridCell className="whitespace-nowrap text-right text-[13px] font-bold">{formatAmount(payment)}</GridCell>
                    <GridCell className="mono truncate text-[12px] text-[var(--text-secondary)]">{payment.recipient}</GridCell>
                    <GridCell>
                      <RiskBadge score={payment.riskScore} />
                    </GridCell>
                    <GridCell>
                      <DecisionBadge decision={payment.decision} />
                    </GridCell>
                    <GridCell className="truncate text-[12px] text-[var(--muted-foreground)]">{truncateSignals(payment.triggeredSignals)}</GridCell>
                  </GridRow>
                ))}
              </GridTable>
              <div className="flex items-center justify-center gap-[8px] p-[12px] text-[12px] text-[var(--muted-foreground)]">
                <span className="status-spinner" />
                Streaming new payments...
              </div>
            </>
          )}
        </GlassPanel>

        {selected ? (
          <GlassPanel variant="strong" className="mobile-full sticky top-0 w-[320px] shrink-0 p-[18px]">
            <div className="mb-[14px] flex items-center justify-between">
              <div className="text-[14px] font-bold">Quick Preview</div>
              <button aria-label="Close preview" className="focus-ring h-[26px] w-[26px] rounded-[8px] border-0 bg-[rgba(86,66,86,0.08)] text-[var(--primary)]" type="button" onClick={() => setSelectedId(null)}>
                x
              </button>
            </div>
            <PreviewLabel label="Payment ID" />
            <div className="mono mb-[12px] mt-[2px] text-[12.5px]">{selected.id}</div>
            <PreviewLabel label="Amount" />
            <div className="mb-[12px] mt-[2px] text-[24px] font-extrabold">{formatAmount(selected)}</div>
            <div className="mb-[12px] flex gap-[20px]">
              <div>
                <PreviewLabel label="Risk Score" />
                <RiskBadge score={selected.riskScore} size="lg" />
              </div>
              <div>
                <PreviewLabel label="Decision" />
                <DecisionBadge decision={selected.decision} />
              </div>
            </div>
            <PreviewLabel label="Triggered Signals" />
            <div className="mb-[16px] mt-[6px] flex flex-wrap gap-[6px]">
              {selected.triggeredSignals.length ? (
                selected.triggeredSignals.map((signal) => <StatusBadge key={signal}>{signal}</StatusBadge>)
              ) : (
                <StatusBadge>None</StatusBadge>
              )}
            </div>
            <div className="mb-[16px] grid grid-cols-[1fr_1fr] gap-x-[14px] gap-y-[8px] text-[12.5px]">
              <span className="text-[var(--muted-foreground)]">Agent</span>
              <span className="mono truncate text-[12px]">{selected.agent}</span>
              <span className="text-[var(--muted-foreground)]">User</span>
              <span className="mono text-[12px]">{selected.user}</span>
              <span className="text-[var(--muted-foreground)]">Recipient</span>
              <span className="mono truncate text-[12px]">{selected.recipient}</span>
              <span className="text-[var(--muted-foreground)]">Environment</span>
              <span>{selected.environment}</span>
            </div>
            <button className="focus-ring h-[36px] w-full rounded-[9px] border-0 bg-[var(--primary)] text-[13px] font-bold text-white hover:bg-[var(--primary-dark)]" type="button" onClick={() => navigate(`/payments/${selected.id}`)}>
              Open Full Trace -&gt;
            </button>
          </GlassPanel>
        ) : null}
      </div>
    </section>
  );
}

function PreviewLabel({ label }: { label: string }) {
  return <div className="label-caps mb-[4px]">{label}</div>;
}

