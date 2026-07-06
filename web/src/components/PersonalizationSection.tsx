import { BackgroundUpload } from "@/components/BackgroundUpload";
import { LayoutSpacingSlider } from "@/components/LayoutSpacingSlider";
import { TerminalThemeSettings } from "@/components/TerminalThemeSettings";
import { ThemeSelect } from "@/components/ThemeSelect";
import { WidgetOpacitySlider } from "@/components/WidgetOpacitySlider";
import { useT } from "@/i18n";

export function PersonalizationSection() {
  const t = useT();

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t("header.personalization")}</h3>
        <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
          {t("header.personalizationHint")}
        </p>
      </div>

      <ThemeSelect />
      <TerminalThemeSettings />
      <BackgroundUpload />
      <WidgetOpacitySlider />
      <LayoutSpacingSlider />
    </section>
  );
}
