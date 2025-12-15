import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

type PermissionsContextValue = {
  canAccess: (path: string) => boolean;
  hasPermission: (path: string) => boolean;
};

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<PermissionsContextValue>(() => {
    // Owner and superadmin always have full access
    const isOwnerOrSuperadmin = user?.role === "owner" || user?.role === "superadmin";
    
    return {
      canAccess: (path: string) => {
        if (isOwnerOrSuperadmin) return true;
        if (!user?.permissions) return false; // No permissions = no access
        return user.permissions[path] === true;
      },
      hasPermission: (path: string) => {
        if (isOwnerOrSuperadmin) return true;
        if (!user?.permissions) return false;
        return user.permissions[path] === true;
      },
    };
  }, [user?.role, user?.permissions]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used within PermissionsProvider");
  return ctx;
}

