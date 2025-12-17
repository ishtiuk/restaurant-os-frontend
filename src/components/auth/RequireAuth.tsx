import React, { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const { canAccess } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Memoize the redirect target to prevent unnecessary re-renders
  const redirectTarget = useMemo(() => {
    const currentPath = location.pathname;

    // Check permissions for route access (except owner/superadmin and /settings)
    if (user?.role !== "owner" && user?.role !== "superadmin" && currentPath !== "/settings") {
      if (!canAccess(currentPath)) {
        return "/dashboard";
      }
    }

    return null; // No redirect needed
  }, [user?.role, location.pathname, canAccess]);

  // Only redirect if we have a target and we're not already there
  if (redirectTarget && location.pathname !== redirectTarget) {
    return <Navigate to={redirectTarget} replace />;
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


