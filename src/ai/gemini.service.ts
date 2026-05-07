import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { GeminiGenerateResult } from './gemini.types';

const DEFAULT_BASE = 'https://generativelanguage.googleapis.com';
const DEFAULT_MODEL = 'gemini-2.0-flash';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? '';
    this.baseUrl = stripTrailingSlash(
      process.env.GEMINI_API_BASE_URL ?? DEFAULT_BASE,
    );
    this.model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async generateText(userText: string): Promise<GeminiGenerateResult> {
    if (!this.apiKey?.trim()) {
      throw new InternalServerErrorException(
        'Gemini API key is not configured',
      );
    }

    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent`;
    const body = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userText }] }],
    });

    let lastStatus = 0;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body,
          signal: controller.signal,
        });
        clearTimeout(timer);

        lastStatus = response.status;

        if (response.status === 429 || response.status >= 500) {
          if (attempt < MAX_RETRIES) {
            await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
            continue;
          }
          throw new ServiceUnavailableException(
            'Gemini API is busy or unavailable. Try again later.',
          );
        }

        if (response.status === 401 || response.status === 403) {
          throw new InternalServerErrorException(
            'Gemini API authentication failed. Check server configuration.',
          );
        }

        if (!response.ok) {
          let detail = 'Gemini API request failed';
          const errJson = await response.json().catch(() => null);
          if (errJson?.error?.message) detail = errJson.error.message;
          throw new ServiceUnavailableException(detail);
        }

        const payload = await response.json();
        return this.mapResponse(payload);
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof InternalServerErrorException) throw err;
        if (err instanceof ServiceUnavailableException) throw err;

        const name =
          err && typeof err === 'object' && 'name' in err
            ? (err as Error).name
            : '';
        if (name === 'AbortError') {
          if (attempt < MAX_RETRIES) {
            await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
            continue;
          }
          throw new ServiceUnavailableException(
            'Gemini API request timed out. Try again later.',
          );
        }

        if (attempt < MAX_RETRIES && this.isRetryableNetworkError(err)) {
          await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
          continue;
        }

        throw new ServiceUnavailableException(
          'Could not reach Gemini API. Try again later.',
        );
      }
    }

    if (lastStatus === 429) {
      throw new ServiceUnavailableException(
        'Gemini API rate limit exceeded. Try again later.',
      );
    }

    throw new ServiceUnavailableException(
      'Gemini API is unavailable. Try again later.',
    );
  }

  private isRetryableNetworkError(err: unknown): boolean {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as NodeJS.ErrnoException).code)
        : '';
    return (
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND' ||
      code === 'EAI_AGAIN'
    );
  }

  private mapResponse(payload: any): GeminiGenerateResult {
    const textParts =
      payload?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p?.text ?? '')
        .join('') ?? '';

    const usage = payload?.usageMetadata;
    const result: GeminiGenerateResult = {
      text: textParts.trim(),
      usage: usage
        ? {
            promptTokenCount: usage.promptTokenCount,
            candidatesTokenCount: usage.candidatesTokenCount,
            totalTokenCount: usage.totalTokenCount,
          }
        : undefined,
    };

    if (!result.text) {
      throw new ServiceUnavailableException(
        'Gemini returned an empty response. Try again later.',
      );
    }

    return result;
  }
}
