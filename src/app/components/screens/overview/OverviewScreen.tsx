import { useNavigate } from "react-router";
import { payments } from "../../../data/payments";
import { formatAmount, truncateSignals } from "../../../lib/formatters";
import { DecisionBadge, GlassPanel, GridCell, GridRow, GridTable, MetricCard, RiskBadge, StatusDot } from "../../primitives";
import { DecisionDonut } from "../../charts/DecisionDonut";
import { PaymentVolumeChart } from "../../charts/PaymentVolumeChart";
import { RiskDistributionBars } from "../../charts/RiskDistributionBars";

const metrics = [
  { label: "Total Payment Attempts", value: "2,847", change: "+12.3%", arrow: "↑", good: true },
  { label: "Approved", value: "2,234", change: "+8.5%", arrow: "↑", good: true },
  { label: "Blocked", value: "156", change: "-15.2%", arrow: "↓", good: true },
  { label: "Pending Human Review", value: "457", change: "+22.1%", arrow: "↑", good: false },
  { label: "Total Payment Volume", value: "$8.2M", change: "+18.7%", arrow: "↑", good: true },
  { label: "Average Risk Score", value: "28.4", change: "-3.2%", arrow: "↓", good: true },
];

const highRiskColumns = "minmax(150px,1.3fr) 110px 64px 130px minmax(110px,1.2fr)";

export function OverviewScreen() {
  const navigate = useNavigate();
  const highRisk = payments.filter((payment) => payment.riskScore >= 48);

  return (
    <section data-screen-label="Overview Dashboard">
      <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-[8px]">
        <h1 className="page-title">Overview</h1>
        <span className="mono text-[12px] text-[var(--muted-foreground)]">Last 24h - updated 2 min ago</span>
      </div>

      <div className="mb-[20px] grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[12px]">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="responsive-stack mb-[16px] grid grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-[16px]">
        <GlassPanel className="p-[18px]">
          <div className="panel-title">
            Payment Volume Over Time <span className="text-[12px] font-medium text-[var(--muted-foreground)]">(24h)</span>
          </div>
          <PaymentVolumeChart />
        </GlassPanel>
        <GlassPanel className="p-[18px]">
          <div className="panel-title">Decision Distribution</div>
          <DecisionDonut />
        </GlassPanel>
      </div>

      <GlassPanel className="mb-[16px] p-[18px]">
        <div className="panel-title">Risk Score Distribution</div>
        <RiskDistributionBars />
      </GlassPanel>

      <div className="responsive-stack grid grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-[16px]">
        <GlassPanel className="min-w-0 p-[18px]">
          <div className="panel-title">Recent High-Risk Payments</div>
          <GridTable columns={highRiskColumns} headers={["Payment ID", "Amount", "Risk", "Decision", "Signals"]} minWidth={560}>
            {highRisk.map((payment) => (
              <GridRow columns={highRiskColumns} key={payment.id} onClick={() => navigate(`/payments/${payment.id}`)}>
                <GridCell className="mono whitespace-nowrap font-medium text-[var(--accent-dark)]">{payment.id}</GridCell>
                <GridCell className="whitespace-nowrap text-[13px] font-semibold">{formatAmount(payment)}</GridCell>
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
        </GlassPanel>

        <div className="flex min-w-0 flex-col gap-[16px]">
          <GlassPanel className="p-[18px]">
            <div className="panel-title">System Health</div>
            <div className="flex flex-col gap-[10px] text-[13px]">
              <HealthRow label="SDK Ingestion" value="Healthy" tone="success" />
              <HealthRow label="Webhook Delivery" value="99.7%" tone="success" />
              <HealthRow label="Staging SDK" value="Degraded" tone="warning" />
            </div>
          </GlassPanel>

          <GlassPanel className="p-[18px]">
            <div className="panel-title">Top Flagged Agents</div>
            <div className="flex flex-col gap-[12px]">
              <AgentBar name="checkout-service-prod" value={42} width="100%" opacity={1} />
              <AgentBar name="mobile-app-v3" value={28} width="67%" opacity={0.75} />
              <AgentBar name="web-checkout-v2" value={15} width="36%" opacity={0.5} />
            </div>
          </GlassPanel>
        </div>
      </div>
    </section>
  );
}

function HealthRow({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-[8px]">
        <StatusDot tone={tone} />
        {label}
      </span>
      <span className="font-bold" style={{ color: tone === "success" ? "var(--success-text)" : "var(--warning-text)" }}>
        {value}
      </span>
    </div>
  );
}

function AgentBar({ name, value, width, opacity }: { name: string; value: number; width: string; opacity: number }) {
  return (
    <div>
      <div className="mb-[4px] flex justify-between text-[13px]">
        <span className="mono text-[12px]">{name}</span>
        <b>{value}</b>
      </div>
      <div className="h-[5px] rounded-[3px] bg-[rgba(86,66,86,0.10)]">
        <div className="h-full rounded-[3px] bg-[var(--accent)]" style={{ width, opacity }} />
      </div>
    </div>
  );
}
