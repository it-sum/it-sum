import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { AuthModule } from "./auth/auth.module.js";
import { ENVIRONMENT } from "./config/tokens.js";
import { parseEnvironment } from "./config/env.js";
import { SupabaseService } from "./common/supabase.service.js";
import { HealthController } from "./health/health.controller.js";
import { DriveController } from "./drive/drive.controller.js";
import { DriveService } from "./drive/drive.service.js";
import { DriveTokenCryptoService } from "./drive/token-crypto.service.js";
import { OAuthStateService } from "./drive/oauth-state.service.js";
import { ResourcesController } from "./resources/resources.controller.js";
import { ResourcesService } from "./resources/resources.service.js";
import { StreamTokenService } from "./resources/stream-token.service.js";
import { StreamProxyService } from "./resources/stream-proxy.service.js";

const environment = parseEnvironment();

@Module({
  imports: [
    AuthModule,
    LoggerModule.forRoot({
      pinoHttp: {
        redact: [
          "req.headers.authorization",
          "req.headers.cookie",
          "res.headers['set-cookie']",
          "body.answerKey",
          "body.prompt",
        ],
      },
    }),
  ],
  controllers: [HealthController, DriveController, ResourcesController],
  providers: [
    { provide: ENVIRONMENT, useValue: environment },
    SupabaseService,
    DriveService,
    DriveTokenCryptoService,
    OAuthStateService,
    ResourcesService,
    StreamTokenService,
    StreamProxyService,
  ],
})
export class AppModule {}
