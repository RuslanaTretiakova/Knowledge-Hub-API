import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logFile = 'app.log';
  private readonly maxFileSize: number;
  private readonly isProduction: boolean;
  private readonly logLevel: string;
  private readonly levels = ['error', 'warn', 'log', 'debug', 'verbose'];

  constructor() {
    this.maxFileSize =
      parseInt(process.env.LOG_MAX_FILE_SIZE ?? '1024', 10) * 1024;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = process.env.LOG_LEVEL ?? 'log';
  }

  private isLevelEnabled(level: string): boolean {
    const currentIndex = this.levels.indexOf(this.logLevel);
    const levelIndex = this.levels.indexOf(level);
    return levelIndex <= currentIndex;
  }

  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const sanitized = { ...data };
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
    ];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: string,
  ): string {
    const timestamp = new Date().toISOString();
    if (this.isProduction) {
      return JSON.stringify({ timestamp, level, context, message }) + '\n';
    }
    return `[${timestamp}] [${level.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}\n`;
  }

  private rotateIfNeeded(): void {
    if (!fs.existsSync(this.logFile)) return;
    const stats = fs.statSync(this.logFile);
    if (stats.size >= this.maxFileSize) {
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '');
      const ext = path.extname(this.logFile);
      const base = path.basename(this.logFile, ext);
      const rotated = `${base}-${timestamp}${ext}`;
      fs.renameSync(this.logFile, rotated);
    }
  }

  private writeToFile(formatted: string): void {
    try {
      this.rotateIfNeeded();
      fs.appendFileSync(this.logFile, formatted);
    } catch {
      //
    }
  }

  log(message: string, context?: string): void {
    if (!this.isLevelEnabled('log')) return;
    const formatted = this.formatMessage('log', message, context);
    process.stdout.write(formatted);
    this.writeToFile(formatted);
  }

  error(message: string, trace?: string, context?: string): void {
    if (!this.isLevelEnabled('error')) return;
    const formatted = this.formatMessage('error', message, context);
    process.stderr.write(formatted);
    if (trace) process.stderr.write(trace + '\n');
    this.writeToFile(formatted);
    if (trace) this.writeToFile(trace + '\n');
  }

  warn(message: string, context?: string): void {
    if (!this.isLevelEnabled('warn')) return;
    const formatted = this.formatMessage('warn', message, context);
    process.stdout.write(formatted);
    this.writeToFile(formatted);
  }

  debug(message: string, context?: string): void {
    if (!this.isLevelEnabled('debug')) return;
    const formatted = this.formatMessage('debug', message, context);
    process.stdout.write(formatted);
    this.writeToFile(formatted);
  }

  verbose(message: string, context?: string): void {
    if (!this.isLevelEnabled('verbose')) return;
    const formatted = this.formatMessage('verbose', message, context);
    process.stdout.write(formatted);
    this.writeToFile(formatted);
  }

  logRequest(method: string, url: string, query: any, body: any): void {
    const sanitizedBody = this.sanitize(body);
    const msg = `→ ${method} ${url} query=${JSON.stringify(query)} body=${JSON.stringify(sanitizedBody)}`;
    this.log(msg, 'HTTP');
  }

  logResponse(
    method: string,
    url: string,
    statusCode: number,
    ms: number,
  ): void {
    const msg = `← ${method} ${url} ${statusCode} +${ms}ms`;
    this.log(msg, 'HTTP');
  }
}
