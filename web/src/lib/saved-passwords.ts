import { api, type SavedPasswordRecord } from "@/lib/api";

export interface SavedPassword {
  id: string;
  name: string;
  content: string;
}

function fromRecord(record: SavedPasswordRecord): SavedPassword {
  return {
    id: record.id,
    name: record.name,
    content: record.value,
  };
}

export async function listSavedPasswords(): Promise<SavedPassword[]> {
  const { passwords } = await api.listSavedPasswords();
  return passwords.map(fromRecord);
}

export async function savePassword(
  name: string,
  content: string,
): Promise<SavedPassword> {
  const { password } = await api.savePassword({
    name,
    value: content,
  });
  return fromRecord(password);
}

export async function deleteSavedPassword(id: string): Promise<void> {
  await api.deleteSavedPassword(id);
}

export async function maybeSavePassword(
  name: string,
  content: string,
  shouldSave: boolean,
): Promise<void> {
  if (!shouldSave || !content) return;
  await savePassword(name, content);
}
