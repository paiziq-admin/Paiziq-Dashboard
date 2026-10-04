import { useEffect, useState, type FormEvent } from "react";
import { Bell, Menu, Monitor, Moon, Search, Sun, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTheme } from "next-themes";
import {
  TIME_RANGE_OPTIONS,
  useSession,
  useWorkspace,
  type TimeRange,
} from "../../context/DashboardContext";
import { Sidebar } from "./Sidebar";

export function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [themeReady, setThemeReady] = useState(false);
  const navigate = useNavigate();
  const { session } = useSession();
  const {
    organizations,
    environments,
    organizationId,
    environmentId,
    timeRange,
    loading,
    setOrganizationId,
    setEnvironmentId,
    setTimeRange,
  } = useWorkspace();
  const { theme, setTheme } = useTheme();

  useEffect(() => setThemeReady(true), []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = search.trim();
    navigate(q ? `/payments?q=${encodeURIComponent(q)}` : "/payments");
  };

  const themeIcon = !themeReady || theme === "system"
    ? <Monitor size={16} />
    : theme === "dark"
      ? <Moon size={16} />
      : <Sun size={16} />;
  const nextTheme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";

  return (
    <header className="flex min-h-[56px] shrink-0 items-center gap-[10px] overflow-x-auto border-b p-[8px_20px] glass-shell max-[640px]:px-[12px]">
      <button
        aria-label="Open navigation"
        className="focus-ring hidden h-[36px] w-[36px] items-center justify-center rounded-[10px] border border-[var(--glass-border)] bg-[var(--input-background)] text-[var(--primary)] max-[1024px]:flex"
        type="button"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={17} />
      </button>

      {session?.mode === "live" ? (
        <>
          <select
            aria-label="Organization"
            className="control max-w-[180px] min-w-[120px]"
            disabled={loading || organizations.length === 0}
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
          >
            {organizations.length === 0 ? <option value="">No organizations</option> : null}
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>{organization.name}</option>
            ))}
          </select>
          <select
            aria-label="Environment"
            className="control max-w-[170px] min-w-[120px]"
            disabled={loading || environments.length === 0}
            value={environmentId}
            onChange={(event) => setEnvironmentId(event.target.value)}
          >
            {environments.length === 0 ? <option value="">No environments</option> : null}
            {environments.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {environment.name} · {environment.kind}
              </option>
            ))}
          </select>
        </>
      ) : (
        <span className="inline-flex h-[34px] items-center rounded-[9px] bg-[var(--secondary)] px-[11px] text-[12px] font-bold text-[var(--text-secondary)]">
          Demo mode
        </span>
      )}

      <select
        aria-label="Time range"
        className="control min-w-[128px]"
        value={timeRange}
        onChange={(event) => setTimeRange(event.target.value as TimeRange)}
      >
        {TIME_RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <form className="relative flex max-w-[360px] min-w-[180px] flex-1 items-center max-[760px]:hidden" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="global-search">Global search</label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            size={15}
            strokeWidth={2}
          />
          <input
            className="control control--leading-icon w-full font-normal text-[var(--foreground)]"
            id="global-search"
            placeholder="Search payments, principals, merchants..."
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
      </form>

      <div className="flex-1" />

      <button
        aria-label={`Theme: ${theme ?? "system"}. Switch to ${nextTheme}.`}
        className="focus-ring flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] border border-[rgba(86,66,86,0.10)] bg-[var(--input-background)] text-[var(--primary)] transition hover:bg-[var(--popover)]"
        title={`Theme: ${theme ?? "system"}`}
        type="button"
        onClick={() => setTheme(nextTheme)}
      >
        {themeIcon}
      </button>

      <Link
        aria-label="View alerts"
        className="focus-ring relative flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] border border-[rgba(86,66,86,0.10)] bg-[var(--input-background)] text-[var(--primary)] transition hover:bg-[var(--popover)]"
        to="/alerts"
      >
        <Bell size={17} strokeWidth={1.9} />
      </Link>

      <div aria-label="Signed-in operator" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">
        {session?.mode === "live" ? "OP" : "DM"}
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
              className="focus-ring absolute right-[-44px] top-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[var(--glass-border)] bg-[var(--popover)] text-[var(--primary)]"
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
