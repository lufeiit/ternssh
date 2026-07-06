import { I18nProvider } from "@/i18n";
import { SiteNameProvider } from "@/lib/site-name-context";
import { ThemeProvider } from "@/theme";
import { DashboardView } from "@/dashboard/DashboardView";

export default function App() {
  return (
    <ThemeProvider>
      <SiteNameProvider>
        <I18nProvider>
          <div className="app-shell">
            <DashboardView />
          </div>
        </I18nProvider>
      </SiteNameProvider>
    </ThemeProvider>
  );
}
