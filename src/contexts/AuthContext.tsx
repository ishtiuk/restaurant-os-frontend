import React, { createContext, useContext, useMemo, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { apiClient } from "@/lib/api";

export type UserRole = "superadmin" | "owner" | "manager" | "waiter" | "cashier" | "chef";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  token?: string;
  permissions?: Record<string, boolean>; // Route permissions: {"/dashboard": true, "/sales": false, ...}
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "restaurant-os.auth.user";

function roleFromEmail(email: string): UserRole {
  const e = email.toLowerCase().trim();
  if (e.includes("super")) return "superadmin";
  if (e.includes("owner")) return "owner";
  if (e.includes("manager")) return "manager";
  if (e.includes("cash")) return "cashier";
  if (e.includes("chef")) return "chef";
  return "waiter";
}

function displayNameFromEmail(email: string): string {
  const base = email.split("@")[0] || "User";
  return base
    .split(/[._-]/g)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as AuthUser) : null;
      if (parsed?.token) {
        apiClient.token = parsed.token;
        if (parsed.tenantId) apiClient.tenantId = parsed.tenantId;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: async ({ email, password }) => {
        const res = await authApi.login(email, password);
        const u = res.user;
        const next: AuthUser = {
          id: u.id,
          email: u.email,
          name: u.name || displayNameFromEmail(u.email),
          role: (u.is_superuser ? "superadmin" : u.role) as UserRole,
          tenantId: u.tenant_id ?? undefined,
          token: res.token,
          permissions: u.permissions ?? undefined,
        };
        setUser(next);
        // Always save to localStorage - user stays logged in until explicit logout
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        authApi.logout();
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


