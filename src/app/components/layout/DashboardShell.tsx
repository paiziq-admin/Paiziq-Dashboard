import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function DashboardShell() {
  return (
    <div className="app-background flex h-screen overflow-hidden font-sans text-[var(--foreground)]">
      <aside className="desktop-sidebar w-[228px] shrink-0">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="page-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

