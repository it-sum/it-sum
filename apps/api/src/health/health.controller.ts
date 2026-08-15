import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthResponseSchema, type HealthResponse } from "@it-sum/shared";
import { Public } from "../auth/auth.decorators.js";
import { Inject } from "@nestjs/common";
import type { Environment } from "../config/env.js";
import { ENVIRONMENT } from "../config/tokens.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(@Inject(ENVIRONMENT) private readonly environment: Environment) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Return API liveness" })
  getHealth(): HealthResponse {
    const response = {
      status: "ok" as const,
      service: "it-sum-api",
      version: this.environment.SERVICE_VERSION,
      timestamp: new Date().toISOString(),
    };
    return HealthResponseSchema.parse(response);
  }
}
