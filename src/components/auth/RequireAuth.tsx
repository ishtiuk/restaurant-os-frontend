import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RequireRole({
  role,
  children,
}: {
  role: UserRole | UserRole[];
  children?: React.ReactNode;
}) {
  const { user } = useAuth();
  const allowed = Array.isArray(role) ? role : [role];

  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children ? <>{children}</> : <Outlet />;
}


