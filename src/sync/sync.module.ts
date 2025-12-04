import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { GithubModule } from '../github/github.module';
import { CalendarModule } from '../calendar/calendar.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [GithubModule, CalendarModule, ProjectsModule],
  providers: [SyncService],
  controllers: [SyncController],
  exports: [SyncService],
})
export class SyncModule {}


