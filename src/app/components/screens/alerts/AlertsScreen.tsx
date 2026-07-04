import { alerts, type AlertSeverity } from "../../../data/alerts";
import { StatusBadge, StatusDot } from "../../primitives";

const severityStyle: Record<AlertSeverity, { border: string; shadow: string; tone: "danger" | "warning" | "neutral"; label: string }> = {
  critical: {
    border: "rgba(192,91,71,0.35)",
    shadow: "0 8px 24px rgba(192,91,71,0.10)",
    tone: "danger",
    label: "Critical",
  },
  warning: {
    border: "rgba(217,151,59,0.35)",
    shadow: "0 8px 24px rgba(217,151,59,0.10)",
    tone: "warning",
    label: "Warning",
  },
  info: {
    border: "rgba(255,255,255,0.70)",
    shadow: "var(--shadow-panel)",
    tone: "neutral",
    label: "Info",
  },
};

export function AlertsScreen() {
  return (
    <section data-screen-label="Alerts">
      <h1 className="page-title mb-[16px]">Alerts</h1>
      <div className="flex max-w-[760px] flex-col gap-[10px]">
        {alerts.map((alert) => {
          const style = severityStyle[alert.severity];
          return (
            <div
              className="flex items-start gap-[12px] rounded-[12px] border bg-[rgba(255,255,255,0.6)] p-[14px_16px] backdrop-blur-[16px]"
              key={alert.title}
              style={{ borderColor: style.border, boxShadow: style.shadow }}
            >
              <span className="mt-[6px]">
                <StatusDot pulse={alert.severity === "critical"} size={8} tone={style.tone} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-bold">{alert.title}</div>
                <div className="text-[12.5px] text-[var(--text-secondary)]">{alert.description}</div>
                <div className="mono mt-[4px] text-[11.5px] text-[var(--muted-foreground)]">{alert.meta}</div>
              </div>
              <StatusBadge tone={style.tone}>{style.label}</StatusBadge>
            </div>
          );
        })}
        <div className="rounded-[12px] border border-dashed border-[rgba(86,66,86,0.2)] bg-[rgba(255,255,255,0.45)] p-[24px] text-center text-[12.5px] text-[var(--muted-foreground)]">
          No more alerts in the last 7 days. Resolved alerts move to the Audit Log.
        </div>
      </div>
    </section>
  );
}
