import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import {
  deleteSavedPassword,
  listSavedPasswords,
  type SavedPassword,
} from "@/lib/saved-passwords";

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  savePassword: boolean;
  onSavePasswordChange: (save: boolean) => void;
  passwordName: string;
  onPasswordNameChange: (name: string) => void;
  required?: boolean;
  placeholder?: string;
}

export function PasswordField({
  id,
  value,
  onChange,
  savePassword,
  onSavePasswordChange,
  passwordName,
  onPasswordNameChange,
  required = false,
  placeholder,
}: PasswordFieldProps) {
  const t = useT();
  const [savedPasswords, setSavedPasswords] = useState<SavedPassword[]>([]);
  const [selectedPasswordId, setSelectedPasswordId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listSavedPasswords()
      .then((passwords) => {
        if (!cancelled) setSavedPasswords(passwords);
      })
      .catch(() => {
        if (!cancelled) setSavedPasswords([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectSavedPassword = (passwordId: string) => {
    setSelectedPasswordId(passwordId);
    if (!passwordId) return;
    const saved = savedPasswords.find((item) => item.id === passwordId);
    if (!saved) return;
    onChange(saved.content);
    onPasswordNameChange(saved.name);
    onSavePasswordChange(false);
  };

  const handleDeleteSavedPassword = (passwordId: string) => {
    void deleteSavedPassword(passwordId)
      .then(() => {
        setSavedPasswords((current) =>
          current.filter((item) => item.id !== passwordId),
        );
        if (selectedPasswordId === passwordId) {
          setSelectedPasswordId("");
        }
      })
      .catch(() => {});
  };

  return (
    <div className="grid gap-2">
      {!loading && savedPasswords.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-saved`}>{t("savedPassword.savedPasswords")}</Label>
          <div className="flex gap-2">
            <select
              id={`${id}-saved`}
              className="flex h-9 min-w-0 flex-1 bg-[var(--color-secondary)] px-3 text-sm"
              value={selectedPasswordId}
              onChange={(event) => handleSelectSavedPassword(event.target.value)}
            >
              <option value="">{t("savedPassword.selectSavedPassword")}</option>
              {savedPasswords.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {selectedPasswordId && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={t("savedPassword.deleteSavedPassword")}
                onClick={() => handleDeleteSavedPassword(selectedPasswordId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <Input
        id={id}
        type="password"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => {
          onChange(event.target.value);
          setSelectedPasswordId("");
        }}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={savePassword}
          onChange={(event) => onSavePasswordChange(event.target.checked)}
        />
        {t("savedPassword.saveForLater")}
      </label>

      {savePassword && (
        <Input
          id={`${id}-name`}
          value={passwordName}
          onChange={(event) => onPasswordNameChange(event.target.value)}
          placeholder={t("savedPassword.namePlaceholder")}
        />
      )}
    </div>
  );
}
