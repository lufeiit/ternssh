import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import {
  BACKGROUND_MAX_BYTES,
  readImageFileAsDataUrl,
  usePersonalization,
} from "@/theme";

export function BackgroundUpload() {
  const { backgroundImage, setBackgroundImage } = usePersonalization();
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError(t("header.backgroundInvalid"));
      return;
    }

    if (file.size > BACKGROUND_MAX_BYTES) {
      setError(
        t("header.backgroundTooLarge", {
          size: Math.round(BACKGROUND_MAX_BYTES / (1024 * 1024)),
        }),
      );
      return;
    }

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setBackgroundImage(dataUrl);
    } catch {
      setError(t("header.backgroundInvalid"));
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="app-background">{t("header.background")}</Label>
      <input
        ref={inputRef}
        id="app-background"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      {backgroundImage && (
        <div
          className="h-24 overflow-hidden border border-[var(--color-border)] bg-[var(--color-secondary)]"
          style={{
            backgroundImage: `url("${backgroundImage}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          role="img"
          aria-label={t("header.backgroundPreview")}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          {t("header.backgroundUpload")}
        </Button>
        {backgroundImage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null);
              setBackgroundImage(null);
            }}
          >
            {t("header.backgroundRemove")}
          </Button>
        )}
      </div>
      <p className="text-[11px] text-[var(--color-muted-foreground)]">
        {t("header.backgroundHint")}
      </p>
      {error && (
        <p className="text-[11px] text-[var(--color-destructive)]">{error}</p>
      )}
    </div>
  );
}
