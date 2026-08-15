import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { SignJWT, jwtVerify } from "jose";
import type { Environment } from "../config/env.js";
import { ENVIRONMENT } from "../config/tokens.js";
import type { AuthUser } from "../auth/auth.types.js";

export interface StreamTokenClaims {
  resourceId: string;
  userId: string;
  universityId: string;
}

@Injectable()
export class StreamTokenService {
  private readonly secret: Uint8Array;

  constructor(@Inject(ENVIRONMENT) private readonly environment: Environment) {
    this.secret = new TextEncoder().encode(environment.STREAM_SIGNING_SECRET);
  }

  async issue(resourceId: string, user: AuthUser): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + this.environment.STREAM_TOKEN_TTL_SECONDS * 1000);
    const token = await new SignJWT({
      resourceId,
      userId: user.sub,
      universityId: user.universityId,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(user.sub)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(this.secret);
    return { token, expiresAt };
  }

  async verify(token: string): Promise<StreamTokenClaims> {
    try {
      const { payload } = await jwtVerify(token, this.secret, { algorithms: ["HS256"] });
      if (
        typeof payload.resourceId !== "string" ||
        typeof payload.userId !== "string" ||
        typeof payload.universityId !== "string"
      ) {
        throw new UnauthorizedException("Invalid stream token claims");
      }
      return {
        resourceId: payload.resourceId,
        userId: payload.userId,
        universityId: payload.universityId,
      };
    } catch {
      throw new UnauthorizedException("Invalid or expired stream token");
    }
  }
}
