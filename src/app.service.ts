import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'GitHub to Google Calendar Sync Service',
      version: '2.0.0',
      description: 'Syncs GitHub issues AND projects from multiple organizations to Google Calendar',
      features: [
        'GitHub Issues sync',
        'GitHub Projects sync (NEW!)',
        'Web UI for project selection',
        'Multi-organization support',
        'Scheduled automatic syncing',
      ],
      endpoints: {
        home: '/',
        health: '/health',
        projects: '/projects - 🆕 Select projects to sync',
        syncIssues: '/sync/manual - Sync issues only',
        syncProjects: '/sync/projects - 🆕 Sync selected projects',
        syncFull: '/sync/full - 🆕 Sync both issues and projects',
        status: '/sync/status',
        auth: '/auth/google',
      },
    };
  }
}


