import 'dotenv/config';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';

let httpServer: ReturnType<INestApplication['getHttpServer']> | null = null;

export function bindE2eHttpServer(app: INestApplication): void {
  httpServer = app.getHttpServer();
}

export function resetE2eHttpServer(): void {
  httpServer = null;
}

function getAgent(): supertest.SuperTest<supertest.Test> {
  if (!httpServer) {
    throw new Error(
      'E2E HTTP server is not bound. Call startE2eApp() in beforeAll for this spec file.',
    );
  }
  return supertest(
    httpServer,
  ) as unknown as supertest.SuperTest<supertest.Test>;
}

export const request = new Proxy({} as supertest.SuperTest<supertest.Test>, {
  get(_target, prop, receiver) {
    const agent = getAgent();
    const value = Reflect.get(agent as object, prop, receiver);
    return typeof value === 'function' ? value.bind(agent) : value;
  },
});

export default request;
