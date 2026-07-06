import type { ResolvedTheme } from "./theme";

export type TerminalThemeMode = "default" | "custom";

export interface CustomTerminalThemeColors {
  foreground: string;
  cursor: string;
}

export interface TerminalThemeColors {
  background: string;
  foreground: string;
  cursor: string;
}

export interface TerminalThemeConfig {
  mode: TerminalThemeMode;
  custom: CustomTerminalThemeColors;
}

export const TERMINAL_THEME_STORAGE_KEY = "ternssh-terminal-theme";

const TRANSPARENT_BACKGROUND = "#00000000";

export const DEFAULT_CUSTOM_TERMINAL_COLORS: Record<
  ResolvedTheme,
  CustomTerminalThemeColors
> = {
  light: {
    foreground: "#171717",
    cursor: "#0f766e",
  },
  dark: {
    foreground: "#fafafa",
    cursor: "#72d4a8",
  },
};

function parseHexColor(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  return fallback;
}

export function cssColorToHex(color: string, fallback: string): string {
  if (!color) return fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();

  if (typeof document === "undefined") return fallback;

  const el = document.createElement("div");
  el.style.color = color;
  document.documentElement.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.documentElement.removeChild(el);

  const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return fallback;

  const hex = [match[1], match[2], match[3]]
    .map((part) => Number.parseInt(part, 10).toString(16).padStart(2, "0"))
    .join("");
  return `#${hex}`;
}

export function getAppThemeTerminalColors(
  resolved: ResolvedTheme,
): CustomTerminalThemeColors {
  const fallback = DEFAULT_CUSTOM_TERMINAL_COLORS[resolved];
  if (typeof document === "undefined") return fallback;

  const styles = getComputedStyle(document.documentElement);
  return {
    foreground: cssColorToHex(
      styles.getPropertyValue("--color-foreground").trim(),
      fallback.foreground,
    ),
    cursor: cssColorToHex(
      styles.getPropertyValue("--color-primary").trim(),
      fallback.cursor,
    ),
  };
}

export function resolveTerminalXtermTheme(
  config: TerminalThemeConfig,
  resolvedAppTheme: ResolvedTheme,
): TerminalThemeColors {
  if (config.mode === "custom") {
    return {
      background: TRANSPARENT_BACKGROUND,
      foreground: config.custom.foreground,
      cursor: config.custom.cursor,
    };
  }

  const colors = getAppThemeTerminalColors(resolvedAppTheme);
  return {
    background: TRANSPARENT_BACKGROUND,
    foreground: colors.foreground,
    cursor: colors.cursor,
  };
}

export function createDefaultTerminalThemeConfig(): TerminalThemeConfig {
  return {
    mode: "default",
    custom: { ...DEFAULT_CUSTOM_TERMINAL_COLORS.dark },
  };
}

export function getStoredTerminalThemeConfig(): TerminalThemeConfig {
  const fallback = createDefaultTerminalThemeConfig();
  const stored = localStorage.getItem(TERMINAL_THEME_STORAGE_KEY);
  if (!stored) return fallback;

  try {
    const parsed = JSON.parse(stored) as Partial<{
      mode: TerminalThemeMode;
      custom: Partial<CustomTerminalThemeColors>;
    }>;
    const mode = parsed.mode === "custom" ? "custom" : "default";
    const base = DEFAULT_CUSTOM_TERMINAL_COLORS.dark;
    return {
      mode,
      custom: {
        foreground: parseHexColor(parsed.custom?.foreground, base.foreground),
        cursor: parseHexColor(parsed.custom?.cursor, base.cursor),
      },
    };
  } catch {
    return fallback;
  }
}

/** @deprecated Use resolveTerminalXtermTheme */
export function resolveTerminalTheme(
  config: TerminalThemeConfig,
  resolvedAppTheme: ResolvedTheme,
): TerminalThemeColors {
  return resolveTerminalXtermTheme(config, resolvedAppTheme);
}

export function getDefaultTerminalTheme(
  resolved: ResolvedTheme,
): TerminalThemeColors {
  return resolveTerminalXtermTheme(
    { mode: "default", custom: DEFAULT_CUSTOM_TERMINAL_COLORS.dark },
    resolved,
  );
}

export function getTerminalTheme(resolved: ResolvedTheme): TerminalThemeColors {
  return getDefaultTerminalTheme(resolved);
}
