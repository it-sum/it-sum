import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { TenantClaimsSchema, type Role } from "@it-sum/shared";
import type { Environment } from "../config/env.js";
import { ENVIRONMENT } from "../config/tokens.js";
import type { AuthUser } from "./auth.types.js";

@Injectable()
export class JwksVerifierService {
  private readonly jwks;

  constructor(@Inject(ENVIRONMENT) private readonly environment: Environment) {
    this.jwks = createRemoteJWKSet(new URL(environment.SUPABASE_JWKS_URL));
  }

  async verify(accessToken: string): Promise<AuthUser> {
    if (!accessToken) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      const verifyOptions = {
        audience: "authenticated",
        ...(this.environment.SUPABASE_ISSUER ? { issuer: this.environment.SUPABASE_ISSUER } : {}),
      };
      const { payload } = await jwtVerify(accessToken, this.jwks, verifyOptions);
      const claims = parseClaims(payload);
      return {
        sub: claims.sub,
        universityId: claims.university_id,
        role: claims.role,
        ...(claims.email ? { email: claims.email } : {}),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired bearer token");
    }
  }
}

function parseClaims(payload: JWTPayload): {
  sub: string;
  university_id: string;
  role: Role;
  email?: string;
} {
  const parsed = TenantClaimsSchema.safeParse({
    sub: payload.sub,
    university_id: payload["university_id"],
    role: payload["role"],
    email: payload["email"],
  });
  if (!parsed.success) {
    throw new UnauthorizedException("JWT is missing required tenant claims");
  }
  const { email, ...claims } = parsed.data;
  return email === undefined ? claims : { ...claims, email };
}
