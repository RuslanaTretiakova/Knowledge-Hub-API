import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AiRateLimitGuard } from '../../ai/ai-rate-limit.guard';
import { SKIP_AI_RATE_LIMIT_KEY } from '../../ai/decorators/skip-ai-rate-limit.decorator';

describe('AiRateLimitGuard', () => {
  const originalEnv = process.env.AI_RATE_LIMIT_RPM;

  beforeEach(() => {
    process.env.AI_RATE_LIMIT_RPM = '2';
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.AI_RATE_LIMIT_RPM;
    else process.env.AI_RATE_LIMIT_RPM = originalEnv;
  });

  it('allows requests under limit', () => {
    const reflector = new Reflector();
    const guard = new AiRateLimitGuard(reflector);
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: '1.1.1.1', socket: {} }),
      }),
      getHandler: () => vi.fn(),
      getClass: () => vi.fn(),
    };
    expect(guard.canActivate(ctx as any)).toBe(true);
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('blocks when limit exceeded and carries retryAfter', () => {
    const reflector = new Reflector();
    const guard = new AiRateLimitGuard(reflector);
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: '2.2.2.2', socket: {} }),
      }),
      getHandler: () => vi.fn(),
      getClass: () => vi.fn(),
    };
    expect(guard.canActivate(ctx as any)).toBe(true);
    expect(guard.canActivate(ctx as any)).toBe(true);
    try {
      guard.canActivate(ctx as any);
      expect.fail('expected HttpException');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      const res = (e as HttpException).getResponse() as {
        retryAfter?: number;
      };
      expect(res.retryAfter).toBeGreaterThan(0);
    }
  });

  it('skips when handler marked SkipAiRateLimit', () => {
    const reflector = new Reflector();
    const handler = (): void => undefined;
    Reflect.defineMetadata(SKIP_AI_RATE_LIMIT_KEY, true, handler);
    const guard = new AiRateLimitGuard(reflector);
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: '3.3.3.3', socket: {} }),
      }),
      getHandler: () => handler,
      getClass: () => vi.fn(),
    };
    for (let i = 0; i < 5; i++) {
      expect(guard.canActivate(ctx as any)).toBe(true);
    }
  });
});
