import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GeminiService } from '../../ai/gemini.service';

describe('GeminiService', () => {
  const originalEnv = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_API_BASE_URL =
      'https://generativelanguage.googleapis.com';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('throws when API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const svc = new GeminiService();
    await expect(svc.generateText('hi')).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('returns text and usage from a successful response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Hello world' }],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 1,
          candidatesTokenCount: 2,
          totalTokenCount: 3,
        },
      }),
    });

    const svc = new GeminiService();
    const result = await svc.generateText('ping');

    expect(result.text).toBe('Hello world');
    expect(result.usage?.totalTokenCount).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['x-goog-api-key']).toBe('test-key');
    expect(init.body).toContain('ping');
  });

  it('retries on 429 then succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'ok after retry' }] } }],
        }),
      });

    const svc = new GeminiService();
    const result = await svc.generateText('x');

    expect(result.text).toBe('ok after retry');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws ServiceUnavailableException after repeated 429', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });

    const svc = new GeminiService();
    await expect(svc.generateText('x')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('maps 403 to InternalServerErrorException', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    const svc = new GeminiService();
    await expect(svc.generateText('x')).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when response text is empty', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '   ' }] } }],
      }),
    });

    const svc = new GeminiService();
    await expect(svc.generateText('x')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
