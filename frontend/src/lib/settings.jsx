import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchSettings } from "../lib/api";
import { FALLBACK_SETTINGS } from "../data/fallbackContent";

const SettingsContext = createContext({
  settings: null,
  refresh: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);

  const refresh = useCallback(async () => {
    try {
      const s = await fetchSettings();
      setSettings(s);
    } catch {
      setSettings(FALLBACK_SETTINGS);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() { return useContext(SettingsContext); }
