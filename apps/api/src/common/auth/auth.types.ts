import type { Request } from 'express';
import type { JwtClaims, UserRole, UserStatus } from '@it-sum/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  universityId: string | null;
  claims: JwtClaims;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  correlationId?: string;
}
