// Human-review API adapter (PZ-055–PZ-059).
//
// New servers expose the complete `/v1/reviews` workflow. For compatibility
// with older Paiziq deployments, a 404 from the queue endpoint falls back to
// the documented `payments?state=needs_review` surface. Only approve/decline
// can mutate in fallback mode; the UI uses the returned capability flags to
// keep every unsupported action visibly disabled.

import { ApiError, apiFetch, type ApiResult } from "./client";
import type { Decision, Payment } from "./types";

export const FALLBACK_REVIEW_SLA_MS = 86_400_000;

export type ReviewSource = "reviews_api" | "payment_fallback";
export type ReviewState = "open" | "approved" | "rejected";
export type ReviewPriority = "low" | "normal" | "high" | "urgent";

export interface ReviewCapabilities {
  source: ReviewSource;
  authoritativeSla: boolean;
  assignment: boolean;
  requestMoreInfo: boolean;
  escalation: boolean;
  approveDecline: boolean;
}

export const nativeReviewCapabilities: ReviewCapabilities = {
  source: "reviews_api",
  authoritativeSla: true,
  assignment: true,
  requestMoreInfo: true,
  escalation: true,
  approveDecline: true,
};

export const fallbackReviewCapabilities: ReviewCapabilities = {
  source: "payment_fallback",
  authoritativeSla: false,
  assignment: false,
  requestMoreInfo: false,
  escalation: false,
  approveDecline: true,
};

export interface ReviewQueueItem {
  id: string;
  payment_id: string;
  decision_id: string | null;
  state: ReviewState;
  reviewer_id: string | null;
  note: string | null;
  created_at_ms: number;
  resolved_at_ms: number | null;
  sla_deadline_ms: number | null;
  priority: ReviewPriority;
  last_action: string;
  assigned_at_ms: number | null;
  updated_at_ms: number;
  sla_remaining_ms: number | null;
  sla_breached: boolean;
  sla_observed_at_ms: number;
  payment: Payment;
  source: ReviewSource;
  sla_estimated: boolean;
}

type NativeReview = Omit<
  ReviewQueueItem,
  "source" | "sla_estimated" | "sla_observed_at_ms"
>;

export interface ReviewQueueParams {
  state?: ReviewState;
  envId?: string;
  reviewerId?: string;
  priority?: ReviewPriority;
  limit?: number;
  offset?: number;
}

export interface ReviewQueueResult extends ApiResult<ReviewQueueItem[]> {
  capabilities: ReviewCapabilities;
}

export interface ReviewIdentity {
  reviewer_id: string | null;
  role: "admin" | "developer" | "reviewer" | "read_only";
  env_id: string | null;
  managed_identity: boolean;
}

function query(params: Record<string, string | number | undefined>): string {
  const values = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  return values.length
    ? `?${values.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&")}`
    : "";
}

function nativeItem(review: NativeReview): ReviewQueueItem {
  return {
    ...review,
    source: "reviews_api",
    sla_estimated: false,
    sla_observed_at_ms: Date.now(),
  };
}

async function fetchFallbackQueue(params: ReviewQueueParams): Promise<ReviewQueueResult> {
  const response = await apiFetch<Payment[]>(
    `/v1/payments${query({
      env_id: params.envId,
      state: "needs_review",
      limit: params.limit ?? 200,
      offset: params.offset ?? 0,
    })}`,
  );

  return {
    ...response,
    capabilities: fallbackReviewCapabilities,
    data: response.data.map((payment) => {
      const queueEnteredAtMs = payment.updated_at_ms || payment.created_at_ms;
      const slaDeadlineMs = queueEnteredAtMs + FALLBACK_REVIEW_SLA_MS;
      return {
        id: `fallback:${payment.id}`,
        payment_id: payment.id,
        decision_id: null,
        state: "open",
        reviewer_id: null,
        note: null,
        created_at_ms: queueEnteredAtMs,
        resolved_at_ms: null,
        sla_deadline_ms: slaDeadlineMs,
        priority: "normal",
        last_action: "opened",
        assigned_at_ms: null,
        updated_at_ms: queueEnteredAtMs,
        sla_remaining_ms: slaDeadlineMs - Date.now(),
        sla_breached: slaDeadlineMs <= Date.now(),
        sla_observed_at_ms: Date.now(),
        payment,
        source: "payment_fallback",
        sla_estimated: true,
      };
    }),
  };
}

export async function fetchReviewQueue(
  params: ReviewQueueParams = {},
): Promise<ReviewQueueResult> {
  try {
    const response = await apiFetch<NativeReview[]>(
      `/v1/reviews${query({
        state: params.state ?? "open",
        env_id: params.envId,
        reviewer_id: params.reviewerId,
        priority: params.priority,
        limit: params.limit ?? 200,
        offset: params.offset ?? 0,
      })}`,
    );
    return {
      ...response,
      capabilities: nativeReviewCapabilities,
      data: response.data.map(nativeItem),
    };
  } catch (cause) {
    if (!(cause instanceof ApiError) || cause.status !== 404) throw cause;
    return fetchFallbackQueue(params);
  }
}

export async function fetchReview(reviewId: string): Promise<ReviewQueueItem> {
  const response = await apiFetch<NativeReview>(`/v1/reviews/${encodeURIComponent(reviewId)}`);
  return nativeItem(response.data);
}

export function fetchReviewIdentity(): Promise<ApiResult<ReviewIdentity>> {
  return apiFetch<ReviewIdentity>("/v1/reviews/identity");
}

export async function fetchReviewDecision(review: ReviewQueueItem): Promise<Decision | null> {
  if (review.decision_id) {
    const response = await apiFetch<Decision>(
      `/v1/decisions/${encodeURIComponent(review.decision_id)}`,
    );
    return response.data;
  }

  const response = await apiFetch<Decision[]>(
    `/v1/decisions${query({ payment_id: review.payment_id, limit: 200, offset: 0 })}`,
  );
  return response.data
    .filter((decision) => decision.verdict === "needs_review")
    .reduce<Decision | null>(
      (latest, decision) =>
        latest === null || decision.created_at_ms > latest.created_at_ms ? decision : latest,
      null,
    );
}

function reviewAction<T>(
  reviewId: string,
  action: string,
  body: T,
): Promise<ApiResult<NativeReview>> {
  return apiFetch<NativeReview>(
    `/v1/reviews/${encodeURIComponent(reviewId)}/${action}`,
    { method: "POST", body },
  );
}

function nativeActionResult(result: ApiResult<NativeReview>): ApiResult<ReviewQueueItem> {
  return { ...result, data: nativeItem(result.data) };
}

export async function claimReview(
  reviewId: string,
  reviewerId: string,
): Promise<ApiResult<ReviewQueueItem>> {
  return nativeActionResult(
    await reviewAction(reviewId, "claim", { reviewer_id: reviewerId }),
  );
}

export async function releaseReview(
  reviewId: string,
  reviewerId: string,
  note?: string,
): Promise<ApiResult<ReviewQueueItem>> {
  return nativeActionResult(
    await reviewAction(reviewId, "release", {
      reviewer_id: reviewerId,
      ...(note ? { note } : {}),
    }),
  );
}

export async function reassignReview(
  reviewId: string,
  reviewerId: string,
  note: string,
): Promise<ApiResult<ReviewQueueItem>> {
  return nativeActionResult(
    await reviewAction(reviewId, "reassign", {
      reviewer_id: reviewerId,
      note,
    }),
  );
}

export async function requestMoreInfo(
  reviewId: string,
  reviewerId: string,
  note: string,
): Promise<ApiResult<ReviewQueueItem>> {
  return nativeActionResult(
    await reviewAction(reviewId, "request-more-info", {
      reviewer_id: reviewerId,
      note,
    }),
  );
}

export async function escalateReview(
  reviewId: string,
  reviewerId: string,
  note: string,
  priority: "high" | "urgent",
): Promise<ApiResult<ReviewQueueItem>> {
  return nativeActionResult(
    await reviewAction(reviewId, "escalate", {
      reviewer_id: reviewerId,
      note,
      priority,
    }),
  );
}

export async function approveReview(
  reviewId: string,
  reviewerId: string,
  note: string,
): Promise<ApiResult<ReviewQueueItem>> {
  return nativeActionResult(
    await reviewAction(reviewId, "approve", {
      reviewer_id: reviewerId,
      note,
    }),
  );
}

export async function declineReview(
  reviewId: string,
  reviewerId: string,
  note: string,
): Promise<ApiResult<ReviewQueueItem>> {
  return nativeActionResult(
    await reviewAction(reviewId, "decline", {
      reviewer_id: reviewerId,
      note,
    }),
  );
}

export function resolveFallbackPayment(
  paymentId: string,
  outcome: "approved" | "rejected",
  note: string,
): Promise<ApiResult<Payment>> {
  return apiFetch<Payment>(`/v1/payments/${encodeURIComponent(paymentId)}/transition`, {
    method: "POST",
    body: { to: outcome, reason: note },
  });
}
