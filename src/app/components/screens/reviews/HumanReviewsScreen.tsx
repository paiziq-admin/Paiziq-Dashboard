import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import { ApiError } from "../../../api/client";
import {
  FALLBACK_REVIEW_SLA_MS,
  approveReview,
  claimReview,
  declineReview,
  escalateReview,
  fallbackReviewCapabilities,
  fetchReview,
  fetchReviewDecision,
  fetchReviewIdentity,
  fetchReviewQueue,
  reassignReview,
  releaseReview,
  requestMoreInfo,
  resolveFallbackPayment,
  type ReviewCapabilities,
  type ReviewIdentity,
  type ReviewPriority,
  type ReviewQueueItem,
} from "../../../api/reviews";
import type { Decision } from "../../../api/types";
import { useSession, useWorkspace } from "../../../context/DashboardContext";
import {
  ActionButton,
  EmptyState,
  FilterBar,
  GlassPanel,
  GridCell,
  GridRow,
  GridTable,
  StatusBadge,
  StatusDot,
} from "../../primitives";

const columns = "50px minmax(142px,1.1fr) minmax(120px,1fr) 106px minmax(118px,1fr) 112px minmax(104px,0.9fr)";
const MAX_NOTE_LENGTH = 2_000;
const REVIEWER_STORAGE_KEY = "paiziq.dashboard.reviewer-id";

type SlaFilter = "all" | "breached" | "urgent" | "healthy";
type OwnerFilter = "all" | "mine" | "unassigned";
type QueueSort = "priority" | "sla" | "newest" | "amount";
type WorkflowAction =
  | "claim"
  | "release"
  | "reassign"
  | "request_info"
  | "escalate"
  | "approve"
  | "decline";

interface ScreenError {
  status: number;
  message: string;
}

interface SlaState {
  rank: number;
  tone: "danger" | "warning" | "success" | "neutral";
  label: string;
  breached: boolean;
  urgent: boolean;
}

interface Feedback {
  tone: "success" | "danger";
  text: string;
}

export function HumanReviewsScreen() {
  const { session } = useSession();
  const {
    environmentId,
    selectedEnvironment,
    loading: workspaceLoading,
    error: workspaceError,
    refreshWorkspace,
  } = useWorkspace();
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [capabilities, setCapabilities] = useState<ReviewCapabilities>(
    fallbackReviewCapabilities,
  );
  const [identity, setIdentity] = useState<ReviewIdentity | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<ScreenError | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [slaFilter, setSlaFilter] = useState<SlaFilter>("all");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<ReviewPriority | "all">("all");
  const [sort, setSort] = useState<QueueSort>("priority");
  const [reviewerId, setReviewerId] = useState(readStoredReviewerId);
  const [reviewerError, setReviewerError] = useState<string | null>(null);
  const [targetReviewerId, setTargetReviewerId] = useState("");
  const [targetReviewerError, setTargetReviewerError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [escalationPriority, setEscalationPriority] = useState<"high" | "urgent">("urgent");
  const [action, setAction] = useState<WorkflowAction | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const loadQueue = useCallback(async () => {
    if (session?.mode !== "live" || workspaceLoading) {
      setLoading(workspaceLoading);
      return;
    }
    if (workspaceError || !environmentId) {
      setLoading(false);
      setQueue([]);
      setTotal(0);
      setSelectedId("");
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const [response, identityResult] = await Promise.all([
        fetchReviewQueue({
          state: "open",
          envId: environmentId,
          limit: 200,
        }),
        fetchReviewIdentity().catch((cause) => {
          if (cause instanceof ApiError && cause.status === 404) return null;
          throw cause;
        }),
      ]);
      setCapabilities(response.capabilities);
      const nextIdentity = identityResult?.data ?? null;
      setIdentity(nextIdentity);
      if (nextIdentity?.managed_identity && nextIdentity.reviewer_id) {
        setReviewerId(nextIdentity.reviewer_id);
        persistReviewerId(nextIdentity.reviewer_id);
      }
      setQueue(response.data);
      setTotal(response.meta?.total ?? response.data.length);
      setSelectedId((current) =>
        current && response.data.some((item) => item.id === current)
          ? current
          : (response.data[0]?.id ?? ""),
      );
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      setError({
        status: apiError?.status ?? 0,
        message: apiError?.message ?? "The review queue could not be loaded.",
      });
      setQueue([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [environmentId, session?.mode, workspaceError, workspaceLoading]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleQueue = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const actor = reviewerId.trim();
    return queue
      .filter((item) => {
        const sla = getSlaState(item, now);
        if (slaFilter === "breached" && !sla.breached) return false;
        if (slaFilter === "urgent" && (!sla.urgent || sla.breached)) return false;
        if (slaFilter === "healthy" && (sla.breached || sla.urgent)) return false;
        if (ownerFilter === "mine" && item.reviewer_id !== actor) return false;
        if (ownerFilter === "unassigned" && item.reviewer_id !== null) return false;
        if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
        if (!needle) return true;
        const payment = item.payment;
        return [
          item.id,
          payment.id,
          payment.merchant,
          payment.principal_id,
          payment.agent_id,
          item.reviewer_id ?? "",
        ].some((value) => value.toLowerCase().includes(needle));
      })
      .sort((left, right) => compareReviews(left, right, sort, now));
  }, [
    now,
    ownerFilter,
    priorityFilter,
    queue,
    reviewerId,
    search,
    slaFilter,
    sort,
  ]);

  const selected =
    visibleQueue.find((item) => item.id === selectedId) ?? visibleQueue[0] ?? null;

  useEffect(() => {
    const nextId = selected?.id ?? "";
    if (nextId !== selectedId) setSelectedId(nextId);
  }, [selected?.id, selectedId]);

  useEffect(() => {
    let active = true;
    setSelectedDecision(null);
    setDetailError(null);
    setTargetReviewerId("");
    setTargetReviewerError(null);
    setNote("");
    setNoteError(null);

    if (!selected) {
      setDetailLoading(false);
      return () => {
        active = false;
      };
    }

    setDetailLoading(true);
    const detailRequest =
      selected.source === "reviews_api" ? fetchReview(selected.id) : Promise.resolve(selected);
    void Promise.all([detailRequest, fetchReviewDecision(selected)])
      .then(([detail, decision]) => {
        if (!active) return;
        setQueue((items) => items.map((item) => (item.id === detail.id ? detail : item)));
        setSelectedDecision(decision);
      })
      .catch((caught) => {
        if (!active) return;
        setDetailError(
          caught instanceof ApiError
            ? caught.message
            : "Review details could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
    // Key by the visible selection so filtering cannot leave an actionable,
    // filtered-out review in the detail panel.
  }, [selected?.id, selected?.source]);

  const breachedCount = useMemo(
    () => queue.filter((item) => getSlaState(item, now).breached).length,
    [now, queue],
  );

  const setActor = (value: string) => {
    setReviewerId(value);
    setReviewerError(null);
    persistReviewerId(value);
  };

  const validateNote = () => {
    const cleanNote = note.trim();
    if (!cleanNote) {
      setNoteError("Add an action note before continuing.");
      return null;
    }
    if (cleanNote.length > MAX_NOTE_LENGTH) {
      setNoteError(`Notes cannot exceed ${MAX_NOTE_LENGTH.toLocaleString()} characters.`);
      return null;
    }
    setNoteError(null);
    return cleanNote;
  };

  const validateActor = () => {
    const actor = reviewerId.trim();
    if (!actor) {
      setReviewerError("Enter your reviewer ID before taking this action.");
      return null;
    }
    setReviewerError(null);
    return actor;
  };

  const runWorkflow = async (kind: WorkflowAction) => {
    if (!selected || action) return;
    if (
      selected.source === "reviews_api" &&
      identity &&
      identity.role !== "admin" &&
      identity.role !== "reviewer"
    ) {
      setFeedback({
        tone: "danger",
        text: "Review actions require an authenticated reviewer or admin key.",
      });
      return;
    }
    const needsNote = ["reassign", "request_info", "escalate", "approve", "decline"].includes(kind);
    const actorNeeded =
      selected.source === "reviews_api" &&
      ["claim", "release", "request_info", "escalate", "approve", "decline"].includes(kind);
    const cleanNote = needsNote ? validateNote() : note.trim();
    if (needsNote && !cleanNote) return;
    const actor = actorNeeded ? validateActor() : reviewerId.trim();
    if (actorNeeded && !actor) return;

    let target = "";
    if (kind === "reassign") {
      target = targetReviewerId.trim();
      if (!target) {
        setTargetReviewerError("Enter the reviewer who should own this item.");
        return;
      }
      setTargetReviewerError(null);
    }

    setFeedback(null);
    setAction(kind);
    try {
      let updated: ReviewQueueItem | null = null;
      if (selected.source === "payment_fallback") {
        if (kind !== "approve" && kind !== "decline") {
          throw new Error("This action is unavailable in payment fallback mode.");
        }
        await resolveFallbackPayment(
          selected.payment_id,
          kind === "approve" ? "approved" : "rejected",
          cleanNote!,
        );
      } else {
        const result =
          kind === "claim"
            ? await claimReview(selected.id, actor!)
            : kind === "release"
              ? await releaseReview(selected.id, actor!, cleanNote || undefined)
              : kind === "reassign"
                ? await reassignReview(selected.id, target, cleanNote!)
                : kind === "request_info"
                  ? await requestMoreInfo(selected.id, actor!, cleanNote!)
                  : kind === "escalate"
                    ? await escalateReview(selected.id, actor!, cleanNote!, escalationPriority)
                    : kind === "approve"
                      ? await approveReview(selected.id, actor!, cleanNote!)
                      : await declineReview(selected.id, actor!, cleanNote!);
        updated = result.data;
      }

      if (kind === "approve" || kind === "decline") {
        const remaining = queue.filter((item) => item.id !== selected.id);
        setQueue(remaining);
        setTotal((value) => Math.max(0, value - 1));
        setSelectedId(remaining[0]?.id ?? "");
      } else if (updated) {
        setQueue((items) => items.map((item) => (item.id === updated!.id ? updated! : item)));
      }

      setNote("");
      setTargetReviewerId("");
      setFeedback({
        tone: "success",
        text: successMessage(kind, selected.payment.id, updated?.reviewer_id ?? target),
      });
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null;
      const text =
        apiError?.status === 403
          ? selected.source === "reviews_api"
            ? "Permission denied. Review workflow actions require a reviewer or admin key."
            : "Permission denied. The compatibility transition requires a developer or admin key."
          : apiError?.status === 409
            ? `${apiError.message} Refresh the queue before trying again.`
            : (apiError?.message ??
              (caught instanceof Error ? caught.message : "The review action could not be saved."));
      setFeedback({ tone: "danger", text });
    } finally {
      setAction(null);
    }
  };

  if (session?.mode === "demo") {
    return (
      <section data-screen-label="Human Review Queue">
        <ScreenHeader countLabel="Live connection required" breached={0} onRefresh={loadQueue} />
        <GlassPanel>
          <EmptyState
            icon={<ShieldAlert size={22} />}
            title="Reviews require a live backend"
            body="Sign out of demo mode and connect to a Paiziq backend to operate the human review queue."
          />
        </GlassPanel>
      </section>
    );
  }

  if (loading || workspaceLoading) {
    return (
      <section aria-busy="true" data-screen-label="Human Review Queue">
        <ScreenHeader countLabel="Loading pending reviews…" breached={0} onRefresh={loadQueue} refreshing />
        <GlassPanel className="p-[54px_20px] text-center">
          <span className="status-spinner mb-[12px]" />
          <div className="text-[13px] font-bold">Loading review queue</div>
          <div className="mt-[4px] text-[12px] text-[var(--muted-foreground)]">
            Reading open reviews for the selected environment.
          </div>
        </GlassPanel>
      </section>
    );
  }

  if (workspaceError) {
    const forbidden = workspaceError.status === 403;
    return (
      <section data-screen-label="Human Review Queue">
        <ScreenHeader
          breached={0}
          countLabel="Workspace unavailable"
          onRefresh={refreshWorkspace}
        />
        <GlassPanel>
          <EmptyState
            action="Reload workspace"
            body={
              forbidden
                ? "This API key cannot load the organizations and environments required to scope the review queue."
                : workspaceError.message
            }
            icon={forbidden ? <LockKeyhole size={22} /> : <ShieldAlert size={22} />}
            onAction={refreshWorkspace}
            title={forbidden ? "Permission denied" : "Workspace unavailable"}
          />
        </GlassPanel>
      </section>
    );
  }

  if (!environmentId) {
    return (
      <section data-screen-label="Human Review Queue">
        <ScreenHeader countLabel="Environment required" breached={0} onRefresh={refreshWorkspace} />
        <GlassPanel>
          <EmptyState
            action="Reload workspace"
            body="Select an environment before loading human reviews. The dashboard never falls back to a cross-environment queue."
            icon={<ShieldAlert size={22} />}
            onAction={refreshWorkspace}
            title="No environment selected"
          />
        </GlassPanel>
      </section>
    );
  }

  if (error) {
    const forbidden = error.status === 403;
    return (
      <section data-screen-label="Human Review Queue">
        <ScreenHeader countLabel="Queue unavailable" breached={0} onRefresh={loadQueue} />
        <GlassPanel>
          <EmptyState
            action="Try again"
            body={
              forbidden
                ? "This API key cannot read reviews. Use a key with read, reviewer, or admin access."
                : error.message
            }
            icon={forbidden ? <LockKeyhole size={22} /> : <ShieldAlert size={22} />}
            onAction={loadQueue}
            title={forbidden ? "Permission denied" : "Review queue unavailable"}
          />
        </GlassPanel>
      </section>
    );
  }

  return (
    <section data-screen-label="Human Review Queue">
      <ScreenHeader
        countLabel={`${total} open${selectedEnvironment ? ` · ${selectedEnvironment.name}` : ""}${total > queue.length ? ` · first ${queue.length} loaded` : ""}`}
        breached={breachedCount}
        onRefresh={loadQueue}
      />

      {capabilities.source === "payment_fallback" ? (
        <GlassPanel className="mb-[12px] border-[rgba(217,151,59,0.34)] bg-[rgba(217,151,59,0.08)] p-[11px_14px]">
          <div className="flex items-start gap-[9px] text-[12.5px]">
            <AlertTriangle className="mt-[1px] shrink-0 text-[var(--warning-text)]" size={16} />
            <div>
              <b>Older backend compatibility mode.</b>{" "}
              Queue and approve/decline are live through payment endpoints. Assignment, request-info,
              and escalation are unavailable; SLA is estimated from the {formatHours(FALLBACK_REVIEW_SLA_MS)} default.
            </div>
          </div>
        </GlassPanel>
      ) : null}

      {feedback ? <FeedbackNotice feedback={feedback} /> : null}

      {queue.length === 0 ? (
        <GlassPanel>
          <EmptyState
            action="Refresh queue"
            body="No open human reviews exist in the selected environment."
            icon={<CheckCircle2 size={22} />}
            onAction={loadQueue}
            title="Review queue is clear"
          />
        </GlassPanel>
      ) : (
        <>
          <GlassPanel className="mb-[12px] p-[10px_12px]">
            <label className="flex flex-wrap items-center gap-[8px] text-[12px] font-bold" htmlFor="acting-reviewer">
              <UserRound size={14} />
              Acting reviewer
              <input
                aria-invalid={Boolean(reviewerError)}
                className="control-sm min-w-[190px] flex-1"
                id="acting-reviewer"
                onChange={(event) => setActor(event.target.value)}
                placeholder="Exact API key name"
                readOnly={Boolean(identity?.managed_identity)}
                value={reviewerId}
              />
              <span className="font-normal text-[var(--muted-foreground)]">
                {identity?.managed_identity
                  ? identity.role === "admin" || identity.role === "reviewer"
                    ? `Authenticated ${identity.role} key · identity locked to its API key name`
                    : `Authenticated ${identity.role} key · review actions require a reviewer or admin key`
                  : identity?.role === "admin"
                    ? "Bootstrap admin · enter the acting reviewer label"
                    : "Reviewer keys must use their exact API key name"}
              </span>
            </label>
            {reviewerError ? (
              <div className="mt-[6px] text-[11.5px] font-semibold text-[var(--danger-text)]" role="alert">
                {reviewerError}
              </div>
            ) : null}
          </GlassPanel>

          <FilterBar className="mb-[12px]">
            <input
              aria-label="Search review queue"
              className="control-sm min-w-[185px] flex-1"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search review, payment, merchant, user"
              value={search}
            />
            <select
              aria-label="SLA status"
              className="control-sm"
              onChange={(event) => setSlaFilter(event.target.value as SlaFilter)}
              value={slaFilter}
            >
              <option value="all">All SLA states</option>
              <option value="breached">SLA breached</option>
              <option value="urgent">Due within 4h</option>
              <option value="healthy">More than 4h</option>
            </select>
            <select
              aria-label="Owner"
              className="control-sm"
              disabled={!capabilities.assignment}
              onChange={(event) => setOwnerFilter(event.target.value as OwnerFilter)}
              value={ownerFilter}
            >
              <option value="all">All owners</option>
              <option value="mine">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <select
              aria-label="Priority"
              className="control-sm"
              onChange={(event) => setPriorityFilter(event.target.value as ReviewPriority | "all")}
              value={priorityFilter}
            >
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            <select
              aria-label="Queue sort"
              className="control-sm"
              onChange={(event) => setSort(event.target.value as QueueSort)}
              value={sort}
            >
              <option value="priority">Priority + SLA</option>
              <option value="sla">SLA deadline</option>
              <option value="newest">Newest first</option>
              <option value="amount">Highest amount</option>
            </select>
          </FilterBar>

          {visibleQueue.length === 0 ? (
            <GlassPanel>
              <EmptyState
                action="Clear filters"
                body="Clear the search, ownership, priority, and SLA filters to see the full queue."
                onAction={() => {
                  setSearch("");
                  setSlaFilter("all");
                  setOwnerFilter("all");
                  setPriorityFilter("all");
                }}
                title="No reviews match these filters"
              />
            </GlassPanel>
          ) : (
            <div className="responsive-stack grid grid-cols-[minmax(0,1.65fr)_minmax(330px,1fr)] items-start gap-[16px]">
              <GlassPanel className="min-w-0 overflow-hidden">
                <GridTable
                  columns={columns}
                  headers={["Pri", "Review / Payment", "Merchant", "Amount", "User", "SLA", "Owner"]}
                  minWidth={830}
                >
                  {visibleQueue.map((item) => {
                    const payment = item.payment;
                    const sla = getSlaState(item, now);
                    return (
                      <GridRow
                        columns={columns}
                        key={item.id}
                        onClick={() => {
                          setFeedback(null);
                          setSelectedId(item.id);
                        }}
                        selected={selectedId === item.id}
                      >
                        <GridCell>
                          <PriorityIndicator priority={item.priority} />
                        </GridCell>
                        <GridCell>
                          <div className="mono truncate whitespace-nowrap font-semibold">{item.id}</div>
                          <div className="mono truncate text-[10.5px] text-[var(--muted-foreground)]">{payment.id}</div>
                        </GridCell>
                        <GridCell className="truncate" title={payment.merchant}>{payment.merchant}</GridCell>
                        <GridCell className="whitespace-nowrap text-right font-bold">
                          {formatCurrency(payment.amount, payment.currency)}
                        </GridCell>
                        <GridCell className="mono truncate text-[12px]" title={payment.principal_id}>
                          {payment.principal_id}
                        </GridCell>
                        <GridCell>
                          <SlaBadge estimated={item.sla_estimated} sla={sla} />
                        </GridCell>
                        <GridCell className="truncate" title={item.reviewer_id ?? "Unassigned"}>
                          {item.reviewer_id ?? <span className="text-[var(--muted-foreground)]">Unassigned</span>}
                        </GridCell>
                      </GridRow>
                    );
                  })}
                </GridTable>
              </GlassPanel>

              <ReviewDetails
                action={action}
                capabilities={capabilities}
                decision={selectedDecision}
                detailError={detailError}
                detailLoading={detailLoading}
                escalationPriority={escalationPriority}
                identityRole={identity?.role ?? null}
                item={selected}
                note={note}
                noteError={noteError}
                now={now}
                onEscalationPriorityChange={setEscalationPriority}
                onNoteChange={(value) => {
                  setNote(value);
                  if (noteError && value.trim()) setNoteError(null);
                }}
                onRun={runWorkflow}
                onTargetReviewerChange={(value) => {
                  setTargetReviewerId(value);
                  if (targetReviewerError && value.trim()) setTargetReviewerError(null);
                }}
                reviewerId={reviewerId}
                targetReviewerError={targetReviewerError}
                targetReviewerId={targetReviewerId}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ScreenHeader({
  countLabel,
  breached,
  onRefresh,
  refreshing = false,
}: {
  countLabel: string;
  breached: number;
  onRefresh: () => void | Promise<void>;
  refreshing?: boolean;
}) {
  return (
    <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[10px]">
      <div>
        <h1 className="page-title">Human Review Queue</h1>
        <div className="mt-[4px] text-[12px] text-[var(--muted-foreground)]">
          {countLabel}
          {breached > 0 ? (
            <span className="ml-[8px] font-bold text-[var(--danger-text)]">
              · {breached} SLA {breached === 1 ? "breach" : "breaches"}
            </span>
          ) : null}
        </div>
      </div>
      <ActionButton disabled={refreshing} onClick={() => void onRefresh()} type="button">
        <RefreshCw className={refreshing ? "animate-spin" : ""} size={14} />
        <span className="ml-[6px]">Refresh</span>
      </ActionButton>
    </div>
  );
}

function ReviewDetails({
  item,
  capabilities,
  decision,
  detailLoading,
  detailError,
  reviewerId,
  targetReviewerId,
  targetReviewerError,
  note,
  noteError,
  escalationPriority,
  identityRole,
  action,
  now,
  onTargetReviewerChange,
  onNoteChange,
  onEscalationPriorityChange,
  onRun,
}: {
  item: ReviewQueueItem | null;
  capabilities: ReviewCapabilities;
  decision: Decision | null;
  detailLoading: boolean;
  detailError: string | null;
  reviewerId: string;
  targetReviewerId: string;
  targetReviewerError: string | null;
  note: string;
  noteError: string | null;
  escalationPriority: "high" | "urgent";
  identityRole: ReviewIdentity["role"] | null;
  action: WorkflowAction | null;
  now: number;
  onTargetReviewerChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onEscalationPriorityChange: (value: "high" | "urgent") => void;
  onRun: (action: WorkflowAction) => void | Promise<void>;
}) {
  if (!item) {
    return (
      <GlassPanel className="p-[20px]" variant="strong">
        <EmptyState title="Select a review" body="Choose a queue item to inspect and act on it." />
      </GlassPanel>
    );
  }

  const payment = item.payment;
  const sla = getSlaState(item, now);
  const noteTooLong = note.trim().length > MAX_NOTE_LENGTH;
  const busy = Boolean(action);
  const roleCanReview =
    identityRole === null || identityRole === "admin" || identityRole === "reviewer";
  const ownedByActor = Boolean(reviewerId.trim()) && item.reviewer_id === reviewerId.trim();
  const actorCanMutate =
    roleCanReview && (item.reviewer_id === null || ownedByActor);
  const canReassign =
    capabilities.assignment &&
    roleCanReview &&
    (identityRole === "admin" || ownedByActor);
  const claimDisabled =
    busy || !capabilities.assignment || !roleCanReview || item.reviewer_id !== null;
  const releaseDisabled =
    busy || !capabilities.assignment || !roleCanReview || !ownedByActor;
  const canResolve = item.source === "payment_fallback" || actorCanMutate;
  const ownershipTitle =
    item.reviewer_id && !ownedByActor
      ? "This review is assigned to another reviewer"
      : undefined;

  return (
    <GlassPanel className="min-w-0 p-[20px] lg:sticky lg:top-[12px]" variant="strong">
      <div className="mb-[14px] flex flex-wrap items-center justify-between gap-[8px]">
        <div>
          <div className="text-[15px] font-extrabold">Review Details</div>
          <div className="mono mt-[2px] text-[11.5px] text-[var(--muted-foreground)]">{item.id}</div>
        </div>
        <SlaBadge estimated={item.sla_estimated} sla={sla} />
      </div>

      {detailError ? (
        <div className="mb-[12px] rounded-[9px] bg-[rgba(192,91,71,0.10)] p-[9px_11px] text-[12px] text-[var(--danger-text)]" role="alert">
          {detailError}
        </div>
      ) : null}

      <SectionLabel>Queue status</SectionLabel>
      <dl className="mb-[14px] grid grid-cols-[minmax(92px,auto)_minmax(0,1fr)] gap-x-[16px] gap-y-[8px] text-[12.5px]">
        <DetailTerm>Priority</DetailTerm>
        <DetailValue><PriorityBadge priority={item.priority} /></DetailValue>
        <DetailTerm>Owner</DetailTerm>
        <DetailValue>{item.reviewer_id ?? "Unassigned"}</DetailValue>
        <DetailTerm>Last action</DetailTerm>
        <DetailValue>{humanize(item.last_action)}</DetailValue>
        <DetailTerm>Opened</DetailTerm>
        <DetailValue>{formatTimestamp(item.created_at_ms)}</DetailValue>
      </dl>

      <SectionLabel border>Payment summary</SectionLabel>
      <dl className="mb-[14px] grid grid-cols-[minmax(92px,auto)_minmax(0,1fr)] gap-x-[16px] gap-y-[8px] text-[12.5px]">
        <DetailTerm>Payment ID</DetailTerm>
        <DetailValue className="mono text-[12px]">{payment.id}</DetailValue>
        <DetailTerm>Amount</DetailTerm>
        <DetailValue className="text-[15px] font-extrabold">{formatCurrency(payment.amount, payment.currency)}</DetailValue>
        <DetailTerm>Merchant</DetailTerm>
        <DetailValue>{payment.merchant}</DetailValue>
        <DetailTerm>Principal</DetailTerm>
        <DetailValue className="mono text-[12px]">{payment.principal_id}</DetailValue>
        <DetailTerm>Agent</DetailTerm>
        <DetailValue className="mono text-[12px]">{payment.agent_id}</DetailValue>
      </dl>

      <SectionLabel border>Payment intent</SectionLabel>
      <div className="mb-[14px] rounded-[9px] bg-[rgba(86,66,86,0.06)] p-[10px_12px] text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
        {payment.intent_description || "No intent description was supplied."}
      </div>

      <SectionLabel border>Decision context</SectionLabel>
      {detailLoading ? (
        <div className="mb-[14px] flex items-center gap-[8px] text-[12px] text-[var(--muted-foreground)]">
          <span className="status-spinner" />
          Loading review and decision details…
        </div>
      ) : decision ? (
        <div className="mb-[14px]">
          <div className="mb-[8px] flex flex-wrap gap-[6px]">
            {decision.risk_flags.length ? (
              decision.risk_flags.map((flag) => (
                <StatusBadge key={flag} tone="warning">{humanize(flag)}</StatusBadge>
              ))
            ) : (
              <StatusBadge>No risk flags returned</StatusBadge>
            )}
          </div>
          <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
            {decision.reasons.map((reason) => (
              <li className="flex items-start gap-[8px] text-[12.5px]" key={reason}>
                <AlertTriangle className="mt-[2px] shrink-0 text-[var(--warning-text)]" size={13} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-[14px] text-[12px] text-[var(--muted-foreground)]">
          No needs-review decision context was returned.
        </div>
      )}

      <SectionLabel border>Assignment</SectionLabel>
      <div className="mb-[14px] rounded-[9px] border border-[rgba(86,66,86,0.12)] p-[10px_12px]">
        <div className="mb-[9px] flex items-center justify-between gap-[8px] text-[12.5px]">
          <span className="inline-flex min-w-0 items-center gap-[7px] font-semibold">
            <UserRound className="shrink-0" size={14} />
            <span className="truncate">{item.reviewer_id ?? "Unassigned"}</span>
          </span>
          <span className="text-[11px] text-[var(--muted-foreground)]">
            {item.assigned_at_ms ? `Since ${formatTimestamp(item.assigned_at_ms)}` : ""}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-[7px]">
          <ActionButton
            disabled={claimDisabled}
            onClick={() => void onRun("claim")}
            title={
              !capabilities.assignment
                ? "Unavailable on this backend"
                : !roleCanReview
                  ? "Review actions require a reviewer or admin key"
                  : undefined
            }
            type="button"
          >
            {action === "claim" ? "Claiming…" : "Claim"}
          </ActionButton>
          <ActionButton
            disabled={releaseDisabled}
            onClick={() => void onRun("release")}
            title={
              !roleCanReview
                ? "Review actions require a reviewer or admin key"
                : !ownedByActor && capabilities.assignment
                  ? "Only the current owner can release"
                  : undefined
            }
            type="button"
          >
            {action === "release" ? "Releasing…" : "Release"}
          </ActionButton>
        </div>
        <div className="mt-[8px] flex flex-wrap gap-[7px]">
          <input
            aria-label="New reviewer ID"
            aria-invalid={Boolean(targetReviewerError)}
            className="control-sm min-w-[150px] flex-1"
            disabled={!canReassign || busy}
            onChange={(event) => onTargetReviewerChange(event.target.value)}
            placeholder="New reviewer ID"
            value={targetReviewerId}
          />
          <ActionButton
            disabled={!canReassign || busy}
            onClick={() => void onRun("reassign")}
            title={
              !capabilities.assignment
                ? "Unavailable on this backend"
                : !canReassign
                  ? "Reviewer keys must own a review before reassigning it; admins may override ownership"
                  : undefined
            }
            type="button"
          >
            {action === "reassign" ? "Saving…" : "Reassign"}
          </ActionButton>
        </div>
        {targetReviewerError ? (
          <div className="mt-[6px] text-[11.5px] font-semibold text-[var(--danger-text)]" role="alert">
            {targetReviewerError}
          </div>
        ) : null}
        {!capabilities.assignment ? (
          <div className="mt-[7px] text-[11.5px] text-[var(--muted-foreground)]">
            Claim, release, and reassignment require the Reviews API.
          </div>
        ) : !roleCanReview ? (
          <div className="mt-[7px] text-[11.5px] text-[var(--muted-foreground)]">
            Assignment actions require an authenticated reviewer or admin key.
          </div>
        ) : !canReassign ? (
          <div className="mt-[7px] text-[11.5px] text-[var(--muted-foreground)]">
            Claim this review before reassigning it. Admin keys may reassign reviews owned by another reviewer.
          </div>
        ) : null}
      </div>

      <SectionLabel border>Action notes</SectionLabel>
      <label className="mb-[5px] block text-[12px] font-bold" htmlFor="review-note">
        Reviewer notes <span className="text-[var(--danger)]">*</span>
      </label>
      <textarea
        aria-describedby={noteError ? "review-note-error" : "review-note-help"}
        aria-invalid={Boolean(noteError || noteTooLong)}
        className="control min-h-[88px] w-full resize-y p-[10px] text-[12.5px] font-normal"
        id="review-note"
        maxLength={MAX_NOTE_LENGTH + 1}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="Explain the evidence or next step…"
        value={note}
      />
      <div className="mb-[12px] mt-[4px] flex justify-between gap-[8px] text-[11.5px]">
        <span
          className={noteError || noteTooLong ? "font-semibold text-[var(--danger-text)]" : "text-[var(--muted-foreground)]"}
          id={noteError ? "review-note-error" : "review-note-help"}
          role={noteError ? "alert" : undefined}
        >
          {noteError ??
            (noteTooLong
              ? `Notes must be ${MAX_NOTE_LENGTH.toLocaleString()} characters or fewer.`
              : "Required for reassign, request info, escalate, approve, and decline.")}
        </span>
        <span className={noteTooLong ? "font-semibold text-[var(--danger-text)]" : "text-[var(--muted-foreground)]"}>
          {note.trim().length.toLocaleString()}/{MAX_NOTE_LENGTH.toLocaleString()}
        </span>
      </div>

      <div className="mb-[8px] grid grid-cols-2 gap-[8px]">
        <ActionButton
          disabled={!capabilities.requestMoreInfo || !actorCanMutate || busy}
          onClick={() => void onRun("request_info")}
          title={
            !capabilities.requestMoreInfo
              ? "Unavailable on this backend"
              : !roleCanReview
                ? "Review actions require a reviewer or admin key"
                : ownershipTitle
          }
          type="button"
        >
          {action === "request_info" ? "Requesting…" : "Request info"}
        </ActionButton>
        <div className="flex min-w-0 gap-[6px]">
          <select
            aria-label="Escalation priority"
            className="control-sm min-w-0 flex-1"
            disabled={!capabilities.escalation || !actorCanMutate || busy}
            onChange={(event) => onEscalationPriorityChange(event.target.value as "high" | "urgent")}
            value={escalationPriority}
          >
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <ActionButton
            className="px-[10px]"
            disabled={!capabilities.escalation || !actorCanMutate || busy}
            onClick={() => void onRun("escalate")}
            title={
              !capabilities.escalation
                ? "Unavailable on this backend"
                : !roleCanReview
                  ? "Review actions require a reviewer or admin key"
                  : ownershipTitle
            }
            type="button"
          >
            {action === "escalate" ? "Saving…" : "Escalate"}
          </ActionButton>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-[8px]">
        <ActionButton
          disabled={busy || !canResolve}
          onClick={() => void onRun("approve")}
          title={
            !roleCanReview && item.source === "reviews_api"
              ? "Review actions require a reviewer or admin key"
              : ownershipTitle
          }
          type="button"
          variant="approve"
        >
          {action === "approve" ? (
            <span className="status-spinner mr-[7px]" />
          ) : (
            <CheckCircle2 className="mr-[7px]" size={15} />
          )}
          Approve
        </ActionButton>
        <ActionButton
          disabled={busy || !canResolve}
          onClick={() => void onRun("decline")}
          title={
            !roleCanReview && item.source === "reviews_api"
              ? "Review actions require a reviewer or admin key"
              : ownershipTitle
          }
          type="button"
          variant="reject"
        >
          {action === "decline" ? (
            <span className="status-spinner mr-[7px]" />
          ) : (
            <XCircle className="mr-[7px]" size={15} />
          )}
          Decline
        </ActionButton>
      </div>
    </GlassPanel>
  );
}

function FeedbackNotice({ feedback }: { feedback: Feedback }) {
  return (
    <div
      aria-live="polite"
      className={`mb-[12px] rounded-[9px] p-[10px_12px] text-[12.5px] font-semibold ${
        feedback.tone === "success"
          ? "bg-[rgba(74,138,104,0.14)] text-[var(--success-text)]"
          : "bg-[rgba(192,91,71,0.12)] text-[var(--danger-text)]"
      }`}
      role={feedback.tone === "danger" ? "alert" : "status"}
    >
      {feedback.text}
    </div>
  );
}

function PriorityIndicator({ priority }: { priority: ReviewPriority }) {
  const tone = priority === "urgent" ? "danger" : priority === "high" ? "warning" : "neutral";
  return (
    <span className="inline-flex items-center gap-[6px]" title={`${humanize(priority)} priority`}>
      <StatusDot size={9} tone={tone} />
      <span className="sr-only">{humanize(priority)} priority</span>
    </span>
  );
}

function PriorityBadge({ priority }: { priority: ReviewPriority }) {
  const tone = priority === "urgent" ? "danger" : priority === "high" ? "warning" : "neutral";
  return <StatusBadge tone={tone}>{humanize(priority)}</StatusBadge>;
}

function SlaBadge({ sla, estimated }: { sla: SlaState; estimated: boolean }) {
  return (
    <StatusBadge
      title={estimated ? "Estimated from the backend default SLA" : "Authoritative review SLA"}
      tone={sla.tone}
    >
      <Clock3 className="mr-[5px]" size={12} />
      {estimated ? "~" : ""}{sla.label}
    </StatusBadge>
  );
}

function SectionLabel({ children, border = false }: { children: string; border?: boolean }) {
  return (
    <div className={`label-caps mb-[8px] ${border ? "mt-[12px] border-t border-[rgba(86,66,86,0.10)] pt-[12px]" : ""}`}>
      {children}
    </div>
  );
}

function DetailTerm({ children }: { children: string }) {
  return <dt className="text-[var(--muted-foreground)]">{children}</dt>;
}

function DetailValue({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <dd className={`m-0 min-w-0 break-words text-right ${className}`}>{children}</dd>;
}

function getSlaState(item: ReviewQueueItem, now: number): SlaState {
  const deadline = item.sla_deadline_ms;
  if (deadline === null) {
    return {
      rank: 4,
      tone: "neutral",
      label: "No deadline",
      breached: false,
      urgent: false,
    };
  }

  const remaining =
    item.sla_remaining_ms === null
      ? deadline - now
      : item.sla_remaining_ms - Math.max(0, now - item.sla_observed_at_ms);
  if (item.sla_breached || remaining <= 0) {
    return {
      rank: 0,
      tone: "danger",
      label: `${formatDuration(Math.abs(remaining))} overdue`,
      breached: true,
      urgent: true,
    };
  }
  if (remaining <= 60 * 60 * 1_000) {
    return {
      rank: 1,
      tone: "danger",
      label: `${formatDuration(remaining)} left`,
      breached: false,
      urgent: true,
    };
  }
  if (remaining <= 4 * 60 * 60 * 1_000) {
    return {
      rank: 2,
      tone: "warning",
      label: `${formatDuration(remaining)} left`,
      breached: false,
      urgent: true,
    };
  }
  return {
    rank: 3,
    tone: "success",
    label: `${formatDuration(remaining)} left`,
    breached: false,
    urgent: false,
  };
}

function compareReviews(
  left: ReviewQueueItem,
  right: ReviewQueueItem,
  sort: QueueSort,
  now: number,
): number {
  if (sort === "newest") return right.created_at_ms - left.created_at_ms;
  if (sort === "amount") return right.payment.amount - left.payment.amount;
  const slaDifference = getSlaState(left, now).rank - getSlaState(right, now).rank ||
    (left.sla_deadline_ms ?? Number.MAX_SAFE_INTEGER) -
      (right.sla_deadline_ms ?? Number.MAX_SAFE_INTEGER);
  if (sort === "sla") return slaDifference;
  return priorityRank(left.priority) - priorityRank(right.priority) ||
    slaDifference ||
    right.payment.amount - left.payment.amount;
}

function priorityRank(priority: ReviewPriority): number {
  return { urgent: 0, high: 1, normal: 2, low: 3 }[priority];
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function formatHours(milliseconds: number): string {
  return `${milliseconds / 3_600_000}h`;
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
}

function formatTimestamp(timestampMs: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestampMs));
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readStoredReviewerId(): string {
  try {
    return window.localStorage.getItem(REVIEWER_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function persistReviewerId(value: string) {
  try {
    window.localStorage.setItem(REVIEWER_STORAGE_KEY, value);
  } catch {
    // Storage is a convenience only; workflow actions still use state.
  }
}

function successMessage(
  action: WorkflowAction,
  paymentId: string,
  newOwner: string,
): string {
  const message: Record<WorkflowAction, string> = {
    claim: `${paymentId} claimed.`,
    release: `${paymentId} released back to the queue.`,
    reassign: `${paymentId} reassigned${newOwner ? ` to ${newOwner}` : ""}.`,
    request_info: `More information requested for ${paymentId}.`,
    escalate: `${paymentId} escalated.`,
    approve: `${paymentId} approved and removed from the queue.`,
    decline: `${paymentId} declined and removed from the queue.`,
  };
  return message[action];
}
