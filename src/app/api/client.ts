// HTTP client for the Paiziq control plane (PZ-046).
//
// Unwraps the {success, data, error, meta} envelope, passes raw
// ingest-plane shapes through untouched, and normalizes failures into
// ApiError so screens can branch on status (401 login, 403 permission,
// 429 backoff) without parsing bodies.

import { loadSession } from "./config";
import type { Envelope } from "./types";

export class ApiError extends Error {
  status: number;
  code: string;
  retryAfterSeconds?: number;

  constructor(status: number, code: string, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface ApiResult<T> {
  data: T;
  meta?: { total: number; limit: number; offset: number };
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  endpoint?: string; // override (login verification before a session exists)
  apiKey?: string;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const session = loadSession();
  const endpoint = options.endpoint ?? session?.endpoint;
  const apiKey = options.apiKey ?? session?.apiKey;
  if (!endpoint || !apiKey) {
    throw new ApiError(401, "unauthorized", "not logged in");
  }

  let response: Response;
  try {
    response = await fetch(`${endpoint.replace(/\/$/, "")}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(0, "network_error", `cannot reach backend: ${String(cause)}`);
  }

  let payload: unknown;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(response.status, "invalid_json", `backend returned non-JSON (HTTP ${response.status})`);
  }

  const body = payload as Partial<Envelope<T>> & Record<string, unknown>;
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) {
      const error = body.error ?? { code: "error", message: "request failed" };
      notifyUnauthorized(response.status);
      throw new ApiError(
        response.status,
        error.code,
        error.message,
        retryAfter(response),
      );
    }
    return { data: body.data as T, meta: body.meta };
  }

  // Raw (non-envelope) ingest-plane endpoints: /v1/traces/*, /v1/notifications
  if (!response.ok) {
    notifyUnauthorized(response.status);
    const detail = (body as { detail?: string | Array<{ msg?: string }> }).detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).filter(Boolean).join("; ")
      : detail;
    throw new ApiError(
      response.status,
      response.status === 403 ? "forbidden" : "http_error",
      message || `HTTP ${response.status}`,
      retryAfter(response),
    );
  }
  return { data: payload as T };
}

function retryAfter(response: Response): number | undefined {
  const value = Number(response.headers.get("Retry-After"));
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function notifyUnauthorized(status: number) {
  if (status !== 401 || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("paiziq:session-expired"));
}
