import React, { createContext, useContext, useEffect, useState } from "react";

export type LicenseStatus = "none" | "active" | "expired" | "invalid";

export type ParsedLicense = {
  token: string;
  status: LicenseStatus;
  plan?: string;
  customerName?: string;
  validUntil?: string; // ISO string
  error?: string;
};

export const LICENSE_STORAGE_KEY = "restaurant-os.license.token";

export function parseLicenseToken(rawToken: string): ParsedLicense {
  const token = rawToken.trim();
  if (!token) {
    return { token: "", status: "none" };
  }

  try {
    // Basic JWT-style parsing: header.payload.signature
    const parts = token.split(".");
    if (parts.length < 2) {
      return {
        token,
        status: "invalid",
        error: "Activation code format is invalid.",
      };
    }
    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson) as {
      exp?: number;
      plan?: string;
      customer?: string;
      name?: string;
    };

    if (!payload.exp) {
      return {
        token,
        status: "invalid",
        error: "Activation code has no expiry (exp).",
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const status: LicenseStatus = payload.exp > now ? "active" : "expired";
    const validUntilIso = new Date(payload.exp * 1000).toISOString();

    return {
      token,
      status,
      plan: payload.plan,
      customerName: payload.customer || payload.name,
      validUntil: validUntilIso,
    };
  } catch (err) {
    return {
      token,
      status: "invalid",
      error: "Unable to read activation code.",
    };
  }
}

type LicenseContextValue = {
  license: ParsedLicense;
  isReady: boolean;
  refreshFromStorage: () => void;
};

const LicenseContext = createContext<LicenseContextValue | undefined>(undefined);

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const [license, setLicense] = useState<ParsedLicense>({ token: "", status: "none" });
  const [isReady, setIsReady] = useState(false);

  const refreshFromStorage = () => {
    try {
      const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
      if (stored) {
        setLicense(parseLicenseToken(stored));
      } else {
        setLicense({ token: "", status: "none" });
      }
    } catch {
      setLicense({ token: "", status: "invalid", error: "Unable to read license from storage." });
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    refreshFromStorage();
  }, []);

  return (
    <LicenseContext.Provider value={{ license, isReady, refreshFromStorage }}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error("useLicense must be used within LicenseProvider");
  return ctx;
}


