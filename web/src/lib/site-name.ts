export const SITE_NAME_STORAGE_KEY = "ternssh-site-name";
export const DEFAULT_SITE_NAME = "ternssh";
export const SITE_NAME_MAX_LENGTH = 64;

export function normalizeSiteName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_SITE_NAME;
  return trimmed.slice(0, SITE_NAME_MAX_LENGTH);
}

export function getStoredSiteName(): string {
  const stored = localStorage.getItem(SITE_NAME_STORAGE_KEY);
  if (!stored) return DEFAULT_SITE_NAME;
  return normalizeSiteName(stored);
}

export function applySiteName(name: string): string {
  const normalized = normalizeSiteName(name);
  document.title = normalized;
  return normalized;
}

export function persistSiteName(name: string): string {
  const normalized = normalizeSiteName(name);
  if (normalized === DEFAULT_SITE_NAME) {
    localStorage.removeItem(SITE_NAME_STORAGE_KEY);
  } else {
    localStorage.setItem(SITE_NAME_STORAGE_KEY, normalized);
  }
  return normalized;
}
