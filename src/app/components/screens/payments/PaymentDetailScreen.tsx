import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, Check, X } from "lucide-react";
import { payments, riskSignals, timelineEvents } from "../../../data/payments";
import { formatAmount, formatTime } from "../../../lib/formatters";
import { decisionLabel, signedScore } from "../../../lib/risk";
import { ActionButton, CodeBlock, DecisionBadge, GlassPanel, GridCell, GridRow, GridTable, RiskBadge, StatusBadge, Timeline } from "../../primitives";

export function PaymentDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const payment = payments.find((entry) => entry.id === id) ?? payments[1];
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const noteEmpty = note.trim().length === 0;

  const traceJson = useMemo(
    () =>
      JSON.stringify(
        {
          request: {
            user_id: payment.user,
            amount: payment.amount,
            currency: payment.currency,
            recipient: payment.recipient,
            timestamp: payment.timestamp,
          },
          context: {
            ip_address: "192.168.1.142",
            user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)",
            device_fingerprint: "fp_8472abc",
            session_id: "sess_29347",
          },
        },
        null,
        2,
      ),
    [payment],
  );

  return (
    <section data-screen-label="Payment Detail / Trace">
      <button className="focus-ring button-reset mb-[12px] inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]" type="button" onClick={() => navigate("/payments")}>
        &lt;- Back to Payment Feed
      </button>

      <GlassPanel variant="header" className="mb-[16px] flex flex-wrap items-start justify-between gap-[14px] p-[20px]">
        <div>
          <div className="mb-[10px] flex items-center gap-[10px]">
            <DecisionIcon decision={payment.decision} />
            <span className="mono text-[19px] font-extrabold tracking-[-0.01em]">{payment.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-[10px]">
            <DecisionBadge decision={payment.decision} />
            <StatusBadge>Risk {payment.riskScore}</StatusBadge>
            <span className="text-[12.5px] text-[var(--muted-foreground)]">{formatTime(payment.timestamp)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-extrabold tracking-[-0.02em]">{formatAmount(payment)}</div>
          <div className="mono text-[12px] text-[var(--muted-foreground)]">{payment.agent}</div>
        </div>
      </GlassPanel>

      <div className="responsive-stack grid grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)] items-start gap-[16px]">
        <div className="flex min-w-0 flex-col gap-[16px]">
          <GlassPanel className="p-[20px]">
            <div className="panel-title mb-[16px]">Event Timeline</div>
            <Timeline events={timelineEvents.map((event, index) => (index === 1 ? { ...event, details: `Score: ${payment.riskScore} (${decisionLabel(payment.decision)})` } : event))} />
          </GlassPanel>

          <GlassPanel className="p-[20px]">
            <div className="panel-title">Agent Trace</div>
            <CodeBlock value={traceJson} />
          </GlassPanel>

          <GlassPanel className="p-[20px]">
            <div className="panel-title">Webhook Delivery Logs</div>
            <GridTable columns="1fr 1fr 1fr 1fr 1.4fr" headers={[]} minWidth={560}>
              <GridRow columns="1fr 1fr 1fr 1fr 1.4fr">
                <GridCell className="font-semibold">Attempt 1</GridCell>
                <GridCell>
                  <StatusBadge tone="success">Success</StatusBadge>
                </GridCell>
                <GridCell className="mono text-[12px]">200 OK</GridCell>
                <GridCell className="text-[12px] text-[var(--muted-foreground)]">145ms</GridCell>
                <GridCell className="text-[12px] text-[var(--muted-foreground)]">{formatTime(payment.timestamp)}</GridCell>
              </GridRow>
            </GridTable>
          </GlassPanel>

          <GlassPanel className="p-[20px]">
            <div className="panel-title">Audit Trail</div>
            <div className="flex flex-col gap-[10px] text-[12.5px]">
              <AuditLine time="14:19:42" actor="system" text="routed payment to human review queue (policy v2.3.1)" />
              <AuditLine time="14:20:05" actor="system" text="assigned review to sarah.chen@company.com" />
              <AuditLine time="14:21:18" actor="sarah.chen@company.com" text="opened trace view - IP 192.168.1.45" />
            </div>
          </GlassPanel>
        </div>

        <div className="flex min-w-0 flex-col gap-[16px]">
          <GlassPanel className="p-[20px]">
            <div className="panel-title mb-[14px]">Risk Score Breakdown</div>
            <div className="flex flex-col gap-[12px]">
              {riskSignals.map((signal) => (
                <div className="flex items-center justify-between gap-[10px]" key={signal.name}>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold">{signal.name}</div>
                    <div className="text-[11.5px] text-[var(--muted-foreground)]">{signal.description}</div>
                  </div>
                  <StatusBadge tone={signal.value > 0 ? "danger" : "success"} className="mono min-w-[40px] justify-center">
                    {signedScore(signal.value)}
                  </StatusBadge>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-[rgba(86,66,86,0.12)] pt-[12px]">
                <span className="text-[13.5px] font-extrabold">Final Score</span>
                <RiskBadge score={payment.riskScore} size="lg" />
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-[20px]">
            <div className="panel-title">Policy Information</div>
            <div className="label-caps">Policy Version</div>
            <div className="mono mb-[14px] mt-[2px] text-[14px] font-semibold">v2.3.1</div>
            <div className="label-caps mb-[8px]">Thresholds</div>
            <div className="flex flex-col gap-[7px] text-[13px]">
              <Threshold range="0-39" label="Allow" tone="success" />
              <Threshold range="40-69" label="Human Review" tone="warning" />
              <Threshold range="70+" label="Block" tone="danger" />
            </div>
          </GlassPanel>

          {payment.decision === "review_required" ? (
            <GlassPanel variant="accent" className="p-[20px]">
              <div className="panel-title mb-[10px]">Review Actions</div>
              <div className="mb-[12px] rounded-[10px] border border-[rgba(217,151,59,0.3)] bg-[rgba(217,151,59,0.14)] p-[10px_12px] text-[12.5px] font-semibold text-[var(--warning-text)]">
                This payment requires human review before processing.
              </div>
              <label className="mb-[5px] block text-[12px] font-bold" htmlFor="detail-review-note">
                Reviewer notes <span className="text-[var(--danger)]">*</span>
              </label>
              <textarea
                className="control mb-[12px] min-h-[70px] w-full resize-y p-[10px] text-[12.5px] font-normal"
                id="detail-review-note"
                placeholder="Required before approve / reject..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <div className="flex flex-col gap-[8px]">
                <ActionButton className="h-[38px]" disabled={noteEmpty} variant="approve" onClick={() => setMessage("Payment approved - decision recorded in audit log.")}>
                  Approve Payment
                </ActionButton>
                <ActionButton className="h-[38px]" disabled={noteEmpty} variant="reject" onClick={() => setMessage("Payment rejected - decision recorded in audit log.")}>
                  Reject Payment
                </ActionButton>
                <div className="flex gap-[8px]">
                  <ActionButton className="flex-1" type="button">Request More Info</ActionButton>
                  <ActionButton className="flex-1" type="button">Escalate</ActionButton>
                </div>
              </div>
              {message ? <div className="mt-[10px] rounded-[9px] bg-[rgba(74,138,104,0.14)] p-[9px_12px] text-[12.5px] font-bold text-[var(--success-text)]">{message}</div> : null}
            </GlassPanel>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DecisionIcon({ decision }: { decision: string }) {
  const icon = decision === "approved" ? <Check size={16} /> : decision === "blocked" ? <X size={16} /> : <AlertTriangle size={16} />;
  const background = decision === "approved" ? "rgba(74,138,104,0.16)" : decision === "blocked" ? "rgba(192,91,71,0.16)" : "rgba(217,151,59,0.18)";
  const color = decision === "approved" ? "var(--success-text)" : decision === "blocked" ? "var(--danger-text)" : "var(--warning-text)";
  return (
    <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]" style={{ background, color }}>
      {icon}
    </span>
  );
}

function AuditLine({ time, actor, text }: { time: string; actor: string; text: string }) {
  return (
    <div className="flex gap-[10px]">
      <span className="mono whitespace-nowrap text-[var(--muted-foreground)]">{time}</span>
      <span>
        <b>{actor}</b> {text}
      </span>
    </div>
  );
}

function Threshold({ range, label, tone }: { range: string; label: string; tone: "success" | "warning" | "danger" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="mono text-[12.5px]">{range}</span>
      <StatusBadge tone={tone}>{label}</StatusBadge>
    </div>
  );
}

