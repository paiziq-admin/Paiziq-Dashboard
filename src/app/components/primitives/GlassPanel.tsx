import type { HTMLAttributes } from "react";
import { cn } from "../ui/utils";

type GlassPanelVariant = "default" | "strong" | "header" | "accent";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassPanelVariant;
}

export function GlassPanel({ className, variant = "default", ...props }: GlassPanelProps) {
  const variantClass = {
    default: "glass-panel",
    strong: "glass-panel-strong",
    header: "glass-header",
    accent: "glass-panel-strong border-[rgba(252,129,74,0.45)] shadow-[var(--shadow-accent)]",
  }[variant];

  return <div className={cn(variantClass, className)} {...props} />;
}

