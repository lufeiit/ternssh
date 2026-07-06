import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applySiteName,
  DEFAULT_SITE_NAME,
  getStoredSiteName,
  persistSiteName,
  SITE_NAME_STORAGE_KEY,
} from "./site-name";

interface SiteNameContextValue {
  siteName: string;
  setSiteName: (name: string) => void;
  resetSiteName: () => void;
}

const SiteNameContext = createContext<SiteNameContextValue | null>(null);

export function SiteNameProvider({ children }: { children: ReactNode }) {
  const [siteName, setSiteNameState] = useState(() => getStoredSiteName());

  useEffect(() => {
    applySiteName(siteName);
  }, [siteName]);

  const setSiteName = useCallback((value: string) => {
    const normalized = persistSiteName(value);
    applySiteName(normalized);
    setSiteNameState(normalized);
  }, []);

  const resetSiteName = useCallback(() => {
    localStorage.removeItem(SITE_NAME_STORAGE_KEY);
    applySiteName(DEFAULT_SITE_NAME);
    setSiteNameState(DEFAULT_SITE_NAME);
  }, []);

  const value = useMemo(
    () => ({ siteName, setSiteName, resetSiteName }),
    [resetSiteName, setSiteName, siteName],
  );

  return (
    <SiteNameContext.Provider value={value}>{children}</SiteNameContext.Provider>
  );
}

export function useSiteName() {
  const context = useContext(SiteNameContext);
  if (!context) {
    throw new Error("useSiteName must be used within SiteNameProvider");
  }
  return context;
}
