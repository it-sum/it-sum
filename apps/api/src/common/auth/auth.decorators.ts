import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@it-sum/shared';

export const IS_PUBLIC_KEY = 'it_sum_is_public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRED_ROLES_KEY = 'it_sum_required_roles';
export const RequireRoles = (...roles: UserRole[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);
