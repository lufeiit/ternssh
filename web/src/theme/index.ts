export { ThemeProvider, usePersonalization, useTheme } from "./context";
export type { ResolvedTheme, ThemeMode } from "./theme";
export {
  getTerminalTheme,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
} from "./theme";
export {
  BACKGROUND_MAX_BYTES,
  BACKGROUND_STORAGE_KEY,
  GRID_MARGIN_DEFAULT,
  GRID_MARGIN_MAX,
  GRID_MARGIN_MIN,
  GRID_MARGIN_STORAGE_KEY,
  readImageFileAsDataUrl,
  WIDGET_OPACITY_MAX,
  WIDGET_OPACITY_MIN,
  WIDGET_OPACITY_STORAGE_KEY,
} from "./personalization";
export type {
  CustomTerminalThemeColors,
  TerminalThemeColors,
  TerminalThemeConfig,
  TerminalThemeMode,
} from "./terminal-theme";
export {
  DEFAULT_CUSTOM_TERMINAL_COLORS,
  TERMINAL_THEME_STORAGE_KEY,
} from "./terminal-theme";
