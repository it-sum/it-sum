import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { DriveService } from './drive.service';
import { DriveSyncService } from './drive-sync.service';

@Module({
  controllers: [DriveController],
  providers: [DriveService, DriveSyncService],
  exports: [DriveService, DriveSyncService],
})
export class DriveModule {}
