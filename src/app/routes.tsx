import { createBrowserRouter } from "react-router";
import { DashboardShell } from "./components/layout/DashboardShell";
import { OverviewScreen } from "./components/screens/overview/OverviewScreen";
import { PaymentFeedScreen } from "./components/screens/payments/PaymentFeedScreen";
import { PaymentDetailScreen } from "./components/screens/payments/PaymentDetailScreen";
import { HumanReviewsScreen } from "./components/screens/reviews/HumanReviewsScreen";
import { PoliciesScreen } from "./components/screens/policies/PoliciesScreen";
import { AgentsScreen } from "./components/screens/agents/AgentsScreen";
import { AuditScreen } from "./components/screens/audit/AuditScreen";
import { AlertsScreen } from "./components/screens/alerts/AlertsScreen";
import { SettingsScreen } from "./components/screens/settings/SettingsScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardShell,
    children: [
      { index: true, Component: OverviewScreen },
      { path: "payments", Component: PaymentFeedScreen },
      { path: "payments/:id", Component: PaymentDetailScreen },
      { path: "reviews", Component: HumanReviewsScreen },
      { path: "policies", Component: PoliciesScreen },
      { path: "agents", Component: AgentsScreen },
      { path: "audit", Component: AuditScreen },
      { path: "alerts", Component: AlertsScreen },
      { path: "settings", Component: SettingsScreen },
    ],
  },
]);

