import { useEffect, useMemo, useState } from "react";
import { Activity, Bot, CircleOff, Radio } from "lucide-react";
import { ApiError } from "../../../api/client";
import { fetchAgentPage } from "../../../api/admin";
import { patchAgent } from "../../../api/resources";
import type { Agent } from "../../../api/types";
import {
  ActionButton,
  CodeBlock,
  DrawerPanel,
  EmptyState,
  FilterBar,
  GlassPanel,
  GridCell,
  GridRow,
  GridTable,
  MetricCard,
  StatusBadge,
} from "../../primitives";
import {
  CapabilityNotice,
  EnvironmentSelect,
  ErrorPanel,
  LoadingPanel,
  RefreshButton,
  errorMessage,
  formatTimestamp,
  useAdminEnvironments,
} from "../admin/AdminSupport";

const columns = "minmax(180px,1.4fr) 120px 120px minmax(210px,1.6fr) 170px 110px";

export function AgentsScreen() {
  const environment = useAdminEnvironments();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [actionError, setActionError] = useState("");
  const [mutation, setMutation] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!environment.selectedId) {
      setAgents([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAgentPage({ env_id: environment.selectedId, limit: 200, offset: 0 })
      .then((result) => {
        if (cancelled) return;
        setAgents(result.data);
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
  }, [environment.selectedId, reload]);

  const visibleAgents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return agents.filter((agent) => {
      if (status !== "all" && agent.status !== status) return false;
      if (!needle) return true;
      return (
        agent.name.toLowerCase().includes(needle) ||
        agent.id.toLowerCase().includes(needle) ||
        (agent.framework ?? "").toLowerCase().includes(needle)
      );
    });
  }, [agents, search, status]);

  const active = agents.filter((agent) => agent.status === "active").length;
  const disabled = agents.length - active;
  const frameworks = new Set(agents.map((agent) => agent.framework).filter(Boolean)).size;

  async function toggleStatus(agent: Agent) {
    const next = agent.status === "active" ? "disabled" : "active";
    if (next === "disabled" && !window.confirm(`Disable “${agent.name}”?`)) return;
    setMutation(agent.id);
    setActionError("");
    try {
      const result = await patchAgent(agent.id, { status: next });
      setAgents((items) => items.map((item) => (item.id === agent.id ? result.data : item)));
      setSelected((item) => (item?.id === agent.id ? result.data : item));
    } catch (cause) {
      setActionError(
        cause instanceof ApiError && cause.status === 403
          ? "Permission denied. This API key cannot update agents."
          : errorMessage(cause),
      );
    } finally {
      setMutation("");
    }
  }

  if (environment.loading) {
    return <ScreenFrame><LoadingPanel label="Loading environments" /></ScreenFrame>;
  }
  if (environment.error) {
    return <ScreenFrame><ErrorPanel error={environment.error} onRetry={environment.reload} /></ScreenFrame>;
  }
  if (!environment.environments.length) {
    return (
      <ScreenFrame>
        <GlassPanel>
          <EmptyState title="No environments available" body="Agents are registered within an environment." />
        </GlassPanel>
      </ScreenFrame>
    );
  }

  return (
    <section data-screen-label="Agent and SDK Monitoring">
      <div className="mobile-wrap mb-[16px] flex items-center justify-between gap-[12px]">
        <div>
          <h1 className="page-title">Agents</h1>
          <div className="mt-[3px] text-[12px] text-[var(--muted-foreground)]">
            Live registrations, framework metadata, and administrative status.
          </div>
        </div>
        <EnvironmentSelect
          className="mobile-full"
          environments={environment.environments}
          value={environment.selectedId}
          onChange={environment.setSelectedId}
        />
      </div>

      {error ? (
        <ErrorPanel error={error} onRetry={() => setReload((value) => value + 1)} />
      ) : (
        <>
          <div className="mb-[14px] grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-[12px]">
            <MetricCard label="Registered" value={String(total)} />
            <MetricCard label="Active" value={String(active)} />
            <MetricCard label="Disabled" value={String(disabled)} />
            <MetricCard label="Frameworks reported" value={String(frameworks)} />
          </div>

          <CapabilityNotice title="Runtime telemetry is not exposed">
            The agent API returns registration, framework, status, metadata, and creation time. It does not
            expose last-seen, SDK errors, latency, or health checks, so those values are not inferred here.
          </CapabilityNotice>

          {actionError ? (
            <div className="mt-[12px] rounded-[10px] border border-[rgba(192,91,71,0.22)] bg-[rgba(192,91,71,0.10)] p-[10px_12px] text-[12px] text-[var(--danger-text)]">
              {actionError}
            </div>
          ) : null}

          <FilterBar className="mt-[14px]">
            <input
              aria-label="Search agents"
              className="control-sm mobile-full w-[230px]"
              placeholder="Search name, ID, or framework"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              aria-label="Agent status"
              className="control-sm mobile-full"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <div className="flex-1" />
            <RefreshButton busy={loading} onClick={() => setReload((value) => value + 1)} />
          </FilterBar>

          <GlassPanel className="overflow-hidden">
            {loading ? (
              <div className="flex min-h-[190px] items-center justify-center gap-[8px] text-[12.5px] text-[var(--muted-foreground)]">
                <span className="status-spinner" /> Loading registered agents
              </div>
            ) : visibleAgents.length ? (
              <GridTable
                columns={columns}
                headers={["Agent", "Status", "Framework", "Metadata", "Registered", "Action"]}
                minWidth={920}
              >
                {visibleAgents.map((agent) => (
                  <GridRow columns={columns} key={agent.id} onClick={() => setSelected(agent)}>
                    <GridCell>
                      <div className="truncate font-bold">{agent.name}</div>
                      <div className="mono truncate text-[10.5px] text-[var(--muted-foreground)]">{agent.id}</div>
                    </GridCell>
                    <GridCell>
                      <StatusBadge tone={agent.status === "active" ? "success" : "neutral"}>
                        {agent.status}
                      </StatusBadge>
                    </GridCell>
                    <GridCell>{agent.framework ?? <span className="text-[var(--muted-foreground)]">Not reported</span>}</GridCell>
                    <GridCell className="mono truncate text-[11.5px] text-[var(--text-secondary)]">
                      {Object.keys(agent.metadata).length ? JSON.stringify(agent.metadata) : "—"}
                    </GridCell>
                    <GridCell className="mono whitespace-nowrap text-[11.5px]">{formatTimestamp(agent.created_at_ms)}</GridCell>
                    <GridCell>
                      <ActionButton
                        className="h-[28px] text-[11.5px]"
                        disabled={mutation === agent.id}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void toggleStatus(agent);
                        }}
                      >
                        {mutation === agent.id ? <span className="status-spinner" /> : agent.status === "active" ? "Disable" : "Enable"}
                      </ActionButton>
                    </GridCell>
                  </GridRow>
                ))}
              </GridTable>
            ) : (
              <EmptyState
                title={agents.length ? "No matching agents" : "No registered agents"}
                body={agents.length ? "Change the search or status filter." : "No agents have registered in this environment."}
                icon={<Bot size={22} />}
                action={agents.length ? "Clear filters" : undefined}
                onAction={
                  agents.length
                    ? () => {
                        setSearch("");
                        setStatus("all");
                      }
                    : undefined
                }
              />
            )}
          </GlassPanel>
        </>
      )}

      <DrawerPanel open={!!selected} title="Agent details" onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <div className="mb-[16px] flex items-center gap-[10px]">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[rgba(86,66,86,0.08)] text-[var(--primary)]">
                {selected.status === "active" ? <Radio size={18} /> : <CircleOff size={18} />}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-bold">{selected.name}</div>
                <StatusBadge tone={selected.status === "active" ? "success" : "neutral"}>{selected.status}</StatusBadge>
              </div>
            </div>
            <dl className="mb-[16px] grid grid-cols-[110px_1fr] gap-x-[10px] gap-y-[8px] text-[12.5px]">
              <Meta label="Agent ID" value={selected.id} mono />
              <Meta label="Environment" value={selected.env_id} mono />
              <Meta label="Framework" value={selected.framework ?? "Not reported"} />
              <Meta label="Registered" value={formatTimestamp(selected.created_at_ms)} />
            </dl>
            <div className="label-caps mb-[6px]">Metadata</div>
            <CodeBlock value={JSON.stringify(selected.metadata, null, 2)} />
            <CapabilityNotice title="Monitoring detail unavailable" tone="warning">
              <span className="inline-flex items-center gap-[5px]">
                <Activity size={13} />
                No per-agent events or health metrics are present in the current response contract.
              </span>
            </CapabilityNotice>
          </>
        ) : null}
      </DrawerPanel>
    </section>
  );
}

function ScreenFrame({ children }: { children: React.ReactNode }) {
  return (
    <section data-screen-label="Agent and SDK Monitoring">
      <h1 className="page-title mb-[16px]">Agents</h1>
      {children}
    </section>
  );
}

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-[var(--muted-foreground)]">{label}</dt>
      <dd className={`m-0 min-w-0 break-all ${mono ? "mono text-[11.5px]" : ""}`}>{value}</dd>
    </>
  );
}
