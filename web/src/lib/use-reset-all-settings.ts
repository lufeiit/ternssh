import { useCallback } from "react";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import {
  clearAppSettingsStorage,
  detectDefaultLocale,
  dispatchSettingsResetEvent,
} from "@/lib/app-settings";
import { useSiteName } from "@/lib/site-name-context";
import { usePersonalization } from "@/theme";

export function useResetAllSettings() {
  const { setLocale } = useI18n();
  const { resetPersonalization } = usePersonalization();
  const { resetSiteName } = useSiteName();

  return useCallback(async () => {
    clearAppSettingsStorage();
    setLocale(detectDefaultLocale(), false);
    resetSiteName();
    resetPersonalization();
    await api.resetDashboard();
    dispatchSettingsResetEvent();
  }, [resetPersonalization, resetSiteName, setLocale]);
}
