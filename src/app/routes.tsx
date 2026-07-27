import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { DashboardShell } from "./components/layout/DashboardShell";
import { LoginScreen } from "./components/auth/LoginScreen";
import { PublicOnly, RequireSession } from "./components/auth/RequireSession";
import { LoadingState } from "./components/feedback/AsyncBoundary";

const OverviewScreen = lazy(() =>
  import("./components/screens/overview/OverviewScreen").then((module) => ({
    default: module.OverviewScreen,
  })),
);
const PaymentFeedScreen = lazy(() =>
  import("./components/screens/payments/PaymentFeedScreen").then((module) => ({
    default: module.PaymentFeedScreen,
  })),
);
const PaymentDetailScreen = lazy(() =>
  import("./components/screens/payments/PaymentDetailScreen").then((module) => ({
    default: module.PaymentDetailScreen,
  })),
);
const HumanReviewsScreen = lazy(() =>
  import("./components/screens/reviews/HumanReviewsScreen").then((module) => ({
    default: module.HumanReviewsScreen,
  })),
);
const PoliciesScreen = lazy(() =>
  import("./components/screens/policies/PoliciesScreen").then((module) => ({
    default: module.PoliciesScreen,
  })),
);
const AgentsScreen = lazy(() =>
  import("./components/screens/agents/AgentsScreen").then((module) => ({
    default: module.AgentsScreen,
  })),
);
const AuditScreen = lazy(() =>
  import("./components/screens/audit/AuditScreen").then((module) => ({
    default: module.AuditScreen,
  })),
);
const AlertsScreen = lazy(() =>
  import("./components/screens/alerts/AlertsScreen").then((module) => ({
    default: module.AlertsScreen,
  })),
);
const SettingsScreen = lazy(() =>
  import("./components/screens/settings/SettingsScreen").then((module) => ({
    default: module.SettingsScreen,
  })),
);

function routeElement(node: ReactNode) {
  return <Suspense fallback={<LoadingState label="Opening screen" />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicOnly>
        <LoginScreen />
      </PublicOnly>
    ),
  },
  {
    path: "/",
    element: (
      <RequireSession>
        <DashboardShell />
      </RequireSession>
    ),
    children: [
      { index: true, element: routeElement(<OverviewScreen />) },
      { path: "payments", element: routeElement(<PaymentFeedScreen />) },
      { path: "payments/:id", element: routeElement(<PaymentDetailScreen />) },
      { path: "reviews", element: routeElement(<HumanReviewsScreen />) },
      { path: "policies", element: routeElement(<PoliciesScreen />) },
      { path: "agents", element: routeElement(<AgentsScreen />) },
      { path: "audit", element: routeElement(<AuditScreen />) },
      { path: "alerts", element: routeElement(<AlertsScreen />) },
      { path: "settings", element: routeElement(<SettingsScreen />) },
      { path: "*", element: <Navigate replace to="/" /> },
    ],
  },
]);
