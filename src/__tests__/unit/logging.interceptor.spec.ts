import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lastValueFrom, of } from 'rxjs';
import { AppLogger } from '../../common/logger/app-logger.service';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

const createContext = (props?: {
  method?: string;
  url?: string;
  query?: Record<string, any>;
  body?: Record<string, any>;
}) => ({
  switchToHttp: vi.fn().mockReturnValue({
    getRequest: vi.fn().mockReturnValue({
      method: props?.method ?? 'GET',
      url: props?.url ?? '/test',
      query: props?.query ?? {},
      body: props?.body ?? {},
    }),
    getResponse: vi.fn().mockReturnValue({ statusCode: 200 }),
  }),
});

const mockNext = {
  handle: vi.fn().mockReturnValue(of({ data: 'test' })),
};

const mockLogger: Partial<AppLogger> = {
  logRequest: vi.fn(),
  logResponse: vi.fn(),
};

describe('LoggingInterceptor', () => {
  const interceptor = new LoggingInterceptor(mockLogger as AppLogger);
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call next.handle()', async () => {
    await lastValueFrom(
      interceptor.intercept(createContext() as any, mockNext as any),
    );
    expect(mockNext.handle).toHaveBeenCalled();
  });

  it('should pass through response data', async () => {
    const data = await lastValueFrom(
      interceptor.intercept(createContext() as any, mockNext as any),
    );
    expect(data).toEqual({ data: 'test' });
  });

  it('should log request and response details', async () => {
    await lastValueFrom(
      interceptor.intercept(createContext() as any, mockNext as any),
    );

    expect(mockLogger.logRequest).toHaveBeenCalledWith('GET', '/test', {}, {});
    expect(mockLogger.logResponse).toHaveBeenCalledWith(
      'GET',
      '/test',
      200,
      expect.any(Number),
    );
  });

  it('should sanitize password in request body', async () => {
    const contextWithPassword = createContext({
      method: 'POST',
      url: '/auth/login',
      body: { login: 'user', password: 'secret' },
    });

    await lastValueFrom(
      interceptor.intercept(contextWithPassword as any, mockNext as any),
    );
  });
});
