import { describe, it, expect } from 'vitest';
import { chunkText } from '../../rag/chunking';

describe('chunkText', () => {
  it('splits with overlap in a stable way', () => {
    const text = 'a'.repeat(100);
    const chunks = chunkText(text, 30, 10);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(30);
    expect(chunks.join('')).not.toBe(text);
    expect(chunks[0]).toBe(text.slice(0, 30));
  });

  it('returns one chunk when text is shorter than chunk size', () => {
    expect(chunkText('hello', 800, 200)).toEqual(['hello']);
  });

  it('returns empty array for empty input', () => {
    expect(chunkText('   ', 800, 200)).toEqual([]);
  });
});
