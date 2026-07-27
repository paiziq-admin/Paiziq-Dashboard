import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveSession } from "./config";
import { ApiError, apiFetch } from "./client";

beforeEach(() => {
  saveSession({
    mode: "live",
    endpoint: "https://api.paiziq.test",
    apiKey: "test-key",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("unwraps control-plane envelopes and pagination", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          success: true,
          data: [{ id: "pay_1" }],
          error: null,
          meta: { total: 1, limit: 50, offset: 0 },
        }),
      ),
    );

    await expect(apiFetch<Array<{ id: string }>>("/v1/payments")).resolves.toEqual({
      data: [{ id: "pay_1" }],
      meta: { total: 1, limit: 50, offset: 0 },
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.paiziq.test/v1/payments",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-key" },
        method: "GET",
      }),
    );
  });

  it("passes raw ingest-plane responses through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ trace_id: "trace_1", spans: [] }),
      ),
    );

    await expect(
      apiFetch<{ trace_id: string; spans: unknown[] }>("/v1/traces/trace_1"),
    ).resolves.toEqual({ data: { trace_id: "trace_1", spans: [] } });
  });

  it("normalizes envelope errors and retry metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            data: null,
            error: { code: "rate_limited", message: "Slow down" },
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "12",
            },
            status: 429,
          },
        ),
      ),
    );

    const request = apiFetch("/v1/payments");
    await expect(request).rejects.toMatchObject({
      code: "rate_limited",
      message: "Slow down",
      retryAfterSeconds: 12,
      status: 429,
    });
  });

  it("emits session expiry when the backend returns 401", async () => {
    const expired = vi.fn();
    window.addEventListener("paiziq:session-expired", expired);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            data: null,
            error: { code: "unauthorized", message: "Expired" },
          }),
          { headers: { "Content-Type": "application/json" }, status: 401 },
        ),
      ),
    );

    await expect(apiFetch("/v1/agents")).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledOnce();
    window.removeEventListener("paiziq:session-expired", expired);
  });
});
