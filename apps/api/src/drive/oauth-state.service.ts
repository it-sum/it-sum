import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { SignJWT, jwtVerify } from "jose";
import type { Environment } from "../config/env.js";
import { ENVIRONMENT } from "../config/tokens.js";

interface OAuthStateClaims {
  userId: string;
  universityId: string;
}

@Injectable()
export class OAuthStateService {
  private readonly secret: Uint8Array;

  constructor(@Inject(ENVIRONMENT) environment: Environment) {
    this.secret = new TextEncoder().encode(environment.STREAM_SIGNING_SECRET);
  }

  issue(userId: string, universityId: string): Promise<string> {
    return new SignJWT({ userId, universityId, purpose: "drive-oauth" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(this.secret);
  }

  async verify(state: string): Promise<OAuthStateClaims> {
    try {
      const { payload } = await jwtVerify(state, this.secret, { algorithms: ["HS256"] });
      if (
        payload.purpose !== "drive-oauth" ||
        typeof payload.userId !== "string" ||
        typeof payload.universityId !== "string"
      ) {
        throw new UnauthorizedException("Invalid OAuth state");
      }
      return { userId: payload.userId, universityId: payload.universityId };
    } catch {
      throw new UnauthorizedException("Invalid or expired OAuth state");
    }
  }
}
