import type { CSSProperties, ReactNode } from "react";
import { cn } from "../ui/utils";

interface GridTableProps {
  columns: string;
  headers: ReactNode[];
  children: ReactNode;
  minWidth?: number;
  className?: string;
}

export function GridTable({ columns, headers, children, minWidth = 680, className }: GridTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div
        className="grid-table"
        style={
          {
            "--grid-template": columns,
            "--grid-min-width": `${minWidth}px`,
          } as CSSProperties
        }
      >
        {headers.length ? (
          <div className="grid-table-header">
            {headers.map((header, index) => (
              <div className="grid-table-heading" key={index}>
                {header}
              </div>
            ))}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

interface GridRowProps {
  columns: string;
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function GridRow({ columns, children, selected, onClick, className }: GridRowProps) {
  return (
    <div
      className={cn("grid-table-row", selected && "grid-table-row-selected", onClick && "cursor-pointer", className)}
      style={{ "--grid-template": columns } as CSSProperties}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

export function GridCell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid-table-cell", className)}>{children}</div>;
}
