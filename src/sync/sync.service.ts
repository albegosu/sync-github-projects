import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { GithubService } from '../github/github.service';
import { GithubProjectsService } from '../github/github-projects.service';
import { CalendarService } from '../calendar/calendar.service';
import { ProjectsService } from '../projects/projects.service';
import { GithubIssue } from '../github/interfaces/github.interface';
import { GithubProjectItem } from '../github/interfaces/github-projects.interface';
import { CalendarEvent } from '../calendar/interfaces/calendar.interface';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private syncInProgress = false;
  private lastSyncTime: Date | null = null;
  private lastSyncStats = {
    totalIssues: 0,
    created: 0,
    updated: 0,
    errors: 0,
  };

  constructor(
    private configService: ConfigService,
    private githubService: GithubService,
    private githubProjectsService: GithubProjectsService,
    private calendarService: CalendarService,
    private projectsService: ProjectsService,
  ) {
    const cronSchedule = this.configService.get<string>('SYNC_CRON_SCHEDULE') || '0 */6 * * *';
    this.logger.log(`Sync service initialized with schedule: ${cronSchedule}`);
  }

  /**
   * Scheduled sync job
   * Default: runs every 6 hours
   * Cron pattern: 0 (star)/6 (star) (star) (star)
   * Note: The actual schedule is configured via SYNC_CRON_SCHEDULE env variable
   */
  @Cron('0 */6 * * *', {
    name: 'github-calendar-sync',
  })
  async scheduledSync() {
    this.logger.log('🔄 Scheduled sync triggered');
    await this.performSync();
  }

  /**
   * Manual sync trigger (issues only)
   */
  async manualSync(): Promise<any> {
    this.logger.log('🔄 Manual sync triggered (issues only)');
    return await this.performSync();
  }

  /**
   * Sync GitHub Projects
   */
  async syncProjects(): Promise<any> {
    this.logger.log('🔄 Project sync triggered');
    return await this.performProjectSync();
  }

  /**
   * Full sync (both issues and projects)
   */
  async fullSync(): Promise<any> {
    this.logger.log('🔄 Full sync triggered (issues + projects)');
    
    const issuesResult = await this.performSync();
    const projectsResult = await this.performProjectSync();

    return {
      status: 'success',
      issues: issuesResult,
      projects: projectsResult,
    };
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(): Promise<any> {
    if (this.syncInProgress) {
      this.logger.warn('Sync already in progress, skipping...');
      return { status: 'skipped', reason: 'Sync already in progress' };
    }

    if (!this.calendarService.isAuthenticated()) {
      this.logger.error('Not authenticated with Google Calendar. Please authorize first.');
      return { 
        status: 'error', 
        reason: 'Not authenticated with Google Calendar',
        authUrl: this.calendarService.getAuthUrl(),
      };
    }

    this.syncInProgress = true;
    const startTime = new Date();
    const stats = {
      totalIssues: 0,
      created: 0,
      updated: 0,
      errors: 0,
      duration: 0,
    };

    try {
      this.logger.log('📥 Fetching GitHub issues...');
      const issues = await this.githubService.fetchAllIssues();
      stats.totalIssues = issues.length;

      this.logger.log(`Found ${issues.length} issues to sync`);

      for (const issue of issues) {
        try {
          const calendarEvent = this.transformIssueToEvent(issue);
          const existingEventId = await this.calendarService.findEventByGithubIssueId(issue.id);

          if (existingEventId) {
            await this.calendarService.updateEvent(existingEventId, calendarEvent);
            stats.updated++;
          } else {
            await this.calendarService.createEvent(calendarEvent);
            stats.created++;
          }
        } catch (error) {
          this.logger.error(`Failed to sync issue #${issue.number} from ${issue.repository.fullName}:`, error.message);
          stats.errors++;
        }
      }

      const endTime = new Date();
      stats.duration = endTime.getTime() - startTime.getTime();

      this.lastSyncTime = endTime;
      this.lastSyncStats = stats;

      this.logger.log('✅ Sync completed successfully');
      this.logger.log(`   Total issues: ${stats.totalIssues}`);
      this.logger.log(`   Created: ${stats.created}`);
      this.logger.log(`   Updated: ${stats.updated}`);
      this.logger.log(`   Errors: ${stats.errors}`);
      this.logger.log(`   Duration: ${stats.duration}ms`);

      return {
        status: 'success',
        ...stats,
        completedAt: endTime,
      };
    } catch (error) {
      this.logger.error('Sync failed:', error.message);
      return {
        status: 'error',
        reason: error.message,
        ...stats,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Transform GitHub issue to Calendar event
   */
  private transformIssueToEvent(issue: GithubIssue): CalendarEvent {
    // Determine event dates
    const start = this.determineEventStart(issue);
    const end = this.determineEventEnd(issue, start);

    // Build description with rich information
    const description = this.buildEventDescription(issue);

    // Determine color based on labels
    const colorId = this.determineEventColor(issue);

    return {
      summary: `[${issue.repository.name}] ${issue.title}`,
      description,
      start,
      end,
      githubIssueId: issue.id,
      githubUrl: issue.url,
      githubRepo: issue.repository.fullName,
      colorId,
      reminders: [
        { method: 'popup', minutes: 30 },
      ],
    };
  }

  /**
   * Determine event start time
   * Priority: Milestone due date > Updated date > Created date
   */
  private determineEventStart(issue: GithubIssue): any {
    if (issue.milestone?.dueOn) {
      const dueDate = new Date(issue.milestone.dueOn);
      return {
        date: dueDate.toISOString().split('T')[0],
      };
    }

    // For issues without due dates, use updated date as a reference
    const startDate = issue.updatedAt;
    return {
      dateTime: startDate.toISOString(),
      timeZone: 'UTC',
    };
  }

  /**
   * Determine event end time
   */
  private determineEventEnd(issue: GithubIssue, start: any): any {
    if (start.date) {
      // All-day events
      const endDate = new Date(start.date);
      endDate.setDate(endDate.getDate() + 1);
      return {
        date: endDate.toISOString().split('T')[0],
      };
    }

    // Timed events - add 1 hour
    const endTime = new Date(start.dateTime);
    endTime.setHours(endTime.getHours() + 1);
    return {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC',
    };
  }

  /**
   * Build rich event description
   */
  private buildEventDescription(issue: GithubIssue): string {
    const parts = [];

    parts.push(`📌 Issue #${issue.number} from ${issue.repository.fullName}`);
    parts.push('');
    
    if (issue.body) {
      // Truncate long descriptions
      const truncatedBody = issue.body.length > 500 
        ? issue.body.substring(0, 500) + '...' 
        : issue.body;
      parts.push(truncatedBody);
      parts.push('');
    }

    parts.push(`🔗 ${issue.url}`);
    parts.push('');

    if (issue.assignees.length > 0) {
      parts.push(`👤 Assignees: ${issue.assignees.join(', ')}`);
    }

    if (issue.labels.length > 0) {
      parts.push(`🏷️ Labels: ${issue.labels.map(l => l.name).join(', ')}`);
    }

    if (issue.milestone) {
      parts.push(`🎯 Milestone: ${issue.milestone.title}`);
      if (issue.milestone.dueOn) {
        parts.push(`⏰ Due: ${new Date(issue.milestone.dueOn).toLocaleDateString()}`);
      }
    }

    parts.push('');
    parts.push(`📅 Created: ${issue.createdAt.toLocaleString()}`);
    parts.push(`🔄 Updated: ${issue.updatedAt.toLocaleString()}`);

    return parts.join('\n');
  }

  /**
   * Determine calendar event color based on labels
   * Google Calendar color IDs:
   * 1: Lavender, 2: Sage, 3: Grape, 4: Flamingo, 5: Banana,
   * 6: Tangerine, 7: Peacock, 8: Graphite, 9: Blueberry, 10: Basil, 11: Tomato
   */
  private determineEventColor(issue: GithubIssue): string {
    const labelNames = issue.labels.map(l => l.name.toLowerCase());

    // Priority/severity colors
    if (labelNames.some(l => l.includes('critical') || l.includes('urgent'))) {
      return '11'; // Tomato (red)
    }
    if (labelNames.some(l => l.includes('bug'))) {
      return '11'; // Tomato (red)
    }
    if (labelNames.some(l => l.includes('feature'))) {
      return '9'; // Blueberry (blue)
    }
    if (labelNames.some(l => l.includes('enhancement'))) {
      return '10'; // Basil (green)
    }
    if (labelNames.some(l => l.includes('documentation'))) {
      return '7'; // Peacock (teal)
    }
    if (labelNames.some(l => l.includes('question'))) {
      return '5'; // Banana (yellow)
    }

    return '8'; // Graphite (gray) - default
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      lastSyncStats: this.lastSyncStats,
      isAuthenticated: this.calendarService.isAuthenticated(),
    };
  }

  /**
   * Perform project sync
   */
  private async performProjectSync(): Promise<any> {
    if (this.syncInProgress) {
      this.logger.warn('Sync already in progress, skipping...');
      return { status: 'skipped', reason: 'Sync already in progress' };
    }

    if (!this.calendarService.isAuthenticated()) {
      this.logger.error('Not authenticated with Google Calendar. Please authorize first.');
      return { 
        status: 'error', 
        reason: 'Not authenticated with Google Calendar',
        authUrl: this.calendarService.getAuthUrl(),
      };
    }

    this.syncInProgress = true;
    const startTime = new Date();
    const stats = {
      totalItems: 0,
      created: 0,
      updated: 0,
      errors: 0,
      duration: 0,
    };

    try {
      this.logger.log('📥 Fetching selected projects...');
      const selectedProjectIds = this.projectsService.getAllSelectedProjectIds();
      
      if (selectedProjectIds.length === 0) {
        this.logger.warn('No projects selected for syncing');
        return {
          status: 'success',
          message: 'No projects selected. Visit /projects to select projects.',
          ...stats,
        };
      }

      this.logger.log(`Found ${selectedProjectIds.length} selected projects`);

      const items = await this.githubProjectsService.fetchItemsFromProjects(selectedProjectIds);
      stats.totalItems = items.length;

      this.logger.log(`Found ${items.length} items to sync`);

      for (const item of items) {
        try {
          const calendarEvent = this.transformProjectItemToEvent(item);
          const existingEventId = await this.calendarService.findEventByGithubIssueId(item.id);

          if (existingEventId) {
            await this.calendarService.updateEvent(existingEventId, calendarEvent);
            stats.updated++;
          } else {
            await this.calendarService.createEvent(calendarEvent);
            stats.created++;
          }
        } catch (error) {
          this.logger.error(`Failed to sync project item ${item.id}:`, error.message);
          stats.errors++;
        }
      }

      const endTime = new Date();
      stats.duration = endTime.getTime() - startTime.getTime();

      this.logger.log('✅ Project sync completed successfully');
      this.logger.log(`   Total items: ${stats.totalItems}`);
      this.logger.log(`   Created: ${stats.created}`);
      this.logger.log(`   Updated: ${stats.updated}`);
      this.logger.log(`   Errors: ${stats.errors}`);
      this.logger.log(`   Duration: ${stats.duration}ms`);

      return {
        status: 'success',
        ...stats,
        completedAt: endTime,
      };
    } catch (error) {
      this.logger.error('Project sync failed:', error.message);
      return {
        status: 'error',
        reason: error.message,
        ...stats,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Transform project item to calendar event
   */
  private transformProjectItemToEvent(item: GithubProjectItem): CalendarEvent {
    const content = item.content;
    
    if (!content) {
      throw new Error('Project item has no content');
    }

    // Determine event dates
    const start = this.determineProjectItemStart(item);
    const end = this.determineProjectItemEnd(item, start);

    // Build description
    const description = this.buildProjectItemDescription(item);

    // Determine color (same logic as issues)
    const colorId = content.labels ? this.determineEventColorFromLabels(content.labels) : '8';

    const prefix = item.type === 'DRAFT_ISSUE' ? '📝' : 
                   item.type === 'PULL_REQUEST' ? '🔀' : '📋';

    return {
      summary: `${prefix} [${item.project.title}] ${content.title}`,
      description,
      start,
      end,
      githubIssueId: item.id,
      githubUrl: content.url,
      githubRepo: item.project.title,
      colorId,
      reminders: [
        { method: 'popup', minutes: 30 },
      ],
    };
  }

  /**
   * Determine project item start date
   * Priority: Meeting Date > Target Date > Updated Date
   */
  private determineProjectItemStart(item: GithubProjectItem): any {
    const content = item.content;
    const fieldValues = item.fieldValues || {};
    
    // Priority 1: Meeting Date
    if (fieldValues['Meeting Date']) {
      const meetingDate = new Date(fieldValues['Meeting Date']);
      this.logger.log(`Using Meeting Date for ${content.title}: ${fieldValues['Meeting Date']}`);
      return {
        date: meetingDate.toISOString().split('T')[0],
      };
    }
    
    // Priority 2: Target Date
    if (fieldValues['Target Date']) {
      const targetDate = new Date(fieldValues['Target Date']);
      this.logger.log(`Using Target Date for ${content.title}: ${fieldValues['Target Date']}`);
      return {
        date: targetDate.toISOString().split('T')[0],
      };
    }

    // Priority 3: Updated Date (fallback)
    this.logger.log(`Using Updated Date for ${content.title}: ${content.updatedAt}`);
    const startDate = new Date(content.updatedAt);
    return {
      dateTime: startDate.toISOString(),
      timeZone: 'UTC',
    };
  }

  /**
   * Determine project item end date
   */
  private determineProjectItemEnd(item: GithubProjectItem, start: any): any {
    if (start.date) {
      const endDate = new Date(start.date);
      endDate.setDate(endDate.getDate() + 1);
      return {
        date: endDate.toISOString().split('T')[0],
      };
    }

    const endTime = new Date(start.dateTime);
    endTime.setHours(endTime.getHours() + 1);
    return {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC',
    };
  }

  /**
   * Build project item description
   */
  private buildProjectItemDescription(item: GithubProjectItem): string {
    const content = item.content;
    const parts = [];

    const typeLabel = item.type === 'DRAFT_ISSUE' ? 'Draft Issue' :
                      item.type === 'PULL_REQUEST' ? 'Pull Request' : 'Issue';

    parts.push(`📋 ${typeLabel} from project: ${item.project.title}`);
    parts.push('');
    
    if (content.body) {
      const truncatedBody = content.body.length > 500 
        ? content.body.substring(0, 500) + '...' 
        : content.body;
      parts.push(truncatedBody);
      parts.push('');
    }

    parts.push(`🔗 ${content.url}`);
    parts.push('');

    if (content.assignees && content.assignees.length > 0) {
      parts.push(`👤 Assignees: ${content.assignees.join(', ')}`);
    }

    if (content.labels && content.labels.length > 0) {
      parts.push(`🏷️ Labels: ${content.labels.map(l => l.name).join(', ')}`);
    }

    if (item.fieldValues?.status) {
      parts.push(`📊 Status: ${item.fieldValues.status}`);
    }

    if (item.fieldValues?.priority) {
      parts.push(`⚡ Priority: ${item.fieldValues.priority}`);
    }

    parts.push('');
    parts.push(`📅 Created: ${new Date(content.createdAt).toLocaleString()}`);
    parts.push(`🔄 Updated: ${new Date(content.updatedAt).toLocaleString()}`);

    return parts.join('\n');
  }

  /**
   * Determine color from labels array
   */
  private determineEventColorFromLabels(labels: Array<{name: string; color: string}>): string {
    const labelNames = labels.map(l => l.name.toLowerCase());

    if (labelNames.some(l => l.includes('critical') || l.includes('urgent'))) {
      return '11'; // Tomato (red)
    }
    if (labelNames.some(l => l.includes('bug'))) {
      return '11'; // Tomato (red)
    }
    if (labelNames.some(l => l.includes('feature'))) {
      return '9'; // Blueberry (blue)
    }
    if (labelNames.some(l => l.includes('enhancement'))) {
      return '10'; // Basil (green)
    }
    if (labelNames.some(l => l.includes('documentation'))) {
      return '7'; // Peacock (teal)
    }
    if (labelNames.some(l => l.includes('question'))) {
      return '5'; // Banana (yellow)
    }

    return '8'; // Graphite (gray) - default
  }
}

