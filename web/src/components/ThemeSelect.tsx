import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import { THEME_OPTIONS, useTheme, type ThemeMode } from "@/theme";

export function ThemeSelect() {
  const { mode, setMode } = useTheme();
  const t = useT();

  return (
    <div className="grid gap-2">
      <Label htmlFor="app-theme">{t("header.theme")}</Label>
      <select
        id="app-theme"
        className="flex h-9 w-full bg-[var(--color-secondary)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        value={mode}
        onChange={(event) => setMode(event.target.value as ThemeMode)}
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
      <p className="text-[11px] text-[var(--color-muted-foreground)]">
        {t("header.themeHint")}
      </p>
    </div>
  );
}
