import React, { createContext, useContext, useState, useEffect } from "react";

type TimezoneContextType = {
  timezone: string;
  setTimezone: (tz: string) => void;
};

const TimezoneContext = createContext<TimezoneContextType | null>(null);

export const TimezoneProvider = ({ children }: { children: React.ReactNode }) => {
  const [timezone, setTimezone] = useState("Asia/Dhaka");

  useEffect(() => {
    const saved = localStorage.getItem("restaurant-os-timezone");
    if (saved) {
      setTimezone(saved);
    }
  }, []);

  const updateTimezone = (tz: string) => {
    setTimezone(tz);
    localStorage.setItem("restaurant-os-timezone", tz);
  };

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone: updateTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => {
  const ctx = useContext(TimezoneContext);
  if (!ctx) throw new Error("useTimezone must be used inside TimezoneProvider");
  return ctx;
};
