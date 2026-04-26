import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  renameSync: vi.fn(),
  appendFileSync: vi.fn(),
}));

import { appendFileSync, existsSync, renameSync, statSync } from 'fs';
import { AppLogger } from '../../common/logger/app-logger.service';

describe('AppLogger', () => {
  let logger: AppLogger;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  const originalLogMax = process.env.LOG_MAX_FILE_SIZE;
  const originalLogLevel = process.env.LOG_LEVEL;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    existsSync.mockReset();
    statSync.mockReset();
    renameSync.mockReset();
    appendFileSync.mockReset();

    process.env.LOG_MAX_FILE_SIZE = '1';
    process.env.LOG_LEVEL = 'verbose';
    process.env.NODE_ENV = 'development';

    existsSync.mockReturnValue(false);
    statSync.mockReturnValue({ size: 0 });

    logger = new AppLogger();
    stdoutSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    stderrSpy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    process.env.LOG_MAX_FILE_SIZE = originalLogMax;
    process.env.LOG_LEVEL = originalLogLevel;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('sanitizes sensitive fields', () => {
    const sanitized = (logger as any).sanitize({
      password: 'secret',
      token: 'abc',
      accessToken: 'def',
      refreshToken: 'ghi',
      login: 'user',
    });

    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.accessToken).toBe('[REDACTED]');
    expect(sanitized.refreshToken).toBe('[REDACTED]');
    expect(sanitized.login).toBe('user');
  });

  it('rotates the log when file exceeds size limit', () => {
    existsSync.mockReturnValue(true);
    statSync.mockReturnValue({ size: 2048 });

    (logger as any).rotateIfNeeded();

    expect(renameSync).toHaveBeenCalled();
  });

  it('skips rotation when file is below threshold', () => {
    existsSync.mockReturnValue(true);
    statSync.mockReturnValue({ size: 512 });

    (logger as any).rotateIfNeeded();

    expect(renameSync).not.toHaveBeenCalled();
  });

  it('logs requests with sanitized payloads', () => {
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => {});
    existsSync.mockReturnValue(false);

    logger.logRequest(
      'POST',
      '/auth/login',
      { q: 1 },
      { login: 'user', password: 'secret' },
    );

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[REDACTED]'),
      'HTTP',
    );
    logSpy.mockRestore();
  });

  it('logs responses with status summaries', () => {
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => {});
    existsSync.mockReturnValue(false);

    logger.logResponse('GET', '/test', 200, 42);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('← GET /test 200 +42ms'),
      'HTTP',
    );
    logSpy.mockRestore();
  });

  it('writes formatted log entries to disk', () => {
    existsSync.mockReturnValue(false);
    appendFileSync.mockImplementation(() => {});

    logger.log('hello', 'CTX');

    expect(appendFileSync).toHaveBeenCalledWith(
      'app.log',
      expect.stringContaining('[CTX]'),
    );
  });

  it('records error entries and traces', () => {
    existsSync.mockReturnValue(false);
    appendFileSync.mockImplementation(() => {});

    logger.error('boom', 'stack trace', 'ERRORCTX');

    expect(appendFileSync).toHaveBeenNthCalledWith(
      1,
      'app.log',
      expect.stringContaining('boom'),
    );
    expect(appendFileSync).toHaveBeenNthCalledWith(
      2,
      'app.log',
      expect.stringContaining('stack trace'),
    );
  });

  it('warn writes entries when level enabled', () => {
    existsSync.mockReturnValue(false);
    appendFileSync.mockImplementation(() => {});

    logger.warn('warning', 'CTX');

    expect(appendFileSync).toHaveBeenCalledWith(
      'app.log',
      expect.stringContaining('warning'),
    );
  });

  it('debug writes entries when level enabled', () => {
    existsSync.mockReturnValue(false);
    appendFileSync.mockImplementation(() => {});

    logger.debug('details', 'CTX');

    expect(appendFileSync).toHaveBeenCalledWith(
      'app.log',
      expect.stringContaining('details'),
    );
  });

  it('verbose writes entries when level enabled', () => {
    existsSync.mockReturnValue(false);
    appendFileSync.mockImplementation(() => {});

    logger.verbose('info', 'CTX');

    expect(appendFileSync).toHaveBeenCalledWith(
      'app.log',
      expect.stringContaining('info'),
    );
  });
});
