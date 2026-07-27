import type { HTMLAttributes } from "react";
import { cn } from "../ui/utils";
import {
  auditActionStyle,
  decisionLabel,
  decisionStyle,
  riskStyle,
  toneStyle,
  type BadgeTone,
  type DecisionStatus,
} from "../../lib/risk";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "lg";
}

export function StatusBadge({ tone = "neutral", size = "sm", className, style, ...props }: BadgeProps) {
  const colors = toneStyle(tone);
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[999px] font-bold",
        size === "lg" ? "px-[14px] py-[5px] text-[16px] font-extrabold" : "px-[10px] py-[2px] text-[11.5px]",
        className,
      )}
      style={{ ...colors, ...style }}
      {...props}
    />
  );
}

export function RiskBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[999px] font-bold",
        size === "lg" ? "min-w-[48px] px-[14px] py-[5px] text-[16px] font-extrabold" : "min-w-[34px] px-[10px] py-[2px] text-[11.5px]",
      )}
      style={riskStyle(score)}
    >
      {score}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: DecisionStatus }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-[999px] px-[10px] py-[2px] text-[11.5px] font-bold"
      style={decisionStyle(decision)}
    >
      {decisionLabel(decision)}
    </span>
  );
}

export function AuditActionBadge({ action }: { action: string }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-[999px] px-[10px] py-[2px] text-[11.5px] font-bold"
      style={auditActionStyle(action)}
    >
      {action}
    </span>
  );
}

export function StatusDot({
  tone = "success",
  pulse = false,
  size = 8,
}: {
  tone?: BadgeTone;
  pulse?: boolean;
  size?: number;
}) {
  const colors = {
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    neutral: "var(--muted-foreground)",
  };

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 rounded-full", pulse && "animate-[pulseDot_2.4s_infinite]")}
      style={{ width: size, height: size, background: colors[tone] }}
    />
  );
}
