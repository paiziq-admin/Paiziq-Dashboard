import { useState } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { Link } from "react-router";
import { Sidebar } from "./Sidebar";

export function TopBar() {
  const [environment, setEnvironment] = useState("production");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="flex h-[56px] shrink-0 items-center gap-[14px] border-b p-[0_20px] glass-shell">
      <button
        aria-label="Open navigation"
        className="focus-ring hidden h-[36px] w-[36px] items-center justify-center rounded-[10px] border border-[rgba(86,66,86,0.10)] bg-[rgba(255,255,255,0.5)] text-[var(--primary)] max-[1024px]:flex"
        type="button"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={17} />
      </button>

      <select className="control min-w-[140px]" value={environment} onChange={(event) => setEnvironment(event.target.value)} aria-label="Environment">
        <option value="production">Production</option>
        <option value="staging">Staging</option>
        <option value="development">Development</option>
      </select>

      <label className="relative flex max-w-[460px] flex-1 items-center">
        <span className="sr-only">Global search</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          size={15}
          strokeWidth={2}
        />
        <input
          className="control control--leading-icon w-full font-normal text-[var(--foreground)]"
          placeholder="Search payments, users, agents..."
          type="search"
        />
      </label>

      <div className="flex-1" />

      <Link
        aria-label="View alerts"
        className="focus-ring relative flex h-[36px] w-[36px] items-center justify-center rounded-[10px] border border-[rgba(86,66,86,0.10)] bg-[rgba(255,255,255,0.5)] text-[var(--primary)] transition hover:bg-[rgba(255,255,255,0.8)]"
        to="/alerts"
      >
        <Bell size={17} strokeWidth={1.9} />
        <span className="absolute right-[-4px] top-[-4px] flex h-[16px] min-w-[16px] items-center justify-center rounded-[999px] bg-[var(--danger)] px-[4px] text-[10px] font-bold text-white">
          3
        </span>
      </Link>

      <div aria-label="User SC" className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--primary)] text-[12px] font-bold text-white">
        SC
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 hidden max-[1024px]:block">
          <button
            aria-label="Close navigation overlay"
            className="absolute inset-0 border-0 bg-[rgba(58,47,60,0.25)] backdrop-blur-[2px]"
            type="button"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute bottom-0 left-0 top-0 w-[280px] max-w-[86vw]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              aria-label="Close navigation"
              className="focus-ring absolute right-[-44px] top-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border-0 bg-[rgba(255,255,255,0.85)] text-[var(--primary)]"
              type="button"
              onClick={() => setMobileOpen(false)}
            >
              <X size={17} />
            </button>
          </aside>
        </div>
      ) : null}
    </header>
  );
}

