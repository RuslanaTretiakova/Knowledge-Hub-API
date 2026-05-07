import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class AiCacheService {
  private readonly store = new Map<string, CacheEntry<string>>();
  private readonly ttlMs: number;

  constructor() {
    const sec = parseInt(process.env.AI_CACHE_TTL_SEC ?? '300', 10);
    this.ttlMs = Math.max(1, sec) * 1000;
  }

  summarizeKey(
    articleId: string,
    updatedAt: number,
    maxLength: string,
  ): string {
    return `sum:${articleId}:${updatedAt}:${maxLength}`;
  }

  translateKey(
    articleId: string,
    updatedAt: number,
    targetLanguage: string,
    sourceLanguage: string,
  ): string {
    return `tr:${articleId}:${updatedAt}:${targetLanguage}:${sourceLanguage}`;
  }

  get(key: string): string | undefined {
    const row = this.store.get(key);
    if (!row) return undefined;
    if (Date.now() > row.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return row.value;
  }

  set(key: string, value: string): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}
