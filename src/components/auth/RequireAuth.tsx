import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { useLicense } from "@/contexts/LicenseContext";
import { usePermissions } from "@/contexts/PermissionsContext";

export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const { license, isReady } = useLicense();
  const { canAccess } = usePermissions();

  // Wait until license has been loaded from storage to avoid redirecting too early on refresh
  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If license is not active:
  // - Owner can only access /settings to reactivate
  // - Other roles are blocked (sent back to login)
  if (license.status !== "active") {
    if (user?.role === "owner") {
      if (location.pathname !== "/settings") {
        return <Navigate to="/settings" replace />;
      }
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // Check permissions for route access (except owner/superadmin and /settings)
  if (user?.role !== "owner" && user?.role !== "superadmin" && location.pathname !== "/settings") {
    if (!canAccess(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
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


