import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module.js";
import { JwtAuthGuard, RolesGuard, TenantGuard } from "./auth/auth.guards.js";
import { parseEnvironment } from "./config/env.js";

async function bootstrap(): Promise<void> {
  const environment = parseEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(environment.API_PREFIX);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalGuards(
    app.get(JwtAuthGuard),
    app.get(RolesGuard),
    app.get(TenantGuard),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("IT-SUM API")
    .setDescription("Backend API for the bilingual university IT course-summary platform")
    .setVersion(environment.SERVICE_VERSION)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${environment.API_PREFIX}/docs`, app, document);

  await app.listen(environment.PORT);
}

void bootstrap();
