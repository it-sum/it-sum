import { Module } from '@nestjs/common';
import { DriveModule } from '../drive/drive.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { StreamTicketService } from './stream-ticket.service';

@Module({
  imports: [DriveModule],
  controllers: [LibraryController],
  providers: [LibraryService, StreamTicketService],
  exports: [LibraryService],
})
export class LibraryModule {}
