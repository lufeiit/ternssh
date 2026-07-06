import { useEffect, useRef, useState, type DragEvent } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import {
  privateKeyLabelFromFile,
  readPrivateKeyFile,
} from "@/lib/private-key-file";
import {
  deleteSavedPrivateKey,
  listSavedPrivateKeys,
  type SavedPrivateKey,
} from "@/lib/saved-private-keys";
import { cn } from "@/lib/utils";

interface PrivateKeyFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  saveKey: boolean;
  onSaveKeyChange: (save: boolean) => void;
  keyName: string;
  onKeyNameChange: (name: string) => void;
  required?: boolean;
  placeholder?: string;
}

export function PrivateKeyField({
  id,
  value,
  onChange,
  saveKey,
  onSaveKeyChange,
  keyName,
  onKeyNameChange,
  required = false,
  placeholder,
}: PrivateKeyFieldProps) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedKeys, setSavedKeys] = useState<SavedPrivateKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listSavedPrivateKeys()
      .then((keys) => {
        if (!cancelled) setSavedKeys(keys);
      })
      .catch(() => {
        if (!cancelled) setSavedKeys([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyUploadedFile = async (file: File) => {
    setUploadError(null);
    try {
      const text = await readPrivateKeyFile(file);
      if (!text) {
        setUploadError(t("privateKey.uploadEmpty"));
        return;
      }
      onChange(text);
      onKeyNameChange(privateKeyLabelFromFile(file));
      setUploadFileName(file.name);
      setSelectedKeyId("");
    } catch {
      setUploadError(t("privateKey.uploadFailed"));
    }
  };

  const handleSelectSavedKey = (keyId: string) => {
    setSelectedKeyId(keyId);
    if (!keyId) return;
    const saved = savedKeys.find((item) => item.id === keyId);
    if (!saved) return;
    onChange(saved.content);
    onKeyNameChange(saved.name);
    onSaveKeyChange(false);
    setUploadFileName(null);
    setUploadError(null);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await applyUploadedFile(file);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;
    void applyUploadedFile(file);
  };

  const handleDeleteSavedKey = (keyId: string) => {
    void deleteSavedPrivateKey(keyId)
      .then(() => {
        setSavedKeys((current) => current.filter((item) => item.id !== keyId));
        if (selectedKeyId === keyId) {
          setSelectedKeyId("");
        }
      })
      .catch(() => {});
  };

  return (
    <div className="grid gap-2">
      {!loading && savedKeys.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-saved`}>{t("privateKey.savedKeys")}</Label>
          <div className="flex gap-2">
            <select
              id={`${id}-saved`}
              className="flex h-9 min-w-0 flex-1 bg-[var(--color-secondary)] px-3 text-sm"
              value={selectedKeyId}
              onChange={(event) => handleSelectSavedKey(event.target.value)}
            >
              <option value="">{t("privateKey.selectSavedKey")}</option>
              {savedKeys.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {selectedKeyId && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={t("privateKey.deleteSavedKey")}
                onClick={() => handleDeleteSavedKey(selectedKeyId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-5 text-center transition-colors",
          dragOver
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
            : "border-[var(--color-border)] bg-[var(--color-secondary)]/40 hover:bg-[var(--color-secondary)]/70",
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <Upload className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        <div className="text-sm">{t("privateKey.uploadHint")}</div>
        <div className="text-[11px] text-[var(--color-muted-foreground)]">
          {t("privateKey.uploadFormats")}
        </div>
        {uploadFileName && (
          <div className="text-xs text-[var(--color-primary)]">
            {t("privateKey.uploadedFile", { name: uploadFileName })}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={`${id}-file`}
        type="file"
        className="hidden"
        onChange={(event) => void handleImportFile(event)}
      />

      {uploadError && (
        <p className="text-xs text-[var(--color-destructive)]">{uploadError}</p>
      )}

      <textarea
        id={id}
        className="min-h-28 w-full bg-[var(--color-secondary)] px-3 py-2 font-mono text-xs"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setSelectedKeyId("");
          setUploadFileName(null);
          setUploadError(null);
        }}
        placeholder={placeholder ?? t("privateKey.pastePlaceholder")}
        required={required}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={saveKey}
          onChange={(event) => onSaveKeyChange(event.target.checked)}
        />
        {t("privateKey.saveForLater")}
      </label>

      {saveKey && (
        <Input
          id={`${id}-name`}
          value={keyName}
          onChange={(event) => onKeyNameChange(event.target.value)}
          placeholder={t("privateKey.keyNamePlaceholder")}
        />
      )}
    </div>
  );
}
