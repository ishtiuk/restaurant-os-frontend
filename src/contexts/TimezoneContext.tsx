import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { tenantApi } from "@/lib/api/tenant";

type TimezoneContextType = {
  timezone: string;
  setTimezone: (tz: string) => void;
  isLoading: boolean;
};

const TimezoneContext = createContext<TimezoneContextType | null>(null);

export const TimezoneProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch timezone from backend on mount and when user changes
  useEffect(() => {
    const loadTimezone = async () => {
      if (!isAuthenticated || !user?.token) {
        // Not authenticated: use localStorage fallback
        const saved = localStorage.getItem("restaurant-os-timezone");
        if (saved) {
          setTimezone(saved);
        }
        setIsLoading(false);
        return;
      }

      try {
        // Fetch from backend (source of truth)
        const settings = await tenantApi.getSettings();
        if (settings.timezone) {
          setTimezone(settings.timezone);
          // Sync to localStorage as fallback for print system
          localStorage.setItem("restaurant-os-timezone", settings.timezone);
        }
      } catch (error) {
        console.error("Failed to load timezone from backend:", error);
        // Fallback to localStorage if backend fails
        const saved = localStorage.getItem("restaurant-os-timezone");
        if (saved) {
          setTimezone(saved);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTimezone();
  }, [isAuthenticated, user?.token]);

  const updateTimezone = async (tz: string) => {
    setTimezone(tz);
    // Save to localStorage immediately for responsive UI
    localStorage.setItem("restaurant-os-timezone", tz);

    // Save to backend if authenticated
    if (isAuthenticated && user?.token) {
      try {
        await tenantApi.updateSettings({ timezone: tz });
      } catch (error) {
        console.error("Failed to save timezone to backend:", error);
        // Timezone is already saved to localStorage, so UI is still updated
      }
    }
  };

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone: updateTimezone, isLoading }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => {
  const ctx = useContext(TimezoneContext);
  if (!ctx) throw new Error("useTimezone must be used inside TimezoneProvider");
  return ctx;
};
