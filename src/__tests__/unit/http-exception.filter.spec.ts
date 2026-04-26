import { describe, it, expect, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';

const mockJson = vi.fn();
const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = vi.fn().mockReturnValue({ status: mockStatus });
const mockGetRequest = vi.fn().mockReturnValue({ url: '/test', method: 'GET' });

const mockContext = {
  switchToHttp: vi.fn().mockReturnValue({
    getResponse: mockGetResponse,
    getRequest: mockGetRequest,
  }),
};

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('should handle HttpException with correct status', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockContext as any);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should handle HttpException with message object', () => {
    const exception = new HttpException(
      { message: 'Validation failed', error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, mockContext as any);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST }),
    );
  });

  it('should return correct response shape', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockContext as any);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
      }),
    );
  });
});
