# Architecture Documentation

## System Overview

The GitHub to Google Calendar Sync service is built using NestJS and follows a modular, service-oriented architecture. The system consists of three main modules that work together to fetch, transform, and sync data.

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Calendar Sync                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GitHub     │     │    Sync      │     │   Calendar   │
│   Module     │────▶│   Module     │────▶│   Module     │
└──────────────┘     └──────────────┘     └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GitHub     │     │  Scheduler   │     │   Google     │
│  GraphQL     │     │  (Cron)      │     │   OAuth      │
│    API       │     │              │     │    API       │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Module Breakdown

### 1. GitHub Module (`src/github/`)

**Purpose**: Handles all interactions with the GitHub API.

**Key Components**:
- `GithubService`: Main service for fetching issues
- `github.interface.ts`: TypeScript interfaces for GitHub data

**Features**:
- Uses GitHub GraphQL API for efficient data fetching
- Supports multiple organizations and repositories
- Implements pagination for large datasets
- Applies label and assignee filters
- Deduplicates issues across sources

**Data Flow**:
```
Configuration (.env)
        │
        ▼
GithubService.fetchAllIssues()
        │
        ├─▶ fetchOrganizationIssues()
        │   └─▶ GraphQL query (org repositories)
        │
        └─▶ fetchRepositoryIssues()
            └─▶ GraphQL query (specific repos)
        │
        ▼
Deduplicate & Filter
        │
        ▼
Return GithubIssue[]
```

### 2. Calendar Module (`src/calendar/`)

**Purpose**: Manages Google Calendar integration and OAuth authentication.

**Key Components**:
- `CalendarService`: Handles calendar operations and OAuth
- `calendar.interface.ts`: TypeScript interfaces for calendar events

**Features**:
- OAuth 2.0 authentication flow
- Token storage and refresh
- CRUD operations for calendar events
- Event search by custom properties
- Upsert logic (create or update)

**Data Flow**:
```
OAuth Flow:
  User → /auth/google → Google → /auth/google/callback → Save Tokens

Event Creation:
  CalendarEvent → transformToGoogleEvent() → Google Calendar API → Event ID

Event Update:
  findEventByGithubIssueId() → updateEvent() → Google Calendar API
```

### 3. Sync Module (`src/sync/`)

**Purpose**: Orchestrates the synchronization between GitHub and Google Calendar.

**Key Components**:
- `SyncService`: Main sync logic and scheduling
- `SyncController`: REST API endpoints for manual operations

**Features**:
- Scheduled automatic syncing (cron-based)
- Manual sync triggering
- Status tracking and statistics
- Error handling and reporting
- Issue-to-event transformation

**Sync Flow**:
```
Scheduled/Manual Trigger
        │
        ▼
Check if sync in progress
        │
        ▼
Check Calendar authentication
        │
        ▼
Fetch all GitHub issues
        │
        ▼
For each issue:
    │
    ├─▶ Transform to CalendarEvent
    │   (title, description, dates, colors)
    │
    ├─▶ Check if event exists
    │   (search by GitHub issue ID)
    │
    └─▶ Create or Update event
        │
        ▼
Update statistics
        │
        ▼
Return sync results
```

## Data Models

### GitHub Issue
```typescript
interface GithubIssue {
  id: string;                    // Unique GitHub ID
  number: number;                // Issue number
  title: string;                 // Issue title
  body: string;                  // Description
  url: string;                   // GitHub URL
  state: string;                 // open/closed
  repository: GithubRepository;  // Repo info
  author: string;                // Creator
  assignees: string[];           // Assigned users
  labels: GithubLabel[];         // Issue labels
  milestone: GithubMilestone;    // Milestone info
  createdAt: Date;               // Creation date
  updatedAt: Date;               // Last update
  closedAt: Date | null;         // Close date
}
```

### Calendar Event
```typescript
interface CalendarEvent {
  summary: string;               // Event title
  description: string;           // Event description
  start: {                       // Start time
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {                        // End time
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  githubIssueId: string;        // Link to GitHub
  githubUrl: string;            // GitHub URL
  githubRepo: string;           // Repository name
  colorId?: string;             // Calendar color
  reminders?: CalendarReminder[]; // Reminders
}
```

## Authentication & Security

### GitHub Authentication
- **Method**: Personal Access Token
- **Scopes Required**:
  - `repo`: Access to repositories
  - `read:org`: Read organization data
- **Storage**: Environment variable (`GITHUB_TOKEN`)
- **Usage**: Included in GraphQL API headers

### Google Authentication
- **Method**: OAuth 2.0
- **Flow**: Authorization Code Grant
- **Scopes Required**:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`
- **Storage**: 
  - Credentials in environment variables
  - Tokens in `tokens/google-tokens.json`
- **Refresh**: Automatic token refresh by Google SDK

## Configuration Management

### Environment Variables
```env
# GitHub
GITHUB_TOKEN              # PAT for API access
GITHUB_ORGANIZATIONS      # Comma-separated org names
GITHUB_REPOSITORIES       # Comma-separated owner/repo
GITHUB_LABELS            # Filter: specific labels
GITHUB_ASSIGNEES         # Filter: specific users

# Google Calendar
GOOGLE_CLIENT_ID         # OAuth client ID
GOOGLE_CLIENT_SECRET     # OAuth client secret
GOOGLE_REDIRECT_URI      # OAuth callback URL
GOOGLE_CALENDAR_ID       # Target calendar (default: primary)

# Sync
SYNC_CRON_SCHEDULE       # Cron expression for scheduling

# App
PORT                     # Server port
NODE_ENV                 # Environment (dev/prod)
```

### Configuration Loading
1. `ConfigModule` (NestJS) loads `.env` file
2. `ConfigService` provides type-safe access
3. Each service validates required variables on initialization
4. Missing required config throws errors at startup

## Scheduling

### Cron-Based Scheduling
- **Implementation**: `@nestjs/schedule` module
- **Decorator**: `@Cron()` on `SyncService.scheduledSync()`
- **Default Schedule**: `0 */6 * * *` (every 6 hours)
- **Configurable**: Via `SYNC_CRON_SCHEDULE` environment variable

### Sync Guard
- Only one sync runs at a time
- `syncInProgress` flag prevents concurrent executions
- Manual triggers respect this guard

## Error Handling

### Strategy
- **Per-Issue Errors**: Logged but don't stop sync
- **Authentication Errors**: Abort sync, return auth URL
- **API Errors**: Retry with exponential backoff (handled by SDKs)
- **Validation Errors**: Logged and tracked in stats

### Error Tracking
```typescript
stats = {
  totalIssues: number,  // Total fetched
  created: number,      // Successfully created
  updated: number,      // Successfully updated
  errors: number,       // Failed operations
  duration: number      // Total time in ms
}
```

## API Endpoints

### Public Endpoints
- `GET /` - Application info
- `GET /health` - Health check
- `GET /auth/google` - Start OAuth
- `GET /auth/google/callback` - OAuth callback

### Sync Endpoints
- `POST /sync/manual` - Trigger manual sync
- `GET /sync/status` - Get sync status and stats

## Deployment Considerations

### Stateless Design
- No database required
- State stored in:
  - Google Calendar (as events)
  - Token file (OAuth tokens)
  - Memory (current sync state)

### Scalability
- **Horizontal Scaling**: Not recommended (would cause duplicate syncs)
- **Vertical Scaling**: Single instance handles 100+ repos easily
- **Rate Limits**:
  - GitHub: 5,000 requests/hour (authenticated)
  - Google Calendar: 1,000,000 queries/day (free tier)

### High Availability
- Use process manager (PM2) for auto-restart
- Health check endpoint for monitoring
- Container orchestration (Docker, Kubernetes)

## Performance Optimization

### GitHub API
- **GraphQL**: Fetches all needed data in single query
- **Pagination**: Handles large result sets efficiently
- **Batching**: Fetches 100 repositories/issues per request
- **Filtering**: Server-side filtering by state, updated date

### Google Calendar API
- **Batch Operations**: Not implemented (could be added)
- **Caching**: Not implemented (could cache event IDs)
- **Incremental Sync**: Checks for existing events before creating

### Memory Usage
- Processes issues in single pass (no accumulation)
- Streams not used (dataset size is manageable)
- Token storage is minimal (~2KB)

## Monitoring & Observability

### Logging
- NestJS Logger used throughout
- Log levels: `log`, `warn`, `error`
- Structured logging for important events

### Metrics Available
- Sync success/failure
- Issues processed
- Events created/updated
- Error counts
- Sync duration

### Health Checks
- Application uptime: `GET /health`
- Sync status: `GET /sync/status`
- Authentication status: included in status

## Future Enhancements

### Planned Features
1. **Two-way Sync**: Calendar changes update GitHub
2. **Webhooks**: Real-time sync via GitHub webhooks
3. **Web Dashboard**: UI for configuration and monitoring
4. **Multiple Calendars**: Different calendars for different projects
5. **Database Layer**: Track sync history and changes
6. **Analytics**: Detailed reporting and insights

### Technical Debt
- Add unit tests
- Add integration tests
- Implement caching layer
- Add retry logic with exponential backoff
- Implement batch operations for Calendar API
- Add webhook support for instant sync

## Testing Strategy

### Unit Tests
```bash
npm run test
```
Test individual services and transformations.

### Integration Tests
```bash
npm run test:e2e
```
Test full sync flow with mocked APIs.

### Manual Testing
```bash
# Test sync
curl -X POST http://localhost:3000/sync/manual

# Check status
curl http://localhost:3000/sync/status

# Verify calendar
# Check Google Calendar in browser
```

## Troubleshooting Guide

### Debug Mode
```bash
# Enable detailed logging
NODE_ENV=development npm run start:dev
```

### Common Issues
1. **Rate Limiting**: Reduce sync frequency
2. **Token Expiry**: Re-authorize via `/auth/google`
3. **Missing Issues**: Check filters and token scopes
4. **Duplicate Events**: Clear calendar and re-sync

### Log Analysis
Look for:
- `✅ Sync completed` - Success
- `❌` or `ERROR` - Failures
- Statistics at end of sync

---

This architecture provides a solid foundation for a production-ready sync service while remaining simple enough to understand and modify.


