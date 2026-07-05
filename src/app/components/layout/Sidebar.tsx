import { Link, useLocation } from "react-router";
import { ShieldCheck } from "lucide-react";
import { activeNavKey, navItems } from "../../lib/nav";
import { StatusDot } from "../primitives";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const active = activeNavKey(location.pathname);

  return (
    <nav className="flex h-full flex-col border-r glass-shell">
      <div className="flex h-[56px] shrink-0 items-center border-b border-[rgba(86,66,86,0.10)] px-[20px]">
        <div className="flex items-center gap-[10px]">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] text-white shadow-[0_4px_12px_rgba(252,129,74,0.4)]">
            <ShieldCheck size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[14px] font-extrabold leading-[1.2] tracking-[-0.01em] text-[var(--foreground)]">Payment Agent</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">Audit Layer</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[2px] overflow-y-auto p-[12px_10px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <Link
              className="focus-ring flex items-center gap-[10px] rounded-[10px] p-[9px_12px] text-[13.5px] no-underline transition hover:bg-[rgba(255,255,255,0.55)]"
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
              {item.badge ? (
                <span className="ml-auto rounded-[999px] bg-[var(--accent)] px-[7px] py-[1px] text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-[8px] border-t border-[rgba(86,66,86,0.10)] p-[14px_18px] text-[12px] text-[var(--text-secondary)]">
        <div className="flex items-center gap-[8px]">
          <StatusDot pulse size={7} tone="success" />
          SDK ingestion healthy
        </div>
        <div className="flex items-center gap-[8px]">
          <StatusDot pulse size={7} tone="success" />
          Webhooks 99.7%
        </div>
      </div>
    </nav>
  );
}

