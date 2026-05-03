import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_AI_RATE_LIMIT_KEY } from './decorators/skip-ai-rate-limit.decorator';

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly windowMs = 60_000;
  private readonly limit: number;
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly reflector: Reflector) {
    this.limit = Math.max(
      1,
      parseInt(process.env.AI_RATE_LIMIT_RPM ?? '20', 10),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_AI_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const ip =
      (typeof req.ip === 'string' && req.ip) ||
      req.socket?.remoteAddress ||
      'local';

    const now = Date.now();
    let timestamps = this.hits.get(ip) ?? [];
    timestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (timestamps.length >= this.limit) {
      const oldest = timestamps[0];
      const retryAfter = Math.max(
        1,
        Math.ceil((oldest + this.windowMs - now) / 1000),
      );
      throw new HttpException(
        { message: 'Too many AI requests', retryAfter },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.hits.set(ip, timestamps);
    return true;
  }
}
