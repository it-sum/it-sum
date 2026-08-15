import { SetMetadata, createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Role } from "@it-sum/shared";
import type { AuthenticatedRequest, AuthUser } from "./auth.types.js";

export const IS_PUBLIC_KEY = "isPublic";
export const ROLES_KEY = "roles";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new Error("CurrentUser used without an authenticated request");
    }
    return request.user;
  },
);
