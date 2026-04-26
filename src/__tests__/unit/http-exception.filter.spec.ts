import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AppLogger } from '../../common/logger/app-logger.service';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../common/errors/custom-errors';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';

const createContext = () => {
  const mockJson = vi.fn();
  const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
  const mockGetResponse = vi.fn().mockReturnValue({ status: mockStatus });
  const mockGetRequest = vi
    .fn()
    .mockReturnValue({ url: '/test', method: 'GET' });

  return {
    context: {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    },
    mockStatus,
    mockJson,
  };
};

const mockLogger: Partial<AppLogger> = {
  error: vi.fn(),
};

describe('HttpExceptionFilter', () => {
  let mockLogger: Partial<AppLogger>;
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    mockLogger = { error: vi.fn() };
    filter = new HttpExceptionFilter(mockLogger as AppLogger);
  });

  it('should handle HttpException with correct status', () => {
    const { context, mockStatus } = createContext();
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, context as any);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should handle HttpException with message object', () => {
    const { context, mockStatus, mockJson } = createContext();
    const exception = new HttpException(
      { message: 'Validation failed', error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, context as any);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST }),
    );
  });

  it('should return correct response shape', () => {
    const { context, mockJson } = createContext();
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, context as any);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
      }),
    );
  });

  it('should handle NotFoundError', () => {
    const { context, mockStatus, mockJson } = createContext();
    const exception = new NotFoundError('resource missing');

    filter.catch(exception, context as any);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'resource missing',
      }),
    );
  });

  it('should handle ValidationError', () => {
    const { context, mockStatus, mockJson } = createContext();
    const exception = new ValidationError('validation failed');

    filter.catch(exception, context as any);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'validation failed',
      }),
    );
  });

  it('should handle UnauthorizedError', () => {
    const { context, mockStatus, mockJson } = createContext();
    const exception = new UnauthorizedError('not allowed');

    filter.catch(exception, context as any);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'not allowed',
      }),
    );
  });

  it('should handle ForbiddenError', () => {
    const { context, mockStatus, mockJson } = createContext();
    const exception = new ForbiddenError('forbidden action');

    filter.catch(exception, context as any);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'forbidden action',
      }),
    );
  });
});
