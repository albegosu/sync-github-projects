import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.webhookSecret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET') || '';
    
    if (!this.webhookSecret) {
      this.logger.warn('GITHUB_WEBHOOK_SECRET not set. Webhook signature verification is disabled!');
      this.logger.warn('Set GITHUB_WEBHOOK_SECRET in .env for production use.');
    }
  }

  /**
   * Verify GitHub webhook signature
   * This ensures the webhook is actually from GitHub
   */
  verifySignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping verification');
      return true; // Allow in development
    }

    if (!signature) {
      this.logger.error('No signature provided in webhook request');
      return false;
    }

    // GitHub sends signature as "sha256=<hash>"
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const bufferSignature = Buffer.from(signature);
    const bufferDigest = Buffer.from(digest);

    if (bufferSignature.length !== bufferDigest.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufferSignature, bufferDigest);
  }

  /**
   * Determine if webhook event should trigger a sync
   */
  shouldTriggerSync(event: string, action?: string): boolean {
    // Project-related events
    const projectEvents = [
      'projects_v2_item', // Project item created/updated/deleted
    ];

    // Issue-related events
    const issueEvents = [
      'issues',           // Issue created/updated/deleted
      'issue_comment',    // Comment added to issue
    ];

    const allEvents = [...projectEvents, ...issueEvents];

    if (!allEvents.includes(event)) {
      return false;
    }

    // For certain events, only trigger on specific actions
    if (event === 'projects_v2_item') {
      return ['created', 'edited', 'deleted', 'converted', 'reordered', 'archived', 'restored'].includes(action || '');
    }

    if (event === 'issues') {
      return ['opened', 'edited', 'deleted', 'closed', 'reopened', 'assigned', 'unassigned', 'labeled', 'unlabeled'].includes(action || '');
    }

    return true;
  }

  /**
   * Extract relevant data from webhook payload
   */
  extractWebhookData(event: string, payload: any): {
    type: 'project' | 'issue';
    action: string;
    itemId?: string;
    projectId?: string;
    issueId?: string;
    repository?: string;
  } {
    const data: any = {
      action: payload.action,
    };

    if (event === 'projects_v2_item') {
      data.type = 'project';
      data.itemId = payload.projects_v2_item?.id;
      data.projectId = payload.projects_v2_item?.project_node_id;
    } else if (event === 'issues') {
      data.type = 'issue';
      data.issueId = payload.issue?.id;
      data.repository = payload.repository?.full_name;
    }

    return data;
  }
}

