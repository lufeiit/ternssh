import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { PrivateKeyField } from "@/components/PrivateKeyField";
import { PasswordField } from "@/components/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n";
import { api, type Server } from "@/lib/api";
import { maybeSavePrivateKey } from "@/lib/saved-private-keys";
import { maybeSavePassword } from "@/lib/saved-passwords";

interface EditServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: Server | null;
  onUpdated: () => Promise<void>;
}

export function EditServerDialog({
  open,
  onOpenChange,
  server,
  onUpdated,
}: EditServerDialogProps) {
  const t = useT();
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");
  const [authType, setAuthType] = useState<"password" | "private_key">(
    "password",
  );
  const [credential, setCredential] = useState("");
  const [saveKey, setSaveKey] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [savePassword, setSavePassword] = useState(false);
  const [passwordName, setPasswordName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !server) return;
    setName(server.name);
    setHost(server.host);
    setPort(String(server.port));
    setUsername(server.username);
    setAuthType(server.auth_type);
    setCredential("");
    setSaveKey(false);
    setKeyName("");
    setSavePassword(false);
    setPasswordName("");
    setError(null);
  }, [open, server]);

  if (!open || !server) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedCredential = credential.trim();
    if (authType !== server.auth_type && !trimmedCredential) {
      setError(t("editServer.credentialRequiredOnAuthChange"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.updateServer(server.id, {
        name,
        host,
        port: Number(port),
        username,
        auth_type: authType,
        ...(trimmedCredential ? { credential: trimmedCredential } : {}),
      });
      if (authType === "private_key" && trimmedCredential) {
        await maybeSavePrivateKey(keyName, trimmedCredential, saveKey);
      } else if (authType === "password" && trimmedCredential) {
        await maybeSavePassword(passwordName, trimmedCredential, savePassword);
      }
      onOpenChange(false);
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("editServer.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal className="max-w-lg" open={open} onOpenChange={onOpenChange}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("editServer.title")}</h2>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          {t("common.close")}
        </Button>
      </div>

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-2">
          <Label htmlFor="edit-name">{t("common.name")}</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 grid gap-2">
            <Label htmlFor="edit-host">{t("addServer.host")}</Label>
            <Input
              id="edit-host"
              value={host}
              onChange={(event) => setHost(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-port">{t("addServer.port")}</Label>
            <Input
              id="edit-port"
              value={port}
              onChange={(event) => setPort(event.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-username">{t("addServer.username")}</Label>
          <Input
            id="edit-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-authType">{t("addServer.authType")}</Label>
          <select
            id="edit-authType"
            className="flex h-9 w-full bg-[var(--color-secondary)] px-3 text-sm"
            value={authType}
            onChange={(event) =>
              setAuthType(event.target.value as "password" | "private_key")
            }
          >
            <option value="password">{t("addServer.password")}</option>
            <option value="private_key">{t("addServer.privateKey")}</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-credential">
            {authType === "password"
              ? t("addServer.password")
              : t("addServer.privateKeyContent")}
          </Label>
          {authType === "password" ? (
            <PasswordField
              id="edit-credential"
              value={credential}
              onChange={setCredential}
              savePassword={savePassword}
              onSavePasswordChange={setSavePassword}
              passwordName={passwordName}
              onPasswordNameChange={setPasswordName}
              placeholder={t("editServer.credentialPlaceholder")}
            />
          ) : (
            <PrivateKeyField
              id="edit-credential"
              value={credential}
              onChange={setCredential}
              saveKey={saveKey}
              onSaveKeyChange={setSaveKey}
              keyName={keyName}
              onKeyNameChange={setKeyName}
              placeholder={t("editServer.credentialPlaceholder")}
            />
          )}
          <p className="text-[11px] text-[var(--color-muted-foreground)]">
            {t("editServer.credentialHint")}
          </p>
        </div>

        {error && (
          <p className="text-sm text-[var(--color-destructive)]">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
