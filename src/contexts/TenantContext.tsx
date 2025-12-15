import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

type Tenant = {
  id: string;
  name: string;
  plan?: string;
  isActive?: boolean;
};

type TenantContextType = {
  tenantId: string | null;
  currentTenant: Tenant | null;
  setTenantId: (tenantId: string | null) => void;
};

const STORAGE_KEY = "restaurant-os-tenant-id";

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tenantId, setTenantIdState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (user?.tenantId) {
      const tenant: Tenant = { id: user.tenantId, name: "Restaurant Tenant", isActive: true };
      setCurrentTenant(tenant);
      setTenantIdState(user.tenantId);
      localStorage.setItem(STORAGE_KEY, user.tenantId);
    } else {
      setCurrentTenant(null);
      setTenantIdState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user?.tenantId]);

  const setTenantId = (id: string | null) => {
    setTenantIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      tenantId,
      currentTenant,
      setTenantId,
    }),
    [tenantId, currentTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within a TenantProvider");
  return ctx;
}
