import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubProjectsService } from './github-projects.service';

@Module({
  providers: [GithubService, GithubProjectsService],
  exports: [GithubService, GithubProjectsService],
})
export class GithubModule {}


