import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { allowList, blockList, policyThresholds, policyVersions, riskRules } from "../../../data/policies";
import { signedScore } from "../../../lib/risk";
import { ActionButton, GlassPanel, GridCell, GridRow, GridTable, SegmentedTabs, StatusBadge } from "../../primitives";

const tabs = [
  { label: "Policy Configuration", value: "config" },
  { label: "Rule Weights", value: "rules" },
  { label: "Allow / Block Lists", value: "lists" },
  { label: "Policy Simulator", value: "simulator" },
];

export function PoliciesScreen() {
  const [tab, setTab] = useState("config");
  const [allow, setAllow] = useState(policyThresholds.allow);
  const [review, setReview] = useState(policyThresholds.review);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [simAmount, setSimAmount] = useState(500);
  const [simRecipientAge, setSimRecipientAge] = useState(0);
  const [simHistory, setSimHistory] = useState(5);
  const [simRegion, setSimRegion] = useState("US");
  const [ran, setRan] = useState(false);

  const simulation = useMemo(() => {
    let score = 10;
    const factors: Array<{ name: string; value: number }> = [];
    const amountValue = simAmount >= 5000 ? 30 : simAmount >= 1000 ? 20 : simAmount >= 300 ? 10 : 0;
    if (amountValue) factors.push({ name: simAmount >= 1000 ? "High amount" : "Amount within pattern", value: amountValue });
    score += amountValue;
    if (simRecipientAge < 7) { score += 15; factors.push({ name: "New recipient", value: 15 }); }
    if (simRegion === "EU") { score += 10; factors.push({ name: "Cross-border transaction", value: 10 }); }
    if (simRegion === "HIGH") { score += 25; factors.push({ name: "High-risk region", value: 25 }); }
    if (simHistory >= 10) { score -= 8; factors.push({ name: "Positive user history", value: -8 }); }
    else if (simHistory < 3) { score += 8; factors.push({ name: "Limited user history", value: 8 }); }
    score = Math.max(0, Math.min(100, score));
    const decision = score <= allow ? "Allow" : score <= review ? "Review Required" : "Block";
    return { score, decision, factors };
  }, [allow, review, simAmount, simHistory, simRecipientAge, simRegion]);

  return (
    <section data-screen-label="Risk Policy Management">
      <h1 className="page-title mb-[16px]">Risk Policy &amp; Thresholds</h1>
      <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === "config" ? <ConfigTab allow={allow} review={review} setAllow={setAllow} setReview={setReview} /> : null}
      {tab === "rules" ? <RulesTab enabled={enabled} setEnabled={setEnabled} /> : null}
      {tab === "lists" ? <ListsTab /> : null}
      {tab === "simulator" ? (
        <SimulatorTab
          ran={ran}
          simulation={simulation}
          values={{ simAmount, simRecipientAge, simHistory, simRegion }}
          setters={{ setSimAmount, setSimRecipientAge, setSimHistory, setSimRegion, setRan }}
        />
      ) : null}
    </section>
  );
}

function ConfigTab({ allow, review, setAllow, setReview }: { allow: number; review: number; setAllow: (value: number) => void; setReview: (value: number) => void }) {
  return (
    <div className="responsive-stack grid grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] items-start gap-[16px]">
      <div className="flex min-w-0 flex-col gap-[16px]">
        <GlassPanel className="p-[20px]">
          <div className="panel-title mb-[14px]">Active Policy</div>
          <div className="mb-[16px] flex flex-wrap gap-[28px]">
            <PolicyMeta label="Version" value={<span className="mono text-[16px] font-bold">v2.3.1</span>} />
            <PolicyMeta label="Status" value={<StatusBadge tone="success">Active</StatusBadge>} />
            <PolicyMeta label="Last Updated" value={<span className="text-[13px]">2026-05-20 14:32 UTC</span>} />
          </div>
          <div className="mb-[18px] rounded-[10px] bg-[rgba(86,66,86,0.07)] p-[10px_12px] text-[12.5px] text-[var(--text-secondary)]">
            Threshold changes take effect immediately after publishing.
          </div>
          <div className="mb-[14px] text-[12px] font-extrabold uppercase tracking-[0.05em] text-[var(--primary)]">Decision Thresholds</div>
          <ThresholdSlider color="var(--success)" label="Allow threshold" max={100} value={allow} badge={`0-${allow}`} onChange={(value) => setAllow(Math.min(value, review - 1))} tone="success" />
          <ThresholdSlider color="var(--warning)" label="Human review threshold" max={100} value={review} badge={`${allow + 1}-${review}`} onChange={(value) => setReview(Math.max(value, allow + 1))} tone="warning" />
          <div className="mt-[18px]">
            <div className="mb-[6px] flex justify-between text-[13px]">
              <span>Block threshold</span>
              <StatusBadge tone="danger">{review + 1}+</StatusBadge>
            </div>
            <div className="h-[6px] rounded-[3px]" style={{ background: `linear-gradient(90deg,#4a8a68 ${allow}%, #d9973b ${allow}%, #d9973b ${review}%, #c05b47 ${review}%)` }} />
          </div>
        </GlassPanel>

        <GlassPanel className="p-[20px]">
          <div className="panel-title">Policy Versions</div>
          <GridTable columns="120px 110px 150px minmax(160px,1fr) 90px" headers={["Version", "Status", "Created", "Created By", "Actions"]} minWidth={620}>
            {policyVersions.map((version) => (
              <GridRow columns="120px 110px 150px minmax(160px,1fr) 90px" key={version.version}>
                <GridCell className="mono">{version.version}</GridCell>
                <GridCell><StatusBadge tone={version.status === "Active" ? "success" : "neutral"}>{version.status}</StatusBadge></GridCell>
                <GridCell>{version.created}</GridCell>
                <GridCell>{version.createdBy}</GridCell>
                <GridCell><ActionButton className="h-[26px] text-[11.5px]">{version.action}</ActionButton></GridCell>
              </GridRow>
            ))}
          </GridTable>
        </GlassPanel>
      </div>

      <div className="flex min-w-0 flex-col gap-[16px]">
        <GlassPanel className="p-[20px]">
          <div className="panel-title">Actions</div>
          <div className="flex flex-col gap-[8px]">
            <ActionButton>Save Draft</ActionButton>
            <ActionButton>Test Policy</ActionButton>
            <ActionButton variant="primary">Publish Policy</ActionButton>
          </div>
        </GlassPanel>
        <GlassPanel className="p-[20px]">
          <div className="panel-title">Impact Preview</div>
          <div className="mb-[14px] rounded-[9px] bg-[rgba(217,151,59,0.14)] p-[8px_11px] text-[12px] font-semibold text-[var(--warning-text)]">Based on last 24h of data</div>
          <div className="label-caps">Payments Affected</div>
          <div className="mb-[12px] mt-[2px] text-[18px] font-extrabold">+142 to review queue</div>
          <div className="label-caps">Estimated Review Load</div>
          <div className="mt-[2px] text-[18px] font-extrabold">+15% workload</div>
        </GlassPanel>
      </div>
    </div>
  );
}

function RulesTab({ enabled, setEnabled }: { enabled: Record<string, boolean>; setEnabled: (value: Record<string, boolean>) => void }) {
  const columns = "minmax(160px,1fr) minmax(240px,1.8fr) 100px 100px 120px";
  return (
    <GlassPanel className="overflow-hidden">
      <GridTable columns={columns} headers={["Rule Name", "Description", "Weight", "Enabled", "Last Updated"]} minWidth={760}>
        {riskRules.map((rule) => {
          const isEnabled = enabled[rule.name] ?? rule.enabled;
          return (
            <GridRow columns={columns} key={rule.name}>
              <GridCell className="font-bold">{rule.name}</GridCell>
              <GridCell className="text-[var(--muted-foreground)]">{rule.description}</GridCell>
              <GridCell className="text-center"><StatusBadge className="mono min-w-[38px] justify-center" tone={rule.weight > 0 ? "danger" : "success"}>{signedScore(rule.weight)}</StatusBadge></GridCell>
              <GridCell className="text-center">
                <button aria-label={`Toggle ${rule.name}`} className="relative h-[20px] w-[36px] rounded-[999px] border-0 transition" style={{ background: isEnabled ? "var(--accent)" : "rgba(86,66,86,0.2)" }} type="button" onClick={() => setEnabled({ ...enabled, [rule.name]: !isEnabled })}>
                  <span className="absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left]" style={{ left: isEnabled ? 18 : 2 }} />
                </button>
              </GridCell>
              <GridCell className="mono text-[var(--muted-foreground)]">{rule.lastUpdated}</GridCell>
            </GridRow>
          );
        })}
      </GridTable>
    </GlassPanel>
  );
}

function ListsTab() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[16px]">
      <ListPanel entries={allowList} tone="success" title="Allow List" text="Entities on this list bypass risk checks automatically." />
      <ListPanel entries={blockList} tone="danger" title="Block List" text="Entities on this list are blocked automatically." />
    </div>
  );
}

function SimulatorTab({ ran, simulation, values, setters }: any) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-[16px]">
      <GlassPanel className="p-[20px]">
        <div className="panel-title mb-[6px]">Policy Simulator</div>
        <div className="mb-[16px] text-[12.5px] text-[var(--muted-foreground)]">Test how a payment would be evaluated under the current draft configuration.</div>
        <div className="flex flex-col gap-[12px]">
          <SimInput label="Payment amount" type="number" value={values.simAmount} onChange={(value) => { setters.setSimAmount(Number(value)); setters.setRan(false); }} />
          <SimInput label="Recipient age (days)" type="number" value={values.simRecipientAge} onChange={(value) => { setters.setSimRecipientAge(Number(value)); setters.setRan(false); }} />
          <SimInput label="User payment history (count)" type="number" value={values.simHistory} onChange={(value) => { setters.setSimHistory(Number(value)); setters.setRan(false); }} />
          <label className="text-[12px] font-bold">
            Region
            <select className="control mt-[4px] w-full" value={values.simRegion} onChange={(event) => { setters.setSimRegion(event.target.value); setters.setRan(false); }}>
              <option value="US">US - Domestic</option>
              <option value="EU">EU - Cross-border</option>
              <option value="HIGH">High-risk region</option>
            </select>
          </label>
          <ActionButton className="mt-[4px] h-[38px]" variant="aubergine" onClick={() => setters.setRan(true)}>Simulate Decision</ActionButton>
        </div>
      </GlassPanel>
      <GlassPanel variant="strong" className="p-[20px]">
        <div className="panel-title mb-[14px]">Simulated Result</div>
        {!ran ? (
          <div className="p-[40px_16px] text-center text-[13px] text-[var(--muted-foreground)]">Run a simulation to see the predicted score, decision, and contributing factors.</div>
        ) : (
          <>
            <div className="label-caps mb-[6px]">Predicted Risk Score</div>
            <StatusBadge tone={simulation.score < 40 ? "success" : simulation.score < 70 ? "warning" : "danger"} size="lg">{simulation.score}</StatusBadge>
            <div className="label-caps mb-[6px] mt-[16px]">Predicted Decision</div>
            <StatusBadge tone={simulation.decision === "Allow" ? "success" : simulation.decision === "Block" ? "danger" : "warning"}>{simulation.decision}</StatusBadge>
            <div className="label-caps mb-[8px] mt-[16px]">Contributing Factors</div>
            <div className="flex flex-col gap-[7px] text-[13px]">
              {simulation.factors.map((factor: any) => (
                <div className="flex justify-between" key={factor.name}>
                  <span>{factor.name}</span>
                  <span className="mono font-extrabold" style={{ color: factor.value > 0 ? "var(--danger-text)" : "var(--success-text)" }}>{signedScore(factor.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </GlassPanel>
    </div>
  );
}

function PolicyMeta({ label, value }: { label: string; value: ReactNode }) {
  return <div><div className="label-caps mb-[3px]">{label}</div>{value}</div>;
}

function ThresholdSlider({ label, value, badge, color, tone, onChange }: { label: string; value: number; badge: string; color: string; tone: "success" | "warning"; max: number; onChange: (value: number) => void }) {
  return (
    <div className="mb-[18px]">
      <div className="mb-[6px] flex justify-between text-[13px]">
        <span>{label}</span>
        <StatusBadge tone={tone}>{badge}</StatusBadge>
      </div>
      <input className="w-full" max={100} min={0} type="range" value={value} onChange={(event) => onChange(Number(event.target.value))} style={{ accentColor: color }} />
    </div>
  );
}

function ListPanel({ title, text, entries, tone }: { title: string; text: string; entries: string[]; tone: "success" | "danger" }) {
  return (
    <GlassPanel className="p-[20px]">
      <div className="panel-title mb-[10px]">{title}</div>
      <div className="mb-[14px] rounded-[9px] p-[9px_12px] text-[12px] font-semibold" style={{ background: tone === "success" ? "rgba(74,138,104,0.12)" : "rgba(192,91,71,0.12)", color: tone === "success" ? "var(--success-text)" : "var(--danger-text)" }}>{text}</div>
      <div className="mb-[16px] flex gap-[8px]">
        <input className="control min-w-0 flex-1 text-[12.5px] font-normal" placeholder="User ID, merchant ID, or IP address" />
        <ActionButton className="h-[34px]">Add</ActionButton>
      </div>
      <div className="label-caps mb-[8px]">Current Entries ({entries.length})</div>
      <div className="flex flex-col gap-[6px]">
        {entries.map((entry) => (
          <div className="mono flex items-center justify-between rounded-[9px] border border-[rgba(86,66,86,0.10)] bg-[rgba(255,255,255,0.6)] p-[7px_12px] text-[12px]" key={entry}>
            {entry}
            <button aria-label={`Remove ${entry}`} className="button-reset text-[13px] text-[var(--muted-foreground)]" type="button">x</button>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function SimInput({ label, value, type, onChange }: { label: string; value: number; type: string; onChange: (value: string) => void }) {
  return (
    <label className="text-[12px] font-bold">
      {label}
      <input className="control mt-[4px] w-full" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
