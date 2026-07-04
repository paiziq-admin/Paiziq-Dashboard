import type { ReactNode } from "react";

export function KeyValueGrid({ rows }: { rows: Array<[ReactNode, ReactNode]> }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[6px] text-[12.5px]">
      {rows.map(([key, value], index) => (
        <div className="contents" key={index}>
          <span className="text-[var(--muted-foreground)]">{key}</span>
          <span className="min-w-0 text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

