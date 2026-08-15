import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import pino from 'pino';
import { AppModule } from './app.module';
import { corsOrigins, getEnv } from './common/config/env';

const logger = pino({ name: 'it-sum-api' });

async function bootstrap() {
  const env = getEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix(env.API_PREFIX.replace(/^\//, ''));
  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id', 'X-Idempotency-Key'],
  });

  app.use((request: { headers: Record<string, string | string[] | undefined>; correlationId?: string }, response: { setHeader: (key: string, value: string) => void }, next: () => void) => {
    const provided = request.headers['x-correlation-id'];
    const correlationId = typeof provided === 'string' && provided.length <= 100 ? provided : randomUUID();
    request.correlationId = correlationId;
    response.setHeader('X-Correlation-Id', correlationId);
    next();
  });

  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('IT-SUM API')
      .setDescription('Bilingual, tenant-isolated student learning API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(env.PORT, '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, 'API bootstrap failed');
  process.exitCode = 1;
});
