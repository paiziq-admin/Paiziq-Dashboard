import { describe, expect, it } from "vitest";
import {
  clearSession,
  loadSession,
  normalizeEndpoint,
  saveSession,
} from "./config";

describe("dashboard session storage", () => {
  it("normalizes and round-trips a live session", () => {
    saveSession({
      mode: "live",
      endpoint: "  http://127.0.0.1:8800/// ",
      apiKey: "  test-key  ",
    });

    expect(loadSession()).toEqual({
      mode: "live",
      endpoint: "http://127.0.0.1:8800",
      apiKey: "test-key",
    });
  });

  it("round-trips demo mode without credentials", () => {
    saveSession({ mode: "demo", endpoint: "ignored", apiKey: "ignored" });
    expect(loadSession()).toEqual({ mode: "demo", endpoint: "", apiKey: "" });
  });

  it("clears invalid and explicit sessions", () => {
    window.sessionStorage.setItem("paiziq.dashboard.session", "{bad-json");
    expect(loadSession()).toBeNull();

    saveSession({ mode: "live", endpoint: "http://api.test", apiKey: "key" });
    clearSession();
    expect(loadSession()).toBeNull();
    expect(normalizeEndpoint("https://api.test///")).toBe("https://api.test");
  });
});
