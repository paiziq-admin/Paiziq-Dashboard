import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { OverviewDashboard } from "./components/OverviewDashboard";
import { PaymentFeed } from "./components/PaymentFeed";
import { PaymentDetail } from "./components/PaymentDetail";
import { HumanReviewQueue } from "./components/HumanReviewQueue";
import { RiskPolicies } from "./components/RiskPolicies";
import { AgentMonitoring } from "./components/AgentMonitoring";
import { AuditLog } from "./components/AuditLog";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: OverviewDashboard },
      { path: "payments", Component: PaymentFeed },
      { path: "payments/:id", Component: PaymentDetail },
      { path: "reviews", Component: HumanReviewQueue },
      { path: "policies", Component: RiskPolicies },
      { path: "agents", Component: AgentMonitoring },
      { path: "audit", Component: AuditLog },
    ],
  },
]);
