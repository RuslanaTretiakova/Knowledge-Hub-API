import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new AppLogger();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url, query, body } = req;
    const start = Date.now();

    this.logger.logRequest(method, url, query, body);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.logResponse(method, url, res.statusCode, ms);
      }),
    );
  }
}
