export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number,
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized.length || chunkSize < 1) return [];

  const step = Math.max(1, chunkSize - overlap);
  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += step) {
    chunks.push(normalized.slice(i, i + chunkSize));
    if (i + chunkSize >= normalized.length) break;
  }
  return chunks;
}
