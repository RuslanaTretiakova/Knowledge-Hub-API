import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors/custom-errors';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        if (
          statusCode === HttpStatus.TOO_MANY_REQUESTS &&
          'retryAfter' in (res as object)
        ) {
          response.setHeader(
            'Retry-After',
            String((res as { retryAfter: number }).retryAfter),
          );
        }
        const responseMessage = (res as any).message;
        if (Array.isArray(responseMessage)) {
          message = responseMessage.join(', ');
        } else {
          message = responseMessage ?? message;
        }
        error = (res as any).error ?? error;
      }
      error = this.getErrorName(statusCode);
    } else if (exception instanceof NotFoundError) {
      statusCode = exception.statusCode;
      message = exception.message;
      error = this.getErrorName(statusCode);
    } else if (exception instanceof ValidationError) {
      statusCode = exception.statusCode;
      message = exception.message;
      error = this.getErrorName(statusCode);
    } else if (exception instanceof UnauthorizedError) {
      statusCode = exception.statusCode;
      message = exception.message;
      error = this.getErrorName(statusCode);
    } else if (exception instanceof ForbiddenError) {
      statusCode = exception.statusCode;
      message = exception.message;
      error = this.getErrorName(statusCode);
    }

    const trace = exception instanceof Error ? exception.stack : undefined;
    if (trace) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode}`,
        trace,
        HttpExceptionFilter.name,
      );
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
    });
  }

  private getErrorName(statusCode: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return map[statusCode] ?? 'Error';
  }
}
