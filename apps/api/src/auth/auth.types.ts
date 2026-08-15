import type { Role } from "@it-sum/shared";

export interface AuthUser {
  sub: string;
  universityId: string;
  role: Role;
  email?: string;
}

export interface AuthenticatedRequest {
  user?: AuthUser;
  correlationId?: string;
}
