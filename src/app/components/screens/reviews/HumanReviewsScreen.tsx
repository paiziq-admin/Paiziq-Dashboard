import { useState } from "react";
import { payments } from "../../../data/payments";
import { formatAmount, truncateSignals } from "../../../lib/formatters";
import { ActionButton, FilterBar, GlassPanel, GridCell, GridRow, GridTable, KeyValueGrid, RiskBadge, StatusDot } from "../../primitives";

const columns = "44px minmax(150px,1.2fr) 100px 60px minmax(130px,1.2fr) 80px 110px";
const sla = [
  { label: "32m left", tone: "danger" as const, assignee: "Sarah Chen" },
  { label: "3h left", tone: "warning" as const, assignee: "Unassigned" },
  { label: "6h left", tone: "success" as const, assignee: "Sarah Chen" },
];

export function HumanReviewsScreen() {
  const queue = payments.filter((payment) => payment.decision === "review_required");
  const [selectedId, setSelectedId] = useState(queue[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const selected = queue.find((payment) => payment.id === selectedId) ?? queue[0];
  const selectedSla = sla[Math.max(0, queue.findIndex((payment) => payment.id === selected.id)) % sla.length];
  const noteEmpty = note.trim().length === 0;

  return (
    <section data-screen-label="Human Review Queue">
      <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-[8px]">
        <h1 className="page-title">Human Review Queue</h1>
        <span className="text-[12px] text-[var(--muted-foreground)]">{queue.length} pending - SLA policy: 8h</span>
      </div>

      <div className="mobile-wrap flex flex-wrap items-start gap-[16px]">
        <div className="flex min-w-[440px] flex-[1.6] flex-col gap-[12px] mobile-full">
          <FilterBar className="mb-0">
            <select className="control-sm" aria-label="SLA filter">
              <option>All SLAs</option>
              <option>Urgent (&lt; 1h)</option>
              <option>Warning (1-4h)</option>
              <option>Normal (&gt; 4h)</option>
            </select>
            <select className="control-sm" aria-label="Assignee filter">
              <option>All assignees</option>
              <option>Assigned to me</option>
              <option>Unassigned</option>
            </select>
            <input className="control-sm w-[110px]" placeholder="Risk min-max" aria-label="Risk score range" />
            <input className="control-sm w-[130px]" placeholder="Amount min-max" aria-label="Amount range" />
          </FilterBar>

          <GlassPanel className="overflow-hidden">
            <GridTable columns={columns} headers={["Pri", "Payment ID", "Amount", "Risk", "Top Reasons", "SLA", "Assignee"]} minWidth={680}>
              {queue.map((payment, index) => {
                const rowSla = sla[index % sla.length];
                return (
                  <GridRow columns={columns} key={payment.id} selected={selected.id === payment.id} onClick={() => setSelectedId(payment.id)}>
                    <GridCell>
                      <StatusDot tone={rowSla.tone} size={10} />
                    </GridCell>
                    <GridCell className="mono whitespace-nowrap">{payment.id}</GridCell>
                    <GridCell className="whitespace-nowrap text-right text-[13px] font-bold">{formatAmount(payment)}</GridCell>
                    <GridCell>
                      <RiskBadge score={payment.riskScore} />
                    </GridCell>
                    <GridCell className="truncate text-[12px] text-[var(--muted-foreground)]">{truncateSignals(payment.triggeredSignals)}</GridCell>
                    <GridCell className="whitespace-nowrap text-[12px] font-bold" style={{ color: `var(--${rowSla.tone === "danger" ? "danger" : rowSla.tone}-text)` }}>
                      {rowSla.label}
                    </GridCell>
                    <GridCell className="whitespace-nowrap">{rowSla.assignee}</GridCell>
                  </GridRow>
                );
              })}
            </GridTable>
          </GlassPanel>
        </div>

        <GlassPanel variant="strong" className="min-w-[340px] flex-1 p-[20px] mobile-full">
          <div className="mb-[12px] flex items-center justify-between">
            <div className="text-[15px] font-extrabold">Review Details</div>
            <span className="text-[12px] font-bold" style={{ color: `var(--${selectedSla.tone === "danger" ? "danger" : selectedSla.tone}-text)` }}>
              {selectedSla.label}
            </span>
          </div>

          <SectionLabel>Payment Summary</SectionLabel>
          <KeyValueGrid
            rows={[
              ["Payment ID", <span className="mono text-[12px]">{selected.id}</span>],
              ["Amount", <b>{formatAmount(selected)}</b>],
              ["User", <span className="mono text-[12px]">{selected.user}</span>],
              ["Recipient", <span className="mono text-[12px]">{selected.recipient}</span>],
              ["Agent", <span className="mono text-[12px]">{selected.agent}</span>],
            ]}
          />

          <SectionLabel border>Top Risk Signals</SectionLabel>
          <div className="mb-[14px] flex flex-col gap-[6px]">
            {selected.triggeredSignals.map((signal) => (
              <div className="flex items-center gap-[8px] text-[12.5px]" key={signal}>
                <span className="text-[var(--warning)]">▲</span>
                {signal}
              </div>
            ))}
          </div>

          <SectionLabel border>User Payment History</SectionLabel>
          <div className="mb-[14px] flex gap-[22px]">
            <HistoryValue label="Total" value="47" />
            <HistoryValue color="var(--success-text)" label="Successful" value="45" />
            <HistoryValue color="var(--danger-text)" label="Blocked" value="2" />
          </div>

          <SectionLabel border>Recipient History</SectionLabel>
          <div className="mb-[14px] rounded-[9px] bg-[rgba(86,66,86,0.07)] p-[9px_12px] text-[12px] text-[var(--text-secondary)]">
            New recipient for this user - no previous transaction history.
          </div>

          <SectionLabel border>Agent Trace Summary</SectionLabel>
          <div className="mono mb-[14px] rounded-[9px] bg-[rgba(86,66,86,0.06)] p-[10px_12px] text-[11.5px] leading-[1.6] text-[var(--text-secondary)]">
            device: fp_8472abc (new)
            <br />
            ip: 192.168.1.142
            <br />
            session: sess_29347 - 4 min
          </div>

          <label className="mb-[5px] block text-[12px] font-bold" htmlFor="review-note">
            Reviewer notes <span className="text-[var(--danger)]">*</span>
          </label>
          <textarea
            className="control mb-[12px] min-h-[76px] w-full resize-y p-[10px] text-[12.5px] font-normal"
            id="review-note"
            placeholder="Required before final approval or rejection..."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex flex-col gap-[8px]">
            <ActionButton disabled={noteEmpty} variant="approve" onClick={() => { setMessage(`${selected.id} approved. Webhook queued; entry added to audit log.`); setNote(""); }}>
              Approve Payment
            </ActionButton>
            <ActionButton disabled={noteEmpty} variant="reject" onClick={() => { setMessage(`${selected.id} rejected. Webhook queued; entry added to audit log.`); setNote(""); }}>
              Reject Payment
            </ActionButton>
            <ActionButton>Escalate to Senior Reviewer</ActionButton>
          </div>
          {noteEmpty ? <div className="mt-[8px] text-[11.5px] text-[var(--muted-foreground)]">A note is required before approve / reject.</div> : null}
          {message ? <div className="mt-[10px] rounded-[9px] bg-[rgba(74,138,104,0.14)] p-[9px_12px] text-[12.5px] font-bold text-[var(--success-text)]">{message}</div> : null}
        </GlassPanel>
      </div>
    </section>
  );
}

function SectionLabel({ children, border = false }: { children: string; border?: boolean }) {
  return <div className={`label-caps mb-[8px] ${border ? "mt-[12px] border-t border-[rgba(86,66,86,0.10)] pt-[12px]" : ""}`}>{children}</div>;
}

function HistoryValue({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div>
      <div className="text-[19px] font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-[var(--muted-foreground)]">{label}</div>
    </div>
  );
}

