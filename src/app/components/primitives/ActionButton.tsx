import type { ButtonHTMLAttributes } from "react";
import { cn } from "../ui/utils";

type ActionVariant = "primary" | "secondary" | "approve" | "reject" | "aubergine";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionVariant;
}

export function ActionButton({ className, variant = "secondary", ...props }: ActionButtonProps) {
  const variants: Record<ActionVariant, string> = {
    primary:
      "border-0 bg-[var(--accent)] text-white shadow-[var(--shadow-accent-button)] hover:bg-[var(--accent-hover)]",
    secondary:
      "border border-[rgba(86,66,86,0.2)] bg-[rgba(255,255,255,0.6)] text-[var(--primary)] hover:bg-[rgba(255,255,255,0.9)]",
    approve: "border-0 bg-[var(--success)] text-white shadow-[0_6px_16px_rgba(74,138,104,0.30)]",
    reject: "border-0 bg-[var(--danger)] text-white shadow-[0_6px_16px_rgba(192,91,71,0.30)]",
    aubergine: "border-0 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",
  };

  return (
    <button
      className={cn(
        "focus-ring inline-flex h-[36px] items-center justify-center rounded-[9px] px-[14px] text-[13px] font-bold transition disabled:border-0 disabled:bg-[rgba(86,66,86,0.12)] disabled:text-[var(--muted-foreground)] disabled:shadow-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

