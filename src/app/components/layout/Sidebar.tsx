import { Link, useLocation } from "react-router";
import { LogOut } from "lucide-react";
import { activeNavKey, navItems } from "../../lib/nav";
import { useSession, useWorkspace } from "../../context/DashboardContext";
import { PaiziqLogo, StatusDot } from "../primitives";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const active = activeNavKey(location.pathname);
  const { session, signOut } = useSession();
  const { selectedEnvironment } = useWorkspace();

  return (
    <nav className="flex h-full flex-col border-r glass-shell">
      <div className="flex h-[56px] shrink-0 items-center border-b border-[rgba(86,66,86,0.10)] px-[20px] pl-[28px]">
        <div className="flex items-center gap-[10px]">
          <PaiziqLogo className="h-[30px] w-auto shrink-0 text-[var(--foreground)]" wordmark />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[2px] overflow-y-auto p-[12px_10px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              className="focus-ring flex items-center gap-[10px] rounded-[10px] p-[9px_12px] text-[13.5px] no-underline transition hover:bg-[var(--glass-panel)]"
              key={item.path}
              onClick={onNavigate}
              style={{
                color: isActive ? "var(--accent-dark)" : "var(--text-secondary)",
                background: isActive ? "rgba(252,129,74,0.14)" : "transparent",
                fontWeight: isActive ? 700 : 500,
              }}
              to={item.path}
            >
              <Icon className="shrink-0" size={17} strokeWidth={1.9} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-[10px] border-t border-[rgba(86,66,86,0.10)] p-[14px_18px] text-[12px] text-[var(--text-secondary)]">
        <div className="flex items-center gap-[8px]">
          <StatusDot pulse={session?.mode === "live"} size={7} tone={session?.mode === "live" ? "success" : "neutral"} />
          <span className="truncate">
            {session?.mode === "live"
              ? selectedEnvironment?.name ?? "Connected"
              : "Interface demo"}
          </span>
        </div>
        <button
          className="focus-ring button-reset flex items-center gap-[8px] rounded-[8px] py-[4px] text-left font-semibold transition hover:text-[var(--danger-text)]"
          type="button"
          onClick={() => {
            signOut();
            onNavigate?.();
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </nav>
  );
}
