import { useState } from "react";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { auditLogEntries } from "../../../data/audit";
import { formatTime } from "../../../lib/formatters";
import { AuditActionBadge, CodeBlock, DrawerPanel, FilterBar, GlassPanel, GridCell, GridRow, GridTable } from "../../primitives";

const columns = "130px minmax(170px,1.1fr) minmax(160px,1.1fr) minmax(140px,1fr) minmax(200px,1.5fr) 120px";

export function AuditScreen() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? null : auditLogEntries[selectedIndex];

  return (
    <section data-screen-label="Audit Log">
      <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-[8px]">
        <h1 className="page-title">Audit Log</h1>
        <span className="flex items-center gap-[6px] text-[11.5px] text-[var(--muted-foreground)]">
          <Lock size={12} />
          Immutable - append-only
        </span>
      </div>

      <FilterBar>
        <select className="control-sm" aria-label="Date range">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
        <select className="control-sm" aria-label="Event type">
          <option>All event types</option>
          <option>Payment actions</option>
          <option>Policy changes</option>
          <option>API key events</option>
          <option>User management</option>
        </select>
        <input className="control-sm w-[180px]" placeholder="Actor (email or user ID)" aria-label="Actor" />
        <input className="control-sm w-[180px]" placeholder="Entity ID (payment, agent...)" aria-label="Entity ID" />
      </FilterBar>

      <GlassPanel className="overflow-hidden">
        <GridTable columns={columns} headers={["Timestamp", "Actor", "Action", "Entity", "Change", "IP Address"]} minWidth={940}>
          {auditLogEntries.map((entry, index) => (
            <GridRow columns={columns} key={`${entry.timestamp}-${entry.action}`} onClick={() => setSelectedIndex(index)} selected={selectedIndex === index}>
              <GridCell className="mono whitespace-nowrap text-[12px]">{formatTime(entry.timestamp)}</GridCell>
              <GridCell className="truncate">{entry.actor}</GridCell>
              <GridCell><AuditActionBadge action={entry.action} /></GridCell>
              <GridCell className="mono truncate text-[12px]">{entry.entity}</GridCell>
              <GridCell className="text-[11.5px]">
                {entry.previousValue ? (
                  <>
                    <span className="text-[var(--danger-text)]">{entry.previousValue}</span>
                    <span className="text-[var(--muted-foreground)]"> -&gt; </span>
                    <span className="text-[var(--success-text)]">{entry.newValue}</span>
                  </>
                ) : (
                  <span className="text-[var(--muted-foreground)]">-</span>
                )}
              </GridCell>
              <GridCell className="mono text-[12px] text-[var(--muted-foreground)]">{entry.ipAddress}</GridCell>
            </GridRow>
          ))}
        </GridTable>
      </GlassPanel>

      <DrawerPanel open={!!selected} title="Audit Event Details" onClose={() => setSelectedIndex(null)}>
        {selected ? (
          <>
            <div className="mb-[16px] grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[8px] text-[12.5px]">
              <Meta label="Timestamp" value={<span className="mono text-[12px]">{formatTime(selected.timestamp)}</span>} />
              <Meta label="Actor" value={selected.actor} />
              <Meta label="Action" value={<AuditActionBadge action={selected.action} />} />
              <Meta label="Entity" value={<span className="mono text-[12px]">{selected.entity}</span>} />
              <Meta label="IP Address" value={<span className="mono text-[12px]">{selected.ipAddress}</span>} />
            </div>
            {selected.previousValue && selected.newValue ? (
              <>
                <DrawerLabel>Previous Value</DrawerLabel>
                <div className="mono mb-[12px] rounded-[9px] border border-[rgba(192,91,71,0.22)] bg-[rgba(192,91,71,0.10)] p-[9px_12px] text-[12px] text-[var(--danger-text)]">{selected.previousValue}</div>
                <DrawerLabel>New Value</DrawerLabel>
                <div className="mono mb-[16px] rounded-[9px] border border-[rgba(74,138,104,0.25)] bg-[rgba(74,138,104,0.10)] p-[9px_12px] text-[12px] text-[var(--success-text)]">{selected.newValue}</div>
              </>
            ) : null}
            {selected.reason ? (
              <>
                <DrawerLabel>Reason</DrawerLabel>
                <div className="mb-[16px] text-[13px]">{selected.reason}</div>
              </>
            ) : null}
            <DrawerLabel>Full Event Metadata</DrawerLabel>
            <CodeBlock value={JSON.stringify(selected, null, 2)} />
          </>
        ) : null}
      </DrawerPanel>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span>{value}</span>
    </>
  );
}

function DrawerLabel({ children }: { children: string }) {
  return <div className="label-caps mb-[5px]">{children}</div>;
}
