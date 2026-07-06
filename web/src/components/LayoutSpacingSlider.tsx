import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import {
  GRID_MARGIN_MAX,
  GRID_MARGIN_MIN,
  usePersonalization,
} from "@/theme";

export function LayoutSpacingSlider() {
  const { gridMargin, setGridMargin } = usePersonalization();
  const t = useT();

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="app-layout-spacing">{t("header.layoutSpacing")}</Label>
        <span className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
          {gridMargin}px
        </span>
      </div>
      <input
        id="app-layout-spacing"
        type="range"
        min={GRID_MARGIN_MIN}
        max={GRID_MARGIN_MAX}
        step={2}
        value={gridMargin}
        className="h-2 w-full cursor-pointer accent-[var(--color-primary)]"
        onChange={(event) => setGridMargin(Number(event.target.value))}
      />
      <p className="text-[11px] text-[var(--color-muted-foreground)]">
        {t("header.layoutSpacingHint")}
      </p>
    </div>
  );
}
