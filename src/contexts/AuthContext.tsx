import React, { createContext, useContext, useMemo, useState } from "react";

export type UserRole = "superadmin" | "admin" | "manager";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
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
  if (e.includes("admin")) return "admin";
  if (e.includes("manager")) return "manager";
  // Default restaurant role is manager for daily operators
  return "manager";
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
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: async ({ email, password, rememberMe }) => {
        // Frontend-only mock login. Keep password for later backend integration.
        void password;
        const next: AuthUser = {
          id: `U-${Math.random().toString(36).slice(2, 10)}`,
          email,
          name: displayNameFromEmail(email),
          role: roleFromEmail(email),
        };
        setUser(next);
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
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


