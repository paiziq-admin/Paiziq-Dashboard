import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  fetchMetricsSummary,
  fetchMetricsTimeseries,
  fetchPayments,
} from "../../../api/resources";
import type { MetricsSummary, Payment, TimeseriesPoint } from "../../../api/types";
import {
  getTimeBounds,
  TIME_RANGE_OPTIONS,
  useSession,
  useWorkspace,
} from "../../../context/DashboardContext";
import { formatAmount, formatDateTime } from "../../../lib/formatters";
import { AsyncBoundary } from "../../feedback/AsyncBoundary";
import {
  DecisionBadge,
  GlassPanel,
  GridCell,
  GridRow,
  GridTable,
  MetricCard,
  StatusBadge,
} from "../../primitives";
import { DecisionDonut } from "../../charts/DecisionDonut";
import { PaymentVolumeChart } from "../../charts/PaymentVolumeChart";
import { RiskDistributionBars } from "../../charts/RiskDistributionBars";

interface OverviewData {
  summary: MetricsSummary;
  series: TimeseriesPoint[];
  payments: Payment[];
  updatedAt: number;
}

const recentColumns =
  "minmax(150px,1.2fr) 124px minmax(130px,1fr) minmax(130px,1fr) 124px 110px";

export function OverviewScreen() {
  const navigate = useNavigate();
  const { session } = useSession();
  const {
    environmentId,
    selectedEnvironment,
    timeRange,
    loading: workspaceLoading,
    error: workspaceError,
    refreshWorkspace,
  } = useWorkspace();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);

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
    const interval = timeRange === "24h" ? "1h" : "1d";

    Promise.all([
      fetchMetricsSummary({ env_id: environmentId, ...bounds }),
      fetchMetricsTimeseries({
        env_id: environmentId,
        metric: "payments.total",
        interval,
        ...bounds,
      }),
      fetchRecentPayments(environmentId),
    ])
      .then(([summary, volume, payments]) => {
        if (!active) return;
        setData({
          summary: summary.data,
          series: volume.data,
          payments,
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
  }, [environmentId, revision, session, timeRange]);

  const distribution = useMemo(() => {
    const decisions = data?.summary.decisions;
    return {
      approved: decisions?.approved ?? 0,
      needsReview: decisions?.needs_review ?? 0,
      rejected: decisions?.rejected ?? 0,
    };
  }, [data]);

  const metrics = useMemo(() => {
    if (!data) return [];
    const { summary } = data;
    return [
      { label: "Payment attempts", value: summary.payment_total.toLocaleString() },
      { label: "Approved decisions", value: distribution.approved.toLocaleString() },
      { label: "Rejected decisions", value: distribution.rejected.toLocaleString() },
      { label: "Open human reviews", value: summary.open_reviews.toLocaleString() },
      { label: "Webhook deliveries", value: summary.webhook_deliveries.toLocaleString() },
      {
        label: "Webhook success",
        value:
          summary.webhook_success_rate == null
            ? "No deliveries"
            : `${(summary.webhook_success_rate * 100).toFixed(1)}%`,
      },
    ];
  }, [data, distribution]);
  const riskBuckets = useMemo(() => {
    if (!data) return [];
    const colors = [
      "var(--danger)",
      "var(--warning)",
      "var(--accent)",
      "var(--success)",
      "var(--accent-dark)",
      "var(--text-secondary)",
    ];
    return Object.entries(data.summary.risk_flags)
      .filter(([, count]) => count > 0)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 6)
      .map(([flag, value], index) => ({
        label: flag.replaceAll("_", " "),
        value,
        color: colors[index % colors.length],
      }));
  }, [data]);

  const rangeLabel =
    TIME_RANGE_OPTIONS.find((option) => option.value === timeRange)?.label ?? timeRange;
  const retry = () => {
    refreshWorkspace();
    setRevision((value) => value + 1);
  };

  return (
    <section data-screen-label="Overview Dashboard">
      <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-[8px]">
        <div>
          <h1 className="page-title">Overview</h1>
          <div className="mt-[4px] text-[12px] text-[var(--muted-foreground)]">
            {selectedEnvironment
              ? `${selectedEnvironment.name} · ${rangeLabel}`
              : rangeLabel}
          </div>
        </div>
        {data ? (
          <span className="mono text-[11.5px] text-[var(--muted-foreground)]">
            Updated {formatDateTime(data.updatedAt)}
          </span>
        ) : null}
      </div>

      <AsyncBoundary
        empty={
          session?.mode === "demo" ||
          (!workspaceLoading && !workspaceError && !environmentId)
        }
        emptyTitle={session?.mode === "demo" ? "Demo mode has no live metrics" : "No environment selected"}
        emptyBody={
          session?.mode === "demo"
            ? "Sign out and connect a backend to load real payment metrics."
            : "Create an environment in the backend, then refresh the workspace."
        }
        error={workspaceError ?? error}
        loading={workspaceLoading || loading}
        loadingLabel="Loading overview metrics"
        onRetry={retry}
      >
        {data ? (
          <>
            <div className="mb-[20px] grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[12px]">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>

            <div className="responsive-stack mb-[16px] grid grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-[16px]">
              <GlassPanel className="p-[18px]">
                <div className="panel-title">
                  Payment volume over time{" "}
                  <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
                    ({rangeLabel.toLowerCase()})
                  </span>
                </div>
                <PaymentVolumeChart points={data.series} />
              </GlassPanel>
              <GlassPanel className="p-[18px]">
                <div className="panel-title">Decision distribution</div>
                <DecisionDonut distribution={distribution} />
              </GlassPanel>
            </div>

            <GlassPanel className="mb-[16px] p-[18px]">
              <div className="panel-title mb-[2px]">Decision risk flags</div>
              <p className="mb-[2px] mt-0 text-[11.5px] text-[var(--muted-foreground)]">
                Live counts of the risk flags recorded on decisions in this time range.
              </p>
              {riskBuckets.length ? (
                <RiskDistributionBars buckets={riskBuckets} />
              ) : (
                <div className="flex h-[220px] items-center justify-center text-[12.5px] text-[var(--muted-foreground)]">
                  No decision risk flags were recorded in this range.
                </div>
              )}
            </GlassPanel>

            <GlassPanel className="min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-[10px] p-[18px_18px_6px]">
                <div className="panel-title mb-0">Latest payments</div>
                <StatusBadge>{data.payments.length} shown</StatusBadge>
              </div>
              {data.payments.length ? (
                <GridTable
                  columns={recentColumns}
                  headers={["Payment ID", "Created", "Agent", "Merchant", "Amount", "State"]}
                  minWidth={760}
                >
                  {data.payments.map((payment) => (
                    <GridRow
                      columns={recentColumns}
                      key={payment.id}
                      onClick={() => navigate(`/payments/${payment.id}`)}
                    >
                      <GridCell className="mono whitespace-nowrap font-medium text-[var(--accent-dark)]">
                        {payment.id}
                      </GridCell>
                      <GridCell className="whitespace-nowrap text-[12px] text-[var(--muted-foreground)]">
                        {formatDateTime(payment.created_at_ms)}
                      </GridCell>
                      <GridCell className="mono truncate text-[12px]">{payment.agent_id}</GridCell>
                      <GridCell className="truncate">{payment.merchant}</GridCell>
                      <GridCell className="whitespace-nowrap text-[13px] font-semibold">
                        {formatAmount(payment)}
                      </GridCell>
                      <GridCell><DecisionBadge decision={payment.state} /></GridCell>
                    </GridRow>
                  ))}
                </GridTable>
              ) : (
                <div className="p-[28px] text-center text-[12.5px] text-[var(--muted-foreground)]">
                  No payments have been created in this environment.
                </div>
              )}
            </GlassPanel>
          </>
        ) : null}
      </AsyncBoundary>
    </section>
  );
}

async function fetchRecentPayments(environmentId: string): Promise<Payment[]> {
  const page = await fetchPayments({
    env_id: environmentId,
    sort: "created_desc",
    limit: 8,
    offset: 0,
  });
  return page.data;
}
