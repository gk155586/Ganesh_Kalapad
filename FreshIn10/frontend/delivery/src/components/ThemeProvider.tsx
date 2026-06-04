"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "black" | "blue" | "white";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: string;
}>({
  theme: "black",
  setTheme: () => {},
  primaryColor: "#16a34a",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("black");
  const [primaryColor, setPrimaryColor] = useState("#16a34a");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://freshin10-api.onrender.com";
        const res = await fetch(`${API_URL}/api/config`);
        const data = await res.json();
        
        if (data.delivery) {
          applyConfig(data);
        }
      } catch (err) {
        const saved = localStorage.getItem("deliveryTheme") as Theme;
        if (saved) {
          setThemeState(saved);
          document.documentElement.setAttribute("data-theme", saved);
        }
      }
    };

    const applyConfig = (data: any) => {
      const { theme: remoteTheme, primaryColor: remoteColor } = data.delivery;
      const saved = localStorage.getItem("deliveryTheme") as Theme;
      const activeTheme = saved || remoteTheme || "black";
      
      setThemeState(activeTheme);
      setPrimaryColor(remoteColor || "#16a34a");
      document.documentElement.setAttribute("data-theme", activeTheme);
      document.documentElement.style.setProperty("--primary-color", remoteColor || "#16a34a");
    };

    fetchConfig();

    // Listen for real-time updates from parent customizer
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "CONFIG_UPDATE") {
        applyConfig(event.data.payload);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("deliveryTheme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, primaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

