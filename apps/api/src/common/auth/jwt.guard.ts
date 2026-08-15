import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { jwtClaimsSchema, type UserRole, type UserStatus } from '@it-sum/shared';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Request } from 'express';
import { getEnv, requireEnv } from '../config/env';
import { IS_PUBLIC_KEY, REQUIRED_ROLES_KEY } from './auth.decorators';
import type { AuthenticatedRequest, AuthenticatedUser } from './auth.types';

const ROLE_VALUES: UserRole[] = ['student', 'admin', 'owner'];
const STATUS_VALUES: UserStatus[] = ['pending', 'active', 'suspended', 'rejected'];

function stringClaim(payload: JWTPayload, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function normalizeUser(payload: JWTPayload): AuthenticatedUser {
  const id = payload.sub;
  const email = typeof payload.email === 'string' ? payload.email : undefined;
  const role = stringClaim(payload, 'app_role', 'role') as UserRole | undefined;
  const status = stringClaim(payload, 'user_status', 'approval_status') as UserStatus | undefined;
  const universityId = stringClaim(payload, 'university_id');

  if (!id || !email || !role || !ROLE_VALUES.includes(role) || !status || !STATUS_VALUES.includes(status)) {
    throw new UnauthorizedException('Token is missing required IT-SUM claims');
  }

  const parsed = jwtClaimsSchema.safeParse({
    ...payload,
    sub: id,
    email,
    role: typeof payload.role === 'string' ? payload.role : role,
    app_role: role,
    university_id: universityId ?? null,
    user_status: status,
    exp: payload.exp,
    iat: payload.iat,
  });

  if (!parsed.success) throw new UnauthorizedException('Token claims failed validation');

  return {
    id,
    email,
    role,
    status,
    universityId: universityId ?? null,
    claims: parsed.data,
  };
}

@Injectable()
export class JwtGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private jwksUrl: string | null = null;

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.readBearerToken(request);
    const payload = await this.verify(token);
    const user = normalizeUser(payload);
    request.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Your account does not have the required role');
    }

    return true;
  }

  private readBearerToken(request: Request): string {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer token required');
    const token = header.slice('Bearer '.length).trim();
    if (token.length < 10) throw new UnauthorizedException('Invalid bearer token');
    return token;
  }

  private async verify(token: string): Promise<JWTPayload> {
    const env = getEnv();
    const url = env.SUPABASE_JWKS_URL ?? `${requireEnv('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`;
    if (this.jwks == null || this.jwksUrl !== url) {
      this.jwks = createRemoteJWKSet(new URL(url));
      this.jwksUrl = url;
    }

    try {
      const verified = await jwtVerify(token, this.jwks, {
        issuer: env.SUPABASE_JWT_ISSUER ?? `${requireEnv('SUPABASE_URL')}/auth/v1`,
        audience: 'authenticated',
      });
      return verified.payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
