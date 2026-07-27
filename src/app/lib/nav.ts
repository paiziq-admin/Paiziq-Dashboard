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
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  key: string;
  icon: LucideIcon;
}

export const navItems: readonly NavItem[] = [
  { label: "Overview", path: "/", key: "overview", icon: LayoutDashboard },
  { label: "Payment Feed", path: "/payments", key: "payments", icon: CreditCard },
  { label: "Human Reviews", path: "/reviews", key: "reviews", icon: ClipboardCheck },
  { label: "Risk Policies", path: "/policies", key: "policies", icon: Shield },
  { label: "Agents & SDK", path: "/agents", key: "agents", icon: Activity },
  { label: "Audit Log", path: "/audit", key: "audit", icon: FileText },
  { label: "Alerts", path: "/alerts", key: "alerts", icon: TriangleAlert },
  { label: "Settings", path: "/settings", key: "settings", icon: Settings },
];

export function activeNavKey(pathname: string) {
  if (pathname === "/") return "overview";
  if (pathname.startsWith("/payments")) return "payments";
  const item = navItems.find((nav) => pathname.startsWith(nav.path) && nav.path !== "/");
  return item?.key ?? "overview";
}

export const notificationIcon = Bell;
