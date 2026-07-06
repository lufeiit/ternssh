import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import {
  usePersonalization,
  WIDGET_OPACITY_MAX,
  WIDGET_OPACITY_MIN,
} from "@/theme";

export function WidgetOpacitySlider() {
  const { widgetOpacity, setWidgetOpacity } = usePersonalization();
  const t = useT();

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="app-widget-opacity">{t("header.widgetOpacity")}</Label>
        <span className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
          {widgetOpacity}%
        </span>
      </div>
      <input
        id="app-widget-opacity"
        type="range"
        min={WIDGET_OPACITY_MIN}
        max={WIDGET_OPACITY_MAX}
        step={5}
        value={widgetOpacity}
        className="h-2 w-full cursor-pointer accent-[var(--color-primary)]"
        onChange={(event) => setWidgetOpacity(Number(event.target.value))}
      />
      <p className="text-[11px] text-[var(--color-muted-foreground)]">
        {t("header.widgetOpacityHint")}
      </p>
    </div>
  );
}
