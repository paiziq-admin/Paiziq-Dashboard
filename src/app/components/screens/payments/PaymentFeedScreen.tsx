import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { fetchAgents, fetchPayments } from "../../../api/resources";
import type { Agent, Payment, PaymentState } from "../../../api/types";
import {
  getTimeBounds,
  TIME_RANGE_OPTIONS,
  useSession,
  useWorkspace,
} from "../../../context/DashboardContext";
import { formatAmount, formatDateTime } from "../../../lib/formatters";
import { AsyncBoundary } from "../../feedback/AsyncBoundary";
import {
  ActionButton,
  DecisionBadge,
  EmptyState,
  FilterBar,
  GlassPanel,
  GridCell,
  GridRow,
  GridTable,
  StatusDot,
} from "../../primitives";

type SortOrder =
  | "created_desc"
  | "created_asc"
  | "amount_desc"
  | "amount_asc"
  | "merchant_asc";

interface FeedFilters {
  state: PaymentState | "";
  agentId: string;
  currency: string;
  minAmount: string;
  maxAmount: string;
  query: string;
}

interface SavedView {
  id: string;
  name: string;
  filters: FeedFilters;
  sort: SortOrder;
  pageSize: number;
}

interface FeedData {
  payments: Payment[];
  total: number;
  agents: Agent[];
  updatedAt: number;
}

interface PaymentPage {
  payments: Payment[];
  total: number;
  page: number;
}

const DEFAULT_FILTERS: FeedFilters = {
  state: "",
  agentId: "",
  currency: "",
  minAmount: "",
  maxAmount: "",
  query: "",
};
const SAVED_VIEWS_KEY = "paiziq.dashboard.payment-views";
const SORT_ORDERS: SortOrder[] = [
  "created_desc",
  "created_asc",
  "amount_desc",
  "amount_asc",
  "merchant_asc",
];
const PAGE_SIZES = [10, 25, 50, 100];
const columns =
  "minmax(150px,1.15fr) 126px minmax(130px,1fr) minmax(110px,.8fr) 118px minmax(130px,1fr) 110px minmax(130px,1fr)";

export function PaymentFeedScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useSession();
  const {
    environmentId,
    selectedEnvironment,
    timeRange,
    loading: workspaceLoading,
    error: workspaceError,
    refreshWorkspace,
  } = useWorkspace();
  const [filters, setFilters] = useState<FeedFilters>(() => ({
    ...DEFAULT_FILTERS,
    query: searchParams.get("q") ?? "",
  }));
  const [sort, setSort] = useState<SortOrder>("created_desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  const [savedViews, setSavedViews] = useState<SavedView[]>(loadSavedViews);
  const [activeView, setActiveView] = useState("");

  useEffect(() => {
    const query = searchParams.get("q") ?? "";
    setFilters((current) =>
      current.query === query ? current : { ...current, query },
    );
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (session?.mode !== "live" || !environmentId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    const bounds = getTimeBounds(timeRange);
    const minAmount = optionalNumber(filters.minAmount);
    const maxAmount = optionalNumber(filters.maxAmount);
    Promise.all([
      fetchPaymentPage({
        env_id: environmentId,
        agent_id: filters.agentId || undefined,
        state: filters.state || undefined,
        currency:
          filters.currency.trim().length === 3
            ? filters.currency.trim().toUpperCase()
            : undefined,
        min_amount: minAmount,
        max_amount: maxAmount,
        q: filters.query.trim() || undefined,
        ...bounds,
        sort,
        page,
        pageSize,
      }),
      fetchAgents({ env_id: environmentId, limit: 200, offset: 0 }),
    ])
      .then(([payments, agents]) => {
        if (!active) return;
        if (payments.page !== page) setPage(payments.page);
        setData({
          payments: payments.payments,
          total: payments.total,
          agents: agents.data,
          updatedAt: Date.now(),
        });
      })
      .catch((cause) => {
        if (active) setError(cause);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    environmentId,
    filters.agentId,
    filters.currency,
    filters.maxAmount,
    filters.minAmount,
    filters.query,
    filters.state,
    page,
    pageSize,
    revision,
    session,
    sort,
    timeRange,
  ]);

  useEffect(() => {
    if (session?.mode !== "live") return;
    const timer = window.setInterval(() => setRevision((value) => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => {
    setPage(1);
    setSelectedId(null);
  }, [environmentId, timeRange]);

  useEffect(() => {
    setFilters((current) =>
      current.agentId ? { ...current, agentId: "" } : current,
    );
  }, [environmentId]);

  const visibleRows = useMemo(() => {
    if (!data) return [];
    return data.payments;
  }, [data]);

  const selected = data?.payments.find((payment) => payment.id === selectedId) ?? null;
  const agentNames = useMemo(
    () => new Map(data?.agents.map((agent) => [agent.id, agent.name]) ?? []),
    [data],
  );
  const currencies = useMemo(
    () =>
      Array.from(
        new Set(
          [filters.currency, ...(data?.payments.map((payment) => payment.currency) ?? [])]
            .filter(Boolean),
        ),
      ).sort(),
    [data, filters.currency],
  );
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));
  const rangeLabel =
    TIME_RANGE_OPTIONS.find((option) => option.value === timeRange)?.label ?? timeRange;

  const updateFilter = <K extends keyof FeedFilters>(key: K, value: FeedFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
    setActiveView("");
  };
  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSort("created_desc");
    setPage(1);
    setActiveView("");
  };
  const saveView = () => {
    const suggested =
      filters.state
        ? `${filters.state.replace("_", " ")} · ${sort.replace("_", " ")}`
        : `Payments · ${sort.replace("_", " ")}`;
    const name = window.prompt("Name this saved view", suggested)?.trim();
    if (!name) return;
    const view: SavedView = {
      id: `view-${Date.now()}`,
      name,
      filters,
      sort,
      pageSize,
    };
    const next = [...savedViews, view];
    persistSavedViews(next);
    setSavedViews(next);
    setActiveView(view.id);
  };
  const applyView = (id: string) => {
    setActiveView(id);
    const view = savedViews.find((item) => item.id === id);
    if (!view) return;
    setFilters({ ...DEFAULT_FILTERS, ...view.filters });
    setSort(view.sort);
    setPageSize(view.pageSize);
    setPage(1);
  };
  const deleteView = () => {
    if (!activeView) return;
    const next = savedViews.filter((view) => view.id !== activeView);
    persistSavedViews(next);
    setSavedViews(next);
    setActiveView("");
  };
  const retry = () => {
    refreshWorkspace();
    setRevision((value) => value + 1);
  };

  return (
    <section data-screen-label="Live Payment Feed">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[8px]">
        <div>
          <h1 className="page-title flex items-center gap-[10px]">
            Live Payment Feed
            {session?.mode === "live" ? (
              <span className="inline-flex items-center gap-[6px] rounded-[999px] bg-[rgba(74,138,104,0.14)] px-[10px] py-[3px] text-[11px] font-bold text-[var(--success-text)]">
                <StatusDot pulse size={6} tone="success" />
                LIVE
              </span>
            ) : null}
          </h1>
          <div className="mt-[4px] text-[12px] text-[var(--muted-foreground)]">
            {selectedEnvironment?.name ?? "No environment"} · {rangeLabel}
          </div>
        </div>
        <div className="flex items-center gap-[10px] text-[12px] text-[var(--muted-foreground)]">
          {data ? <span>{data.total.toLocaleString()} payments</span> : null}
          <ActionButton className="h-[32px]" onClick={() => setRevision((value) => value + 1)}>
            <RefreshCw size={13} /> Refresh
          </ActionButton>
        </div>
      </div>

      <AsyncBoundary
        empty={
          session?.mode === "demo" ||
          (!workspaceLoading && !workspaceError && !environmentId)
        }
        emptyTitle={session?.mode === "demo" ? "Demo mode has no live payment feed" : "No environment selected"}
        emptyBody={
          session?.mode === "demo"
            ? "Connect a backend to query paginated payments."
            : "Select or create an environment to load payments."
        }
        error={workspaceError ?? error}
        loading={workspaceLoading || loading}
        loadingLabel="Loading payments"
        onRetry={retry}
      >
        {data ? (
          <>
            <FilterBar>
              <select
                aria-label="Saved payment view"
                className="control-sm max-w-[180px]"
                value={activeView}
                onChange={(event) => applyView(event.target.value)}
              >
                <option value="">Unsaved view</option>
                {savedViews.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}
              </select>
              <ActionButton className="h-[32px]" onClick={saveView}><Save size={13} /> Save view</ActionButton>
              {activeView ? (
                <ActionButton aria-label="Delete saved view" className="h-[32px]" onClick={deleteView}><Trash2 size={13} /></ActionButton>
              ) : null}
              <span className="h-[22px] w-px bg-[var(--border)]" />
              <select
                aria-label="Payment state"
                className="control-sm"
                value={filters.state}
                onChange={(event) => updateFilter("state", event.target.value as PaymentState | "")}
              >
                <option value="">All states</option>
                <option value="proposed">Proposed</option>
                <option value="approved">Approved</option>
                <option value="needs_review">Needs review</option>
                <option value="rejected">Rejected</option>
                <option value="executed">Executed</option>
                <option value="failed">Failed</option>
              </select>
              <select
                aria-label="Agent"
                className="control-sm max-w-[190px]"
                value={filters.agentId}
                onChange={(event) => updateFilter("agentId", event.target.value)}
              >
                <option value="">All agents</option>
                {data.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              </select>
              <input
                aria-label="Currency"
                className="control-sm"
                list="payment-currency-options"
                maxLength={3}
                placeholder="Currency"
                value={filters.currency}
                onChange={(event) =>
                  updateFilter("currency", event.target.value.toUpperCase())
                }
              />
              <datalist id="payment-currency-options">
                {currencies.map((currency) => (
                  <option key={currency} value={currency} />
                ))}
              </datalist>
              <input
                aria-label="Minimum amount"
                className="control-sm w-[112px]"
                min="0"
                placeholder="Min amount"
                type="number"
                value={filters.minAmount}
                onChange={(event) => updateFilter("minAmount", event.target.value)}
              />
              <input
                aria-label="Maximum amount"
                className="control-sm w-[112px]"
                min="0"
                placeholder="Max amount"
                type="number"
                value={filters.maxAmount}
                onChange={(event) => updateFilter("maxAmount", event.target.value)}
              />
              <input
                aria-label="Search payments"
                className="control-sm min-w-[180px] flex-1"
                placeholder="ID, principal, merchant..."
                type="search"
                value={filters.query}
                onChange={(event) => updateFilter("query", event.target.value)}
              />
              <select
                aria-label="Sort payments"
                className="control-sm"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortOrder);
                  setPage(1);
                  setActiveView("");
                }}
              >
                <option value="created_desc">Newest first</option>
                <option value="created_asc">Oldest first</option>
                <option value="amount_desc">Amount high-low</option>
                <option value="amount_asc">Amount low-high</option>
                <option value="merchant_asc">Merchant A-Z</option>
              </select>
            </FilterBar>

            <div className="mb-[10px] text-[11.5px] text-[var(--muted-foreground)]">
              Environment, agent, state, time, amount, currency, search, sorting, and pagination are applied by the backend, so totals and page boundaries reflect the active filters.
            </div>

            <div className="mobile-wrap flex items-start gap-[14px]">
              <GlassPanel className="min-w-0 flex-1 overflow-hidden">
                {visibleRows.length === 0 ? (
                  <EmptyState
                    title="No payments match this page"
                    body="Try clearing filters, widening the global time range, or moving to another page."
                    action="Clear filters"
                    onAction={clearFilters}
                  />
                ) : (
                  <GridTable
                    columns={columns}
                    headers={["Payment ID", "Created", "Agent", "Principal", "Amount", "Merchant", "State", "Request ID"]}
                    minWidth={1040}
                  >
                    {visibleRows.map((payment) => (
                      <GridRow
                        columns={columns}
                        key={payment.id}
                        selected={selectedId === payment.id}
                        onClick={() => setSelectedId(payment.id)}
                      >
                        <GridCell className="mono whitespace-nowrap">
                          <button
                            className="focus-ring button-reset font-medium text-[var(--accent-dark)] hover:underline"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/payments/${payment.id}`);
                            }}
                          >
                            {payment.id}
                          </button>
                        </GridCell>
                        <GridCell className="whitespace-nowrap text-[12px] text-[var(--muted-foreground)]">
                          {formatDateTime(payment.created_at_ms)}
                        </GridCell>
                        <GridCell className="mono truncate text-[12px]" title={payment.agent_id}>
                          {agentNames.get(payment.agent_id) ?? payment.agent_id}
                        </GridCell>
                        <GridCell className="mono truncate text-[12px] text-[var(--text-secondary)]">
                          {payment.principal_id}
                        </GridCell>
                        <GridCell className="whitespace-nowrap text-right text-[13px] font-bold">
                          {formatAmount(payment)}
                        </GridCell>
                        <GridCell className="truncate">{payment.merchant}</GridCell>
                        <GridCell><DecisionBadge decision={payment.state} /></GridCell>
                        <GridCell className="mono truncate text-[11.5px] text-[var(--muted-foreground)]">
                          {payment.request_id ?? "-"}
                        </GridCell>
                      </GridRow>
                    ))}
                  </GridTable>
                )}

                <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[var(--border)] p-[12px] text-[12px] text-[var(--muted-foreground)]">
                  <span>
                    {visibleRows.length} matching on page {page} of {pageCount}
                    {data.updatedAt ? ` · updated ${formatDateTime(data.updatedAt)}` : ""}
                  </span>
                  <div className="flex items-center gap-[8px]">
                    <select
                      aria-label="Rows per page"
                      className="control-sm"
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                    >
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                    <ActionButton className="h-[30px]" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                      Previous
                    </ActionButton>
                    <ActionButton className="h-[30px]" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                      Next
                    </ActionButton>
                  </div>
                </div>
              </GlassPanel>

              {selected ? (
                <GlassPanel variant="strong" className="mobile-full sticky top-0 w-[320px] shrink-0 p-[18px]">
                  <div className="mb-[14px] flex items-center justify-between">
                    <div className="text-[14px] font-bold">Quick Preview</div>
                    <button
                      aria-label="Close preview"
                      className="focus-ring h-[26px] w-[26px] rounded-[8px] border-0 bg-[var(--secondary)] text-[var(--foreground)]"
                      type="button"
                      onClick={() => setSelectedId(null)}
                    >
                      ×
                    </button>
                  </div>
                  <PreviewLabel label="Payment ID" />
                  <div className="mono mb-[12px] mt-[2px] break-all text-[12.5px]">{selected.id}</div>
                  <PreviewLabel label="Amount" />
                  <div className="mb-[12px] mt-[2px] text-[24px] font-extrabold">{formatAmount(selected)}</div>
                  <PreviewLabel label="State" />
                  <div className="mb-[14px] mt-[4px]"><DecisionBadge decision={selected.state} /></div>
                  <div className="mb-[16px] grid grid-cols-[1fr_1fr] gap-x-[14px] gap-y-[8px] text-[12.5px]">
                    <span className="text-[var(--muted-foreground)]">Agent</span>
                    <span className="mono truncate text-[12px]">{agentNames.get(selected.agent_id) ?? selected.agent_id}</span>
                    <span className="text-[var(--muted-foreground)]">Principal</span>
                    <span className="mono truncate text-[12px]">{selected.principal_id}</span>
                    <span className="text-[var(--muted-foreground)]">Merchant</span>
                    <span className="truncate">{selected.merchant}</span>
                    <span className="text-[var(--muted-foreground)]">Created</span>
                    <span>{formatDateTime(selected.created_at_ms)}</span>
                  </div>
                  {selected.intent_description ? (
                    <>
                      <PreviewLabel label="Intent" />
                      <p className="mb-[16px] mt-[4px] text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">{selected.intent_description}</p>
                    </>
                  ) : null}
                  <button
                    className="focus-ring h-[36px] w-full rounded-[9px] border-0 bg-[var(--primary)] text-[13px] font-bold text-white hover:bg-[var(--primary-dark)]"
                    type="button"
                    onClick={() => navigate(`/payments/${selected.id}`)}
                  >
                    Open payment trace →
                  </button>
                </GlassPanel>
              ) : null}
            </div>
          </>
        ) : null}
      </AsyncBoundary>
    </section>
  );
}

function PreviewLabel({ label }: { label: string }) {
  return <div className="label-caps mb-[4px]">{label}</div>;
}

async function fetchPaymentPage({
  env_id,
  agent_id,
  state,
  currency,
  min_amount,
  max_amount,
  q,
  from_ms,
  to_ms,
  sort,
  page,
  pageSize,
}: {
  env_id: string;
  agent_id?: string;
  state?: PaymentState;
  currency?: string;
  min_amount?: number;
  max_amount?: number;
  q?: string;
  from_ms: number;
  to_ms: number;
  sort: SortOrder;
  page: number;
  pageSize: number;
}): Promise<PaymentPage> {
  const filters = {
    env_id,
    agent_id,
    state,
    currency,
    min_amount,
    max_amount,
    q,
    from_ms,
    to_ms,
    sort,
  };
  const requestedPage = Math.max(1, page);
  let result = await fetchPayments({
    ...filters,
    limit: pageSize,
    offset: (requestedPage - 1) * pageSize,
  });
  const total = result.meta?.total ?? result.data.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(requestedPage, pageCount);

  if (safePage !== requestedPage && total > 0) {
    result = await fetchPayments({
      ...filters,
      limit: pageSize,
      offset: (safePage - 1) * pageSize,
    });
  }

  return { payments: result.data, total, page: safePage };
}

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function loadSavedViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(SAVED_VIEWS_KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((candidate): SavedView[] => {
      if (!isRecord(candidate) || typeof candidate.id !== "string") return [];
      const rawFilters = isRecord(candidate.filters) ? candidate.filters : {};
      const state =
        typeof rawFilters.state === "string" &&
        ["proposed", "approved", "needs_review", "rejected", "executed", "failed"].includes(
          rawFilters.state,
        )
          ? rawFilters.state as PaymentState
          : "";
      const sort = SORT_ORDERS.includes(candidate.sort as SortOrder)
        ? candidate.sort as SortOrder
        : "created_desc";
      const pageSize = PAGE_SIZES.includes(Number(candidate.pageSize))
        ? Number(candidate.pageSize)
        : 25;
      return [{
        id: candidate.id,
        name:
          typeof candidate.name === "string" && candidate.name.trim()
            ? candidate.name
            : "Saved payments",
        filters: {
          state,
          agentId: stringValue(rawFilters.agentId),
          currency: stringValue(rawFilters.currency).toUpperCase(),
          minAmount: stringValue(rawFilters.minAmount),
          maxAmount: stringValue(rawFilters.maxAmount),
          query: stringValue(rawFilters.query),
        },
        sort,
        pageSize,
      }];
    });
  } catch {
    return [];
  }
}

function persistSavedViews(views: SavedView[]) {
  window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
