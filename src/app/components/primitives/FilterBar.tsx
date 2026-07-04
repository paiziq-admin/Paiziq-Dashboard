import type { HTMLAttributes } from "react";
import { cn } from "../ui/utils";
import { GlassPanel } from "./GlassPanel";

export function FilterBar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <GlassPanel className={cn("mb-[14px] flex flex-wrap items-center gap-[10px] p-[12px_14px]", className)} {...props} />;
}

