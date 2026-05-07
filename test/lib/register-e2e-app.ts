import 'dotenv/config';
import type { INestApplication } from '@nestjs/common';
import { bootstrapTestApp } from '../test-app';
import { bindE2eHttpServer, resetE2eHttpServer } from './request';

let app: INestApplication | undefined;

export async function startE2eApp(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5433/knowledge_hub?schema=public';
  }
  app = await bootstrapTestApp();
  bindE2eHttpServer(app);
}

export async function stopE2eApp(): Promise<void> {
  if (app) {
    await app.close();
    app = undefined;
  }
  resetE2eHttpServer();
}
