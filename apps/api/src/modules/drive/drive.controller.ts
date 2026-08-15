import { Controller, Get, Post } from '@nestjs/common';
import { RequireRoles } from '../../common/auth/auth.decorators';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { type DriveService } from './drive.service';
import { type DriveSyncService } from './drive-sync.service';

@Controller('drive')
@RequireRoles('admin', 'owner')
export class DriveController {
  constructor(
    private readonly drive: DriveService,
    private readonly sync: DriveSyncService,
  ) {}

  @Get('health')
  health(@CurrentUser() _user: AuthenticatedUser) {
    return { configured: this.drive.configured, mode: this.drive.mode };
  }

  @Post('sync')
  fullSync(@CurrentUser() _user: AuthenticatedUser) {
    return this.sync.fullSync();
  }

  @Post('sync/delta')
  deltaSync(@CurrentUser() _user: AuthenticatedUser) {
    return this.sync.deltaSync();
  }
}
