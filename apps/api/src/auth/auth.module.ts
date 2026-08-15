import { Global, Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwksVerifierService } from "./jwks-verifier.service.js";
import { JwtAuthGuard, RolesGuard, TenantGuard } from "./auth.guards.js";

@Global()
@Module({
  providers: [
    Reflector,
    JwksVerifierService,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
  ],
  exports: [JwksVerifierService, JwtAuthGuard, RolesGuard, TenantGuard],
})
export class AuthModule {}
