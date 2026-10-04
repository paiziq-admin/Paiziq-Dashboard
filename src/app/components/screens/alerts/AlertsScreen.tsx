import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, Webhook } from "lucide-react";
import {
  fetchNotificationFeed,
  fetchWebhookDeliveryPage,
  type WebhookDeliveryDetail,
} from "../../../api/admin";
import type { NotificationItem } from "../../../api/types";
import { useSession, useWorkspace } from "../../../context/DashboardContext";
import {
  CodeBlock,
  DrawerPanel,
  EmptyState,
  FilterBar,
  GlassPanel,
  StatusBadge,
  StatusDot,
} from "../../primitives";
import {
  CapabilityNotice,
  ErrorPanel,
  LoadingPanel,
  RefreshButton,
  errorMessage,
  formatTimestamp,
} from "../admin/AdminSupport";

type Tone = "danger" | "warning" | "neutral" | "success";
type FeedItem = {
  id: string;
  source: "notification" | "webhook";
  title: string;
  description: string;
  tone: Tone;
  label: string;
  timestamp: number | null;
  metadata: string;
  deliveryState?: WebhookDeliveryDetail["state"];
  raw: NotificationItem | WebhookDeliveryDetail;
};

export function AlertsScreen() {
  const { session } = useSession();
  const {
    environmentId,
    selectedEnvironment,
    loading: workspaceLoading,
    error: workspaceError,
    refreshWorkspace,
  } = useWorkspace();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryDetail[]>([]);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [notificationError, setNotificationError] = useState<unknown>(null);
  const [deliveryError, setDeliveryError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [source, setSource] = useState("all");
  const [state, setState] = useState("all");
  const [selected, setSelected] = useState<FeedItem | null>(null);

  useEffect(() => {
    if (
      session?.mode !== "live" ||
      workspaceLoading ||
      workspaceError ||
      !environmentId
    ) {
      setNotifications([]);
      setDeliveries([]);
      setDeliveryTotal(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotificationError(null);
    setDeliveryError(null);
    Promise.allSettled([
      fetchNotificationFeed(),
      fetchWebhookDeliveryPage({
        env_id: environmentId,
        limit: 200,
        offset: 0,
      }),
    ])
      .then(([notificationResult, deliveryResult]) => {
        if (cancelled) return;
        if (notificationResult.status === "fulfilled") {
          setNotifications(notificationResult.value.data.notifications);
        } else {
          setNotifications([]);
          setNotificationError(notificationResult.reason);
        }
        if (deliveryResult.status === "fulfilled") {
          setDeliveries(deliveryResult.value.data);
          setDeliveryTotal(deliveryResult.value.meta?.total ?? deliveryResult.value.data.length);
        } else {
          setDeliveries([]);
          setDeliveryTotal(0);
          setDeliveryError(deliveryResult.reason);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [environmentId, reload, session?.mode, workspaceError, workspaceLoading]);

  const feed = useMemo(() => {
    const items: FeedItem[] = [
      ...notifications.map(notificationToFeed),
      ...deliveries.map(deliveryToFeed),
    ];
    return items
      .filter((item) => source === "all" || item.source === source)
      .filter((item) => state === "all" || item.deliveryState === state)
      .sort((left, right) => (right.timestamp ?? -1) - (left.timestamp ?? -1));
  }, [deliveries, notifications, source, state]);

  const dead = deliveries.filter((delivery) => delivery.state === "dead").length;
  const pending = deliveries.filter((delivery) => delivery.state === "pending").length;
  const bothFailed = !!notificationError && !!deliveryError;

  if (session?.mode !== "live") {
    return (
      <AlertsFrame busy={false} onRefresh={() => undefined}>
        <GlassPanel>
          <EmptyState
            body="Connect a backend to read notifications and webhook delivery state."
            icon={<Bell size={22} />}
            title="Alerts require a live backend"
          />
        </GlassPanel>
      </AlertsFrame>
    );
  }
  if (workspaceLoading) {
    return (
      <AlertsFrame busy onRefresh={refreshWorkspace}>
        <LoadingPanel label="Loading alert workspace" />
      </AlertsFrame>
    );
  }
  if (workspaceError) {
    return (
      <AlertsFrame busy={false} onRefresh={refreshWorkspace}>
        <ErrorPanel error={workspaceError} onRetry={refreshWorkspace} />
      </AlertsFrame>
    );
  }
  if (!environmentId) {
    return (
      <AlertsFrame busy={false} onRefresh={refreshWorkspace}>
        <GlassPanel>
          <EmptyState
            body="Select or create an environment before loading delivery alerts."
            icon={<Bell size={22} />}
            title="No environment selected"
          />
        </GlassPanel>
      </AlertsFrame>
    );
  }

  return (
    <section data-screen-label="Alerts">
      <AlertsHeader
        busy={loading}
        environmentName={selectedEnvironment?.name}
        onRefresh={() => setReload((value) => value + 1)}
      />

      <div className="mb-[14px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[10px]">
        <Summary label="Notifications loaded" value={notifications.length} tone="neutral" />
        <Summary label="Deliveries loaded" value={deliveries.length} detail={deliveryTotal > deliveries.length ? `of ${deliveryTotal}` : undefined} tone="neutral" />
        <Summary label="Pending deliveries" value={pending} tone={pending ? "warning" : "success"} />
        <Summary label="Dead deliveries" value={dead} tone={dead ? "danger" : "success"} />
      </div>

      <CapabilityNotice title="Source scope">
        Notifications are the newest 100 returned by the legacy global ingest feed.
        Webhook deliveries are the newest 200 records for the selected environment.
      </CapabilityNotice>

      {notificationError ? (
        <SourceError label="Notification feed" error={notificationError} />
      ) : null}
      {deliveryError ? (
        <SourceError label="Webhook delivery feed" error={deliveryError} />
      ) : null}

      <FilterBar className="mt-[14px]">
        <select aria-label="Alert source" className="control-sm mobile-full" value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="all">All sources</option>
          <option value="notification">Notifications</option>
          <option value="webhook">Webhook deliveries</option>
        </select>
        <select aria-label="Webhook delivery state" className="control-sm mobile-full" value={state} onChange={(event) => setState(event.target.value)}>
          <option value="all">All delivery states</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
          <option value="dead">Dead</option>
        </select>
        <span className="text-[11.5px] text-[var(--muted-foreground)]">{feed.length} visible events</span>
      </FilterBar>

      <div className="flex max-w-[900px] flex-col gap-[10px]">
        {loading ? (
          <GlassPanel className="flex min-h-[220px] items-center justify-center gap-[8px] text-[12.5px] text-[var(--muted-foreground)]">
            <span className="status-spinner" /> Loading alerts and deliveries
          </GlassPanel>
        ) : feed.length ? (
          feed.map((item) => (
            <button
              className="focus-ring flex w-full items-start gap-[12px] rounded-[12px] border bg-[var(--glass-panel)] p-[14px_16px] text-left backdrop-blur-[16px] transition hover:bg-[var(--glass-panel-strong)]"
              key={item.id}
              style={{
                borderColor:
                  item.tone === "danger"
                    ? "rgba(192,91,71,0.35)"
                    : item.tone === "warning"
                      ? "rgba(217,151,59,0.35)"
                      : "var(--glass-border)",
                boxShadow:
                  item.tone === "danger"
                    ? "0 8px 24px rgba(192,91,71,0.10)"
                    : item.tone === "warning"
                      ? "0 8px 24px rgba(217,151,59,0.10)"
                      : "var(--shadow-panel)",
                color: "var(--foreground)",
              }}
              type="button"
              onClick={() => setSelected(item)}
            >
              <span className="mt-[5px]"><StatusDot pulse={item.tone === "danger"} size={8} tone={item.tone} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-[7px]">
                  <span className="text-[13.5px] font-bold">{item.title}</span>
                  <StatusBadge tone="neutral">{item.source === "notification" ? "Notification" : "Webhook"}</StatusBadge>
                </div>
                <div className="mt-[2px] text-[12.5px] text-[var(--text-secondary)]">{item.description}</div>
                <div className="mono mt-[5px] break-all text-[10.5px] text-[var(--muted-foreground)]">
                  {formatTimestamp(item.timestamp)} · {item.metadata}
                </div>
              </div>
              <StatusBadge tone={item.tone}>{item.label}</StatusBadge>
            </button>
          ))
        ) : (
          <GlassPanel>
            <EmptyState
              title={bothFailed ? "Alert sources unavailable" : "No matching alerts"}
              body={
                bothFailed
                  ? "Both backend feeds failed. Review the source errors above and retry."
                  : "No loaded notification or webhook delivery matches the selected filters."
              }
              icon={<Bell size={22} />}
              action={!bothFailed && (source !== "all" || state !== "all") ? "Clear filters" : undefined}
              onAction={
                !bothFailed
                  ? () => {
                      setSource("all");
                      setState("all");
                    }
                  : undefined
              }
            />
          </GlassPanel>
        )}
      </div>

      <DrawerPanel open={!!selected} title="Alert source record" onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <div className="mb-[14px] flex items-start gap-[10px]">
              <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(86,66,86,0.08)] text-[var(--primary)]">
                {selected.source === "webhook" ? <Webhook size={17} /> : <Bell size={17} />}
              </span>
              <div>
                <div className="text-[14px] font-bold">{selected.title}</div>
                <div className="mt-[2px] text-[12px] text-[var(--muted-foreground)]">{formatTimestamp(selected.timestamp)}</div>
              </div>
            </div>
            <div className="mb-[14px] text-[13px] text-[var(--text-secondary)]">{selected.description}</div>
            <div className="label-caps mb-[6px]">Backend record</div>
            <CodeBlock value={JSON.stringify(selected.raw, null, 2)} />
          </>
        ) : null}
      </DrawerPanel>
    </section>
  );
}

function AlertsFrame({
  busy,
  children,
  onRefresh,
}: {
  busy: boolean;
  children: ReactNode;
  onRefresh: () => void;
}) {
  return (
    <section data-screen-label="Alerts">
      <AlertsHeader busy={busy} onRefresh={onRefresh} />
      {children}
    </section>
  );
}

function AlertsHeader({
  busy,
  environmentName,
  onRefresh,
}: {
  busy: boolean;
  environmentName?: string;
  onRefresh: () => void;
}) {
  return (
    <div className="mobile-wrap mb-[16px] flex items-center justify-between gap-[12px]">
      <div>
        <h1 className="page-title">Alerts</h1>
        <div className="mt-[3px] text-[12px] text-[var(--muted-foreground)]">
          {environmentName ? `${environmentName} · ` : ""}
          Live notification ingestion and outbound webhook delivery state.
        </div>
      </div>
      <RefreshButton busy={busy} onClick={onRefresh} />
    </div>
  );
}

function Summary({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail?: string;
  tone: Tone;
}) {
  return (
    <GlassPanel className="p-[12px_14px]">
      <div className="label-caps mb-[5px]">{label}</div>
      <div className="flex items-baseline gap-[6px]">
        <span className="text-[22px] font-extrabold">{value}</span>
        {detail ? <span className="text-[11px] text-[var(--muted-foreground)]">{detail}</span> : null}
        <StatusDot tone={tone} />
      </div>
    </GlassPanel>
  );
}

function SourceError({ label, error }: { label: string; error: unknown }) {
  return (
    <div className="mt-[10px] rounded-[10px] border border-[rgba(217,151,59,0.25)] bg-[rgba(217,151,59,0.10)] p-[10px_12px] text-[12px] text-[var(--warning-text)]">
      <strong>{label} unavailable:</strong> {errorMessage(error)}
    </div>
  );
}

function notificationToFeed(item: NotificationItem, index: number): FeedItem {
  const severity = item.severity.toLowerCase();
  const tone: Tone =
    severity === "critical" || severity === "error"
      ? "danger"
      : severity === "warning" || severity === "warn"
        ? "warning"
        : "neutral";
  return {
    id: `notification-${item.created_at_ms ?? "unknown"}-${index}`,
    source: "notification",
    title: item.title,
    description: item.message,
    tone,
    label: item.severity || "Info",
    timestamp: item.created_at_ms,
    metadata: [
      item.request_id ? `request ${item.request_id}` : "no request ID",
      item.risk_flags.length ? `${item.risk_flags.length} risk flag(s)` : "no risk flags",
    ].join(" · "),
    raw: item,
  };
}

function deliveryToFeed(item: WebhookDeliveryDetail): FeedItem {
  const tone: Tone = item.state === "dead" ? "danger" : item.state === "pending" ? "warning" : "success";
  return {
    id: `webhook-${item.id}`,
    source: "webhook",
    title: `${item.event_type} delivery ${item.state}`,
    description:
      item.last_error ??
      (item.state === "delivered"
        ? "The webhook was delivered successfully."
        : "The delivery is queued for another attempt."),
    tone,
    label: item.state,
    timestamp: item.updated_at_ms,
    metadata: `${item.id} · endpoint ${item.endpoint_id} · ${item.attempts} attempt${item.attempts === 1 ? "" : "s"}`,
    deliveryState: item.state,
    raw: item,
  };
}
