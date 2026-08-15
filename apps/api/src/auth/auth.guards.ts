import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { Role } from "@it-sum/shared";
import { IS_PUBLIC_KEY, ROLES_KEY } from "./auth.decorators.js";
import type { AuthenticatedRequest } from "./auth.types.js";
import { JwksVerifierService } from "./jwks-verifier.service.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: JwksVerifierService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest & Request>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer authentication is required");
    }
    request.user = await this.verifier.verify(authorization.slice("Bearer ".length).trim());
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException("Insufficient role for this resource");
    }
    return true;
  }
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest & Request>();
    if (!request.user) {
      throw new UnauthorizedException("Tenant guard requires authentication");
    }

    const candidates = [
      request.headers["x-university-id"],
      request.params.universityId,
      request.query.universityId,
    ].filter((value): value is string => typeof value === "string" && value.length > 0);
    if (candidates.some((candidate) => candidate !== request.user?.universityId)) {
      throw new ForbiddenException("Cross-tenant access is not allowed");
    }
    return true;
  }
}
