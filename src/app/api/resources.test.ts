import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveSession } from "./config";
import { fetchEnvironments, fetchOrgs, fetchPaymentExecution, fetchPayments } from "./resources";

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

describe("resource adapters", () => {
  it("reads encoded execution evidence with authentication and keeps exact decimals", async () => {
    const data = { payment_id: "pay / one", budget: { committed_amount: "9007199254740993.00000001" } };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ success: true, data, error: null }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchPaymentExecution("pay / one");
    expect(result.data).toEqual(data);
    expect(requestUrls(fetchMock)).toEqual(["https://api.paiziq.test/v1/payments/pay%20%2F%20one/execution"]);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "GET", headers: { Authorization: "Bearer test-key" } });
  });

  it("loads every organization page instead of truncating workspace selection", async () => {
    const fetchMock = installPagedList("/v1/orgs", 201);

    const result = await fetchOrgs();

    expect(result.data).toHaveLength(201);
    expect(result.data[200]?.id).toBe("item_200");
    expect(result.meta).toEqual({ total: 201, limit: 201, offset: 0 });
    expect(requestUrls(fetchMock)).toEqual([
      "https://api.paiziq.test/v1/orgs?limit=200&offset=0",
      "https://api.paiziq.test/v1/orgs?limit=200&offset=200",
    ]);
  });

  it("loads every environment page and safely encodes the organization ID", async () => {
    const fetchMock = installPagedList(
      "/v1/orgs/org%20%2F%20one/environments",
      201,
    );

    const result = await fetchEnvironments("org / one");

    expect(result.data).toHaveLength(201);
    expect(requestUrls(fetchMock).at(-1)).toBe(
      "https://api.paiziq.test/v1/orgs/org%20%2F%20one/environments?limit=200&offset=200",
    );
  });

  it("forwards server-side payment filters, time bounds, and sorting", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        data: [],
        error: null,
        meta: { total: 0, limit: 25, offset: 50 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchPayments({
      env_id: "env_1",
      currency: "USD",
      min_amount: 10,
      max_amount: 200,
      q: "Acme Cloud",
      from_ms: 100,
      to_ms: 200,
      sort: "amount_desc",
      limit: 25,
      offset: 50,
    });

    expect(requestUrls(fetchMock)).toEqual([
      "https://api.paiziq.test/v1/payments?env_id=env_1&currency=USD&min_amount=10&max_amount=200&q=Acme%20Cloud&from_ms=100&to_ms=200&sort=amount_desc&limit=25&offset=50",
    ]);
  });
});

function installPagedList(pathname: string, total: number) {
  const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
    const url = requestUrl(input);
    expect(url.pathname).toBe(pathname);
    const limit = Number(url.searchParams.get("limit"));
    const offset = Number(url.searchParams.get("offset"));
    const count = Math.max(0, Math.min(limit, total - offset));
    const data = Array.from({ length: count }, (_, index) => ({
      id: `item_${offset + index}`,
    }));
    return Response.json({
      success: true,
      data,
      error: null,
      meta: { total, limit, offset },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestUrls(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map(([input]) => requestUrl(input).href);
}

function requestUrl(input: RequestInfo | URL): URL {
  if (typeof input === "string") return new URL(input);
  if (input instanceof URL) return input;
  return new URL(input.url);
}
