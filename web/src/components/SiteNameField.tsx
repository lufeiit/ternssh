import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import { DEFAULT_SITE_NAME, SITE_NAME_MAX_LENGTH } from "@/lib/site-name";
import { useSiteName } from "@/lib/site-name-context";

export function SiteNameField() {
  const t = useT();
  const { siteName, setSiteName } = useSiteName();

  return (
    <div className="grid gap-2">
      <Label htmlFor="app-site-name">{t("header.siteName")}</Label>
      <Input
        id="app-site-name"
        maxLength={SITE_NAME_MAX_LENGTH}
        placeholder={DEFAULT_SITE_NAME}
        value={siteName}
        onChange={(event) => setSiteName(event.target.value)}
      />
      <p className="text-[11px] text-[var(--color-muted-foreground)]">
        {t("header.siteNameHint")}
      </p>
    </div>
  );
}
