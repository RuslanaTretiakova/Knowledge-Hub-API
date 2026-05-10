import * as dotenv from 'dotenv';
dotenv.config();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app-logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

async function bootstrap() {
  const logger = new AppLogger();
  const app = await NestFactory.create(AppModule, { logger });

  const reflector = app.get(Reflector);
  const loggingInterceptor = new LoggingInterceptor(logger);
  const httpExceptionFilter = new HttpExceptionFilter(logger);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(httpExceptionFilter);
  app.useGlobalInterceptors(loggingInterceptor);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('REST API for Knowledge Hub platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  const port = process.env.PORT ?? 4000;

  let shuttingDown = false;
  const gracefulShutdown = async (source: string, error: unknown) => {
    if (shuttingDown) return;
    shuttingDown = true;
    const trace = error instanceof Error ? error.stack : undefined;
    const message =
      error instanceof Error
        ? `${source} - ${error.message}`
        : `${source} - unexpected shutdown`;

    logger.error(message, trace, 'Process');

    try {
      await app.close();
    } catch (closeError) {
      logger.error(
        'Error while shutting down Nest application',
        closeError instanceof Error ? closeError.stack : undefined,
        'Process',
      );
    } finally {
      process.exit(1);
    }
  };

  process.on('uncaughtException', (error) => {
    void gracefulShutdown('uncaughtException', error);
  });
  process.on('unhandledRejection', (reason) => {
    void gracefulShutdown('unhandledRejection', reason);
  });

  await app.listen(port);

  return app;
}

bootstrap();
