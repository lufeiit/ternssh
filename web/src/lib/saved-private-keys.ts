import { api, type SavedPrivateKeyRecord } from "@/lib/api";

export interface SavedPrivateKey {
  id: string;
  name: string;
  content: string;
}

function fromRecord(record: SavedPrivateKeyRecord): SavedPrivateKey {
  return {
    id: record.id,
    name: record.name,
    content: record.value,
  };
}

export async function listSavedPrivateKeys(): Promise<SavedPrivateKey[]> {
  const { keys } = await api.listSavedPrivateKeys();
  return keys.map(fromRecord);
}

export async function savePrivateKey(
  name: string,
  content: string,
): Promise<SavedPrivateKey> {
  const { key } = await api.savePrivateKey({
    name,
    value: content,
  });
  return fromRecord(key);
}

export async function deleteSavedPrivateKey(id: string): Promise<void> {
  await api.deleteSavedPrivateKey(id);
}

export async function maybeSavePrivateKey(
  name: string,
  content: string,
  shouldSave: boolean,
): Promise<void> {
  if (!shouldSave || !content.trim()) return;
  await savePrivateKey(name, content);
}
