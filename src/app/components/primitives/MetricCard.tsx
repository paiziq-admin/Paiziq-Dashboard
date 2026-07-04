import { GlassPanel } from "./GlassPanel";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  arrow?: string;
  good?: boolean;
}

export function MetricCard({ label, value, change, arrow, good = true }: MetricCardProps) {
  return (
    <GlassPanel className="p-[14px_16px]">
      <div className="label-caps mb-[6px]">{label}</div>
      <div className="mb-[5px] text-[24px] font-extrabold leading-none tracking-[-0.02em]">{value}</div>
      {change ? (
        <div className="text-[12px] font-bold" style={{ color: good ? "var(--success-text)" : "var(--danger-text)" }}>
          {arrow} {change}
        </div>
      ) : null}
    </GlassPanel>
  );
}

