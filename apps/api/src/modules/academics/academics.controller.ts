import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { AcademicsService } from './academics.service';

@Controller('academics')
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Get('departments')
  departments(@CurrentUser() user: AuthenticatedUser) {
    if (!user.universityId) return [];
    return this.academicsService.listDepartments(user.universityId);
  }

  @Get('departments/:id/tree')
  departmentTree(@Param('id') departmentId: string, @CurrentUser() user: AuthenticatedUser) {
    if (!user.universityId) return null;
    return this.academicsService.getDepartmentTree(departmentId, user.universityId);
  }
}
