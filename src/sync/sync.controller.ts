import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { SyncService } from './sync.service';
import { CalendarService } from '../calendar/calendar.service';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly calendarService: CalendarService,
  ) {}

  /**
   * Trigger manual sync (issues only)
   */
  @Post('manual')
  async manualSync() {
    return await this.syncService.manualSync();
  }

  /**
   * Trigger project sync
   */
  @Post('projects')
  async syncProjects() {
    return await this.syncService.syncProjects();
  }

  /**
   * Trigger full sync (both issues and projects)
   */
  @Post('full')
  async fullSync() {
    return await this.syncService.fullSync();
  }

  /**
   * Get sync status
   */
  @Get('status')
  getStatus() {
    return this.syncService.getSyncStatus();
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Start Google OAuth flow
   */
  @Get('google')
  googleAuth(@Res() res: Response) {
    const authUrl = this.calendarService.getAuthUrl();
    res.redirect(authUrl);
  }

  /**
   * Handle Google OAuth callback
   */
  @Get('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      await this.calendarService.handleOAuthCallback(code);
      res.send(`
        <html>
          <head>
            <title>Authorization Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .card {
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
              }
              .success-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
              }
              h1 {
                color: #2d3748;
                margin-bottom: 1rem;
              }
              p {
                color: #4a5568;
                margin-bottom: 2rem;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 0.75rem 2rem;
                border-radius: 0.5rem;
                text-decoration: none;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="success-icon">✅</div>
              <h1>Authorization Successful!</h1>
              <p>Your Google Calendar has been successfully connected. The sync service is now ready to use.</p>
              <a href="/" class="button">Go to Dashboard</a>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send(`
        <html>
          <head>
            <title>Authorization Failed</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              }
              .card {
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
              }
              .error-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
              }
              h1 {
                color: #2d3748;
                margin-bottom: 1rem;
              }
              p {
                color: #4a5568;
                margin-bottom: 2rem;
              }
              .button {
                display: inline-block;
                background: #f5576c;
                color: white;
                padding: 0.75rem 2rem;
                border-radius: 0.5rem;
                text-decoration: none;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="error-icon">❌</div>
              <h1>Authorization Failed</h1>
              <p>There was an error during authorization: ${error.message}</p>
              <a href="/auth/google" class="button">Try Again</a>
            </div>
          </body>
        </html>
      `);
    }
  }
}


