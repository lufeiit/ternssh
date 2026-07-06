import type { ResolvedTheme } from "@/theme/theme";

const FAVICON_ID = "app-favicon";
const FAVICON_LIGHT = "/favicon-light.png";
const FAVICON_DARK = "/favicon-dark.png";

export function getFaviconHref(theme: ResolvedTheme): string {
  return theme === "dark" ? FAVICON_DARK : FAVICON_LIGHT;
}

export function applyFavicon(theme: ResolvedTheme): void {
  const href = getFaviconHref(theme);
  let link = document.getElementById(FAVICON_ID) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.id = FAVICON_ID;
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }

  link.href = href;
}
