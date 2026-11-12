// Local in-memory / browser file cache for previewing and downloading uploaded files without Firebase Storage
const localBlobMap = new Map<string, { blob: Blob; url: string }>();

export function registerLocalFile(filename: string, file: File): string {
  // If an existing URL exists, revoke it first
  if (localBlobMap.has(filename)) {
    const existing = localBlobMap.get(filename);
    if (existing?.url) URL.revokeObjectURL(existing.url);
  }

  const url = URL.createObjectURL(file);
  localBlobMap.set(filename, { blob: file, url });
  return url;
}

export function getLocalFileUrl(filename: string): string | null {
  return localBlobMap.get(filename)?.url || null;
}

export function removeLocalFile(filename: string) {
  const existing = localBlobMap.get(filename);
  if (existing?.url) {
    URL.revokeObjectURL(existing.url);
    localBlobMap.delete(filename);
  }
}
