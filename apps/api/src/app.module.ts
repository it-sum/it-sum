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
import { UsersController } from "./users/users.controller.js";
import { AcademicsController } from "./academics/academics.controller.js";
import { VideosController } from "./videos/videos.controller.js";
import { QuizzesController } from "./quizzes/quizzes.controller.js";
import { ProgressController } from "./progress/progress.controller.js";
import { RewardsController } from "./rewards/rewards.controller.js";
import { NotificationsController } from "./notifications/notifications.controller.js";
import { SupportController } from "./support/support.controller.js";
import { AiController } from "./ai/ai.controller.js";

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
  controllers: [
    HealthController,
    DriveController,
    ResourcesController,
    UsersController,
    AcademicsController,
    VideosController,
    QuizzesController,
    ProgressController,
    RewardsController,
    NotificationsController,
    SupportController,
    AiController,
  ],
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
