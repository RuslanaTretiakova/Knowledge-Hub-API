import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { finalize, Observable } from 'rxjs';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, query, body } = req;
    const now = Date.now();

    this.logger.logRequest(method, url, query, body);

    return next.handle().pipe(
      finalize(() => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - now;
        this.logger.logResponse(method, url, res.statusCode, duration);
      }),
    );
  }
}
