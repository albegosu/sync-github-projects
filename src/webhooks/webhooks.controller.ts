import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { SyncService } from '../sync/sync.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly syncService: SyncService,
  ) {}

  /**
   * GitHub webhook endpoint
   * This endpoint receives events from GitHub when changes occur
   */
  @Post('github')
  @HttpCode(HttpStatus.OK)
  async handleGithubWebhook(
    @Body() payload: any,
    @Headers('x-github-event') event: string,
    @Headers('x-github-delivery') delivery: string,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    this.logger.log(`📨 Received GitHub webhook: ${event} (delivery: ${delivery})`);

    // Verify webhook signature
    const payloadString = JSON.stringify(payload);
    const isValid = this.webhooksService.verifySignature(payloadString, signature);

    if (!isValid) {
      this.logger.error('❌ Invalid webhook signature!');
      throw new BadRequestException('Invalid signature');
    }

    this.logger.log('✅ Webhook signature verified');

    // Check if this event should trigger a sync
    const shouldSync = this.webhooksService.shouldTriggerSync(event, payload.action);

    if (!shouldSync) {
      this.logger.log(`ℹ️  Event ${event}:${payload.action} does not require sync`);
      return {
        status: 'ok',
        message: 'Event received but no sync needed',
        event,
        action: payload.action,
      };
    }

    // Extract webhook data
    const webhookData = this.webhooksService.extractWebhookData(event, payload);
    this.logger.log(`🔄 Triggering sync for ${webhookData.type}: ${webhookData.action}`);

    // Trigger appropriate sync
    let syncResult;
    
    if (webhookData.type === 'project') {
      this.logger.log('🗂️  Syncing projects...');
      syncResult = await this.syncService.syncProjects();
    } else if (webhookData.type === 'issue') {
      this.logger.log('📋 Syncing issues...');
      syncResult = await this.syncService.manualSync();
    } else {
      // Default: full sync
      this.logger.log('🔄 Performing full sync...');
      syncResult = await this.syncService.fullSync();
    }

    this.logger.log(`✅ Webhook sync completed`);

    return {
      status: 'success',
      message: 'Webhook processed and sync triggered',
      event,
      action: payload.action,
      webhookData,
      syncResult,
    };
  }

  /**
   * Webhook health check
   * GitHub sends a ping event when you first set up the webhook
   */
  @Post('github/ping')
  @HttpCode(HttpStatus.OK)
  async handlePing(@Body() payload: any) {
    this.logger.log('🏓 Received GitHub webhook ping');
    return {
      status: 'ok',
      message: 'Webhook endpoint is working!',
      zen: payload.zen,
    };
  }

  /**
   * Test webhook endpoint (for manual testing)
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() body: { type?: 'projects' | 'issues' | 'full' }) {
    this.logger.log('🧪 Test webhook triggered');
    
    const type = body.type || 'full';
    let result;

    switch (type) {
      case 'projects':
        result = await this.syncService.syncProjects();
        break;
      case 'issues':
        result = await this.syncService.manualSync();
        break;
      case 'full':
        result = await this.syncService.fullSync();
        break;
    }

    return {
      status: 'success',
      message: 'Test webhook processed',
      type,
      result,
    };
  }
}

