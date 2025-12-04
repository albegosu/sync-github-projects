import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import { CalendarEvent } from './interfaces/calendar.interface';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private oauth2Client: OAuth2Client;
  private calendar;
  private readonly calendarId: string;
  private readonly tokensPath: string;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    
    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.error('Google OAuth credentials are not properly configured');
      throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are required');
    }

    this.calendarId = this.configService.get<string>('GOOGLE_CALENDAR_ID') || 'primary';
    this.tokensPath = path.join(process.cwd(), 'tokens', 'google-tokens.json');

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    this.loadTokens();
  }

  /**
   * Load saved tokens from file
   */
  private loadTokens() {
    try {
      if (fs.existsSync(this.tokensPath)) {
        const tokens = JSON.parse(fs.readFileSync(this.tokensPath, 'utf-8'));
        this.oauth2Client.setCredentials(tokens);
        this.logger.log('Google OAuth tokens loaded successfully');
      } else {
        this.logger.warn('No saved tokens found. You need to authorize the app first.');
        this.logger.warn('Run the application and visit /auth/google to authorize');
      }
    } catch (error) {
      this.logger.error('Failed to load tokens:', error.message);
    }
  }

  /**
   * Save tokens to file
   */
  private saveTokens(tokens: any) {
    try {
      const tokensDir = path.dirname(this.tokensPath);
      if (!fs.existsSync(tokensDir)) {
        fs.mkdirSync(tokensDir, { recursive: true });
      }
      fs.writeFileSync(this.tokensPath, JSON.stringify(tokens, null, 2));
      this.logger.log('Google OAuth tokens saved successfully');
    } catch (error) {
      this.logger.error('Failed to save tokens:', error.message);
    }
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Handle OAuth callback and save tokens
   */
  async handleOAuthCallback(code: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.saveTokens(tokens);
      this.logger.log('OAuth authorization successful');
    } catch (error) {
      this.logger.error('OAuth callback error:', error.message);
      throw error;
    }
  }

  /**
   * Check if the service is authenticated
   */
  isAuthenticated(): boolean {
    const credentials = this.oauth2Client.credentials;
    return !!(credentials && credentials.access_token);
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: CalendarEvent): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Calendar. Please authorize the app first.');
    }

    try {
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: this.transformToGoogleEvent(event),
      });

      this.logger.log(`Created calendar event: ${event.summary} (ID: ${response.data.id})`);
      return response.data.id;
    } catch (error) {
      this.logger.error(`Failed to create event: ${event.summary}`, error.message);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Calendar. Please authorize the app first.');
    }

    try {
      await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        requestBody: this.transformToGoogleEvent(event),
      });

      this.logger.log(`Updated calendar event: ${event.summary} (ID: ${eventId})`);
    } catch (error) {
      this.logger.error(`Failed to update event ID ${eventId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Calendar. Please authorize the app first.');
    }

    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId,
      });

      this.logger.log(`Deleted calendar event ID: ${eventId}`);
    } catch (error) {
      this.logger.error(`Failed to delete event ID ${eventId}:`, error.message);
      throw error;
    }
  }

  /**
   * Find event by extended property (used to track GitHub issue ID)
   */
  async findEventByGithubIssueId(githubIssueId: string): Promise<string | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        privateExtendedProperty: `githubIssueId=${githubIssueId}`,
        maxResults: 1,
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to find event for GitHub issue ${githubIssueId}:`, error.message);
      return null;
    }
  }

  /**
   * Create or update a calendar event (upsert)
   */
  async upsertEvent(githubIssueId: string, event: CalendarEvent): Promise<void> {
    const existingEventId = await this.findEventByGithubIssueId(githubIssueId);

    if (existingEventId) {
      await this.updateEvent(existingEventId, event);
    } else {
      await this.createEvent(event);
    }
  }

  /**
   * Transform our CalendarEvent to Google Calendar API format
   */
  private transformToGoogleEvent(event: CalendarEvent): any {
    const googleEvent: any = {
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      extendedProperties: {
        private: {
          githubIssueId: event.githubIssueId,
          githubUrl: event.githubUrl,
          githubRepo: event.githubRepo,
        },
      },
    };

    // Add color if specified
    if (event.colorId) {
      googleEvent.colorId = event.colorId;
    }

    // Add reminders
    if (event.reminders && event.reminders.length > 0) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: event.reminders,
      };
    }

    return googleEvent;
  }

  /**
   * List all calendars (useful for debugging)
   */
  async listCalendars(): Promise<any[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Calendar');
    }

    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      this.logger.error('Failed to list calendars:', error.message);
      throw error;
    }
  }
}


