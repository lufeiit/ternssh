import { useEffect, useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import {
  decodeFileContent,
  isLikelyBinaryContent,
  MAX_SFTP_TEXT_EDIT_SIZE,
  type SftpClient,
} from "@/lib/sftp-client";

interface FileEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: SftpClient | null;
  remotePath: string;
  fileName: string;
  onSaved?: () => void;
}

export function FileEditorDialog({
  open,
  onOpenChange,
  client,
  remotePath,
  fileName,
  onSaved,
}: FileEditorDialogProps) {
  const t = useT();
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [binaryWarning, setBinaryWarning] = useState(false);

  const dirty = content !== originalContent;

  useEffect(() => {
    if (!open || !client) return;

    let cancelled = false;
    setLoading(true);
    setSaving(false);
    setError(null);
    setBinaryWarning(false);
    setContent("");
    setOriginalContent("");

    void (async () => {
      try {
        const bytes = await client.readFileContent(remotePath, {
          maxSize: MAX_SFTP_TEXT_EDIT_SIZE,
        });
        if (cancelled) return;

        if (isLikelyBinaryContent(bytes)) {
          setBinaryWarning(true);
        }

        const text = decodeFileContent(bytes);
        setContent(text);
        setOriginalContent(text);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : t("fileManager.readFileFailed"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, client, remotePath, t]);

  const handleClose = () => {
    if (saving) return;
    if (dirty && !window.confirm(t("fileManager.editDiscardConfirm"))) {
      return;
    }
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!client || saving || loading || !dirty) return;

    setSaving(true);
    setError(null);
    try {
      await client.writeFileContent(remotePath, content);
      setOriginalContent(content);
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("fileManager.saveFileFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
          return;
        }
        onOpenChange(nextOpen);
      }}
      className="flex max-h-[92vh] w-full max-w-6xl flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">
              {t("fileManager.editFile")}
            </h2>
            <p className="truncate font-mono text-xs text-[var(--color-muted-foreground)]">
              {fileName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={loading || saving}
              onClick={handleClose}
            >
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              disabled={loading || saving || !dirty}
              onClick={() => void handleSave()}
            >
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>

        {binaryWarning && (
          <div className="alert-destructive px-3 py-2 text-xs">
            {t("fileManager.binaryWarning")}
          </div>
        )}

        {error && (
          <div className="alert-destructive px-3 py-2 text-xs">{error}</div>
        )}

        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--color-muted-foreground)]">
            {t("fileManager.loadingFile")}
          </div>
        ) : (
          <CodeEditor
            value={content}
            onChange={setContent}
            fileName={fileName}
            readOnly={saving}
            onSave={() => void handleSave()}
            className="min-h-[60vh] rounded-sm border border-[var(--color-border)]"
          />
        )}
      </div>
    </Modal>
  );
}
