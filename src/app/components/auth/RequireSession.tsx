import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useSession } from "../../context/DashboardContext";

export function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate replace state={{ from: location.pathname + location.search }} to="/login" />;
  }
  return children;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { session } = useSession();
  return session ? <Navigate replace to="/" /> : children;
}
