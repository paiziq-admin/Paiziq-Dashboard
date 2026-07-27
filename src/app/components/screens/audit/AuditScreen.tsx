import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Download, Lock, Search } from "lucide-react";
import { fetchAuditPage, type AuditFilters } from "../../../api/admin";
import type { AuditEntry } from "../../../api/types";
import {
  ActionButton,
  AuditActionBadge,
  CodeBlock,
  DrawerPanel,
  EmptyState,
  FilterBar,
  GlassPanel,
  GridCell,
  GridRow,
  GridTable,
} from "../../primitives";
import {
  CapabilityNotice,
  ErrorPanel,
  RefreshButton,
  errorMessage,
  formatTimestamp,
} from "../admin/AdminSupport";

const PAGE_SIZE = 50;
const columns = "175px minmax(160px,1fr) minmax(170px,1fr) minmax(170px,1fr) minmax(260px,1.6fr)";

type FilterForm = {
  range: "24h" | "7d" | "30d" | "90d" | "all";
  actor: string;
  action: string;
  resource: string;
};

const initialFilters: FilterForm = {
  range: "7d",
  actor: "",
  action: "",
  resource: "",
};

export function AuditScreen() {
  const [form, setForm] = useState<FilterForm>(initialFilters);
  const [filters, setFilters] = useState<FilterForm>(initialFilters);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [exportError, setExportError] = useState("");
  const [reload, setReload] = useState(0);

  const requestFilters = useMemo(() => toRequestFilters(filters), [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAuditPage({ ...requestFilters, limit: PAGE_SIZE, offset })
      .then((result) => {
        if (cancelled) return;
        setEntries(result.data);
        setTotal(result.meta?.total ?? result.data.length);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [offset, reload, requestFilters]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setOffset(0);
    setFilters({
      ...form,
      actor: form.actor.trim(),
      action: form.action.trim(),
      resource: form.resource.trim(),
    });
  }

  function clearFilters() {
    setForm(initialFilters);
    setFilters(initialFilters);
    setOffset(0);
  }

  async function exportCsv() {
    setExporting(true);
    setExportError("");
    try {
      const all: AuditEntry[] = [];
      let nextOffset = 0;
      let expected = Number.POSITIVE_INFINITY;
      while (nextOffset < expected) {
        const page = await fetchAuditPage({ ...requestFilters, limit: 200, offset: nextOffset });
        all.push(...page.data);
        expected = page.meta?.total ?? all.length;
        if (!page.data.length || page.data.length < 200) break;
        nextOffset += page.data.length;
      }
      downloadAuditCsv(all);
    } catch (cause) {
      setExportError(errorMessage(cause));
    } finally {
      setExporting(false);
    }
  }

  const pageStart = total ? offset + 1 : 0;
  const pageEnd = Math.min(offset + entries.length, total);

  return (
    <section data-screen-label="Audit Log">
      <div className="mobile-wrap mb-[16px] flex items-center justify-between gap-[12px]">
        <div>
          <div className="flex items-center gap-[8px]">
            <h1 className="page-title">Audit log</h1>
            <span className="flex items-center gap-[5px] text-[11px] text-[var(--muted-foreground)]">
              <Lock size={11} /> append-only
            </span>
          </div>
          <div className="mt-[3px] text-[12px] text-[var(--muted-foreground)]">
            Sensitive control-plane activity in the authenticated API scope.
          </div>
        </div>
        <ActionButton className="mobile-full" disabled={exporting} onClick={() => void exportCsv()} type="button">
          {exporting ? <span className="status-spinner" /> : <Download className="mr-[6px]" size={13} />}
          {exporting ? "Preparing export" : "Export filtered CSV"}
        </ActionButton>
      </div>

      <CapabilityNotice title="Filters use exact matches">
        The backend matches actor, action, and resource values exactly. Date ranges map to the supported
        <span className="mono"> from_ms</span> and <span className="mono">to_ms</span> parameters.
      </CapabilityNotice>

      <form onSubmit={applyFilters}>
        <FilterBar className="mt-[14px]">
          <select
            aria-label="Audit date range"
            className="control-sm mobile-full"
            value={form.range}
            onChange={(event) => setForm({ ...form, range: event.target.value as FilterForm["range"] })}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <input
            aria-label="Exact actor"
            className="control-sm mobile-full w-[190px]"
            placeholder="Exact actor"
            value={form.actor}
            onChange={(event) => setForm({ ...form, actor: event.target.value })}
          />
          <input
            aria-label="Exact action"
            className="control-sm mobile-full w-[180px]"
            placeholder="Exact action (policy.publish)"
            value={form.action}
            onChange={(event) => setForm({ ...form, action: event.target.value })}
          />
          <input
            aria-label="Exact resource"
            className="control-sm mobile-full w-[180px]"
            placeholder="Exact resource ID"
            value={form.resource}
            onChange={(event) => setForm({ ...form, resource: event.target.value })}
          />
          <ActionButton className="h-[32px] mobile-full" type="submit">
            <Search className="mr-[6px]" size={13} />Apply
          </ActionButton>
          <ActionButton className="h-[32px] mobile-full" onClick={clearFilters} type="button">Clear</ActionButton>
          <div className="flex-1" />
          <RefreshButton busy={loading} onClick={() => setReload((value) => value + 1)} />
        </FilterBar>
      </form>

      {exportError ? (
        <div className="mb-[12px] rounded-[10px] border border-[rgba(192,91,71,0.22)] bg-[rgba(192,91,71,0.10)] p-[10px_12px] text-[12px] text-[var(--danger-text)]">
          Export failed: {exportError}
        </div>
      ) : null}

      {error ? (
        <ErrorPanel error={error} onRetry={() => setReload((value) => value + 1)} />
      ) : (
        <GlassPanel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[rgba(86,66,86,0.10)] p-[11px_14px] text-[11.5px] text-[var(--muted-foreground)]">
            <span>{pageStart}–{pageEnd} of {total}</span>
            <span>Newest first</span>
          </div>
          {loading ? (
            <div className="flex min-h-[210px] items-center justify-center gap-[8px] text-[12.5px] text-[var(--muted-foreground)]">
              <span className="status-spinner" /> Loading audit events
            </div>
          ) : entries.length ? (
            <GridTable columns={columns} headers={["Timestamp", "Actor", "Action", "Resource", "Detail"]} minWidth={980}>
              {entries.map((entry) => (
                <GridRow columns={columns} key={entry.id} onClick={() => setSelected(entry)}>
                  <GridCell className="mono whitespace-nowrap text-[11.5px]">{formatTimestamp(entry.at_ms)}</GridCell>
                  <GridCell className="mono truncate text-[11.5px]">{entry.actor}</GridCell>
                  <GridCell><AuditActionBadge action={entry.action} /></GridCell>
                  <GridCell className="mono truncate text-[11.5px]">{entry.resource}</GridCell>
                  <GridCell className="mono truncate text-[11px] text-[var(--text-secondary)]">
                    {Object.keys(entry.detail).length ? JSON.stringify(entry.detail) : "{}"}
                  </GridCell>
                </GridRow>
              ))}
            </GridTable>
          ) : (
            <EmptyState
              title="No audit events"
              body="No append-only events match the exact filters and date range."
              action="Clear filters"
              onAction={clearFilters}
            />
          )}
          {total > PAGE_SIZE ? (
            <div className="flex items-center justify-end gap-[8px] border-t border-[rgba(86,66,86,0.10)] p-[11px_14px]">
              <ActionButton disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} type="button">Previous</ActionButton>
              <span className="mono min-w-[78px] text-center text-[11.5px] text-[var(--muted-foreground)]">
                {Math.floor(offset / PAGE_SIZE) + 1} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <ActionButton disabled={offset + PAGE_SIZE >= total || loading} onClick={() => setOffset(offset + PAGE_SIZE)} type="button">Next</ActionButton>
            </div>
          ) : null}
        </GlassPanel>
      )}

      <DrawerPanel open={!!selected} title="Audit event details" onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <dl className="mb-[16px] grid grid-cols-[90px_1fr] gap-x-[12px] gap-y-[8px] text-[12.5px]">
              <Meta label="Timestamp" value={formatTimestamp(selected.at_ms)} />
              <Meta label="Event ID" value={selected.id} mono />
              <Meta label="Actor" value={selected.actor} mono />
              <Meta label="Action" value={selected.action} mono />
              <Meta label="Resource" value={selected.resource} mono />
            </dl>
            <div className="label-caps mb-[6px]">Immutable detail</div>
            <CodeBlock value={JSON.stringify(selected.detail, null, 2)} />
            <div className="label-caps mb-[6px] mt-[16px]">Full event</div>
            <CodeBlock value={JSON.stringify(selected, null, 2)} />
          </>
        ) : null}
      </DrawerPanel>
    </section>
  );
}

function Meta({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <>
      <dt className="text-[var(--muted-foreground)]">{label}</dt>
      <dd className={`m-0 min-w-0 break-all ${mono ? "mono text-[11.5px]" : ""}`}>{value}</dd>
    </>
  );
}

function toRequestFilters(filters: FilterForm): AuditFilters {
  const now = Date.now();
  const duration = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
    all: 0,
  }[filters.range];
  return {
    actor: filters.actor || undefined,
    action: filters.action || undefined,
    resource: filters.resource || undefined,
    from_ms: duration ? now - duration : undefined,
    to_ms: duration ? now : undefined,
  };
}

function downloadAuditCsv(entries: AuditEntry[]) {
  const rows = [
    ["id", "at_ms", "timestamp_utc", "actor", "action", "resource", "detail_json"],
    ...entries.map((entry) => [
      entry.id,
      String(entry.at_ms),
      new Date(entry.at_ms).toISOString(),
      entry.actor,
      entry.action,
      entry.resource,
      JSON.stringify(entry.detail),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `paiziq-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
