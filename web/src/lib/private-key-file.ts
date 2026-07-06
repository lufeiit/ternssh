export async function readPrivateKeyFile(file: File): Promise<string> {
  return (await file.text()).trim();
}

export function privateKeyLabelFromFile(file: File): string {
  return file.name.replace(/\.[^.]+$/, "") || file.name;
}
