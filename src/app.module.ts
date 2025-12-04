import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubModule } from './github/github.module';
import { CalendarModule } from './calendar/calendar.module';
import { SyncModule } from './sync/sync.module';
import { ProjectsModule } from './projects/projects.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuthController } from './sync/sync.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    GithubModule,
    CalendarModule,
    SyncModule,
    ProjectsModule,
    WebhooksModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}

