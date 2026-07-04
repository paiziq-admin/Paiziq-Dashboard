import {
  Activity,
  Bell,
  ClipboardCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  TriangleAlert,
} from "lucide-react";

export const navItems = [
  { label: "Overview", path: "/", key: "overview", icon: LayoutDashboard },
  { label: "Payment Feed", path: "/payments", key: "payments", icon: CreditCard },
  { label: "Human Reviews", path: "/reviews", key: "reviews", icon: ClipboardCheck, badge: 3 },
  { label: "Risk Policies", path: "/policies", key: "policies", icon: Shield },
  { label: "Agents & SDK", path: "/agents", key: "agents", icon: Activity },
  { label: "Audit Log", path: "/audit", key: "audit", icon: FileText },
  { label: "Alerts", path: "/alerts", key: "alerts", icon: TriangleAlert, badge: 2 },
  { label: "Settings", path: "/settings", key: "settings", icon: Settings },
] as const;

export function activeNavKey(pathname: string) {
  if (pathname === "/") return "overview";
  if (pathname.startsWith("/payments")) return "payments";
  const item = navItems.find((nav) => pathname.startsWith(nav.path) && nav.path !== "/");
  return item?.key ?? "overview";
}

export const notificationIcon = Bell;

