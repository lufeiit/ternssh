export const BACKGROUND_STORAGE_KEY = "ternssh-background";
export const WIDGET_OPACITY_STORAGE_KEY = "ternssh-widget-opacity";
export const GRID_MARGIN_STORAGE_KEY = "ternssh-grid-margin";

export const BACKGROUND_MAX_BYTES = 2 * 1024 * 1024;
export const WIDGET_OPACITY_MIN = 30;
export const WIDGET_OPACITY_MAX = 100;
export const WIDGET_OPACITY_DEFAULT = 100;
export const GRID_MARGIN_MIN = 0;
export const GRID_MARGIN_MAX = 32;
export const GRID_MARGIN_DEFAULT = 12;

export function getStoredBackgroundImage(): string | null {
  const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY);
  return stored && stored.startsWith("data:image/") ? stored : null;
}

export function getStoredWidgetOpacity(): number {
  const stored = localStorage.getItem(WIDGET_OPACITY_STORAGE_KEY);
  if (!stored) return WIDGET_OPACITY_DEFAULT;
  const parsed = Number.parseInt(stored, 10);
  if (Number.isNaN(parsed)) return WIDGET_OPACITY_DEFAULT;
  return Math.min(
    WIDGET_OPACITY_MAX,
    Math.max(WIDGET_OPACITY_MIN, parsed),
  );
}

export function getStoredGridMargin(): number {
  const stored = localStorage.getItem(GRID_MARGIN_STORAGE_KEY);
  if (!stored) return GRID_MARGIN_DEFAULT;
  const parsed = Number.parseInt(stored, 10);
  if (Number.isNaN(parsed)) return GRID_MARGIN_DEFAULT;
  return Math.min(GRID_MARGIN_MAX, Math.max(GRID_MARGIN_MIN, parsed));
}

export function applyBackgroundImage(image: string | null) {
  const root = document.documentElement;
  if (image) {
    root.style.setProperty("--workspace-background-image", `url("${image}")`);
    root.style.setProperty("--workspace-background-opacity", "1");
    root.dataset.hasBackground = "true";
  } else {
    root.style.removeProperty("--workspace-background-image");
    root.style.removeProperty("--workspace-background-opacity");
    delete root.dataset.hasBackground;
  }
}

export function applyWidgetOpacity(percent: number) {
  const clamped = Math.min(
    WIDGET_OPACITY_MAX,
    Math.max(WIDGET_OPACITY_MIN, percent),
  );
  document.documentElement.style.setProperty(
    "--widget-opacity",
    String(clamped / 100),
  );
  return clamped;
}

export function applyGridMargin(px: number) {
  const clamped = Math.min(
    GRID_MARGIN_MAX,
    Math.max(GRID_MARGIN_MIN, Math.round(px)),
  );
  const value = `${clamped}px`;
  document.documentElement.style.setProperty("--grid-margin-x", value);
  document.documentElement.style.setProperty("--grid-margin-y", value);
  return clamped;
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Invalid image data"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}
