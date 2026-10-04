import { describe, expect, it } from "vitest";
import { router } from "./routes";

describe("dashboard route manifest", () => {
  it("registers login plus every dashboard screen", () => {
    const rootRoutes = router.routes;
    const dashboard = rootRoutes.find((route) => route.path === "/");

    expect(rootRoutes.map((route) => route.path)).toContain("/login");
    expect(dashboard).toBeDefined();
    expect(
      dashboard?.children?.map((route) => (route.index ? "(index)" : route.path)),
    ).toEqual([
      "(index)",
      "payments",
      "payments/:id",
      "reviews",
      "policies",
      "agents",
      "audit",
      "alerts",
      "settings",
      "*",
    ]);
  });
});
