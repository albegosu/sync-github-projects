# GitHub to Google Calendar Sync

A powerful NestJS-based service that automatically syncs GitHub issues from multiple organizations and repositories to Google Calendar. Perfect for keeping track of tasks, bugs, and features across all your projects in one centralized calendar.

## 🌟 Features

- **Multi-Organization Support**: Sync issues from multiple GitHub organizations
- **Multi-Repository Support**: Track specific repositories across different owners
- **Smart Filtering**: Filter by labels, assignees, and more
- **Automatic Scheduling**: Configurable cron-based sync intervals
- **Rich Calendar Events**: Issues are transformed into detailed calendar events with:
  - Issue title and description
  - Direct links to GitHub
  - Color coding based on labels
  - Assignee and milestone information
  - Automatic reminders
- **OAuth Authentication**: Secure Google Calendar integration
- **Update Detection**: Automatically updates existing calendar events when issues change
- **GraphQL API**: Efficient data fetching using GitHub's GraphQL API

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- A GitHub account with a Personal Access Token
- A Google Cloud Project with Calendar API enabled
- Google OAuth 2.0 credentials

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd sync-github-projects
npm install
```

### 2. GitHub Setup

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name
4. Select scopes:
   - `repo` (Full control of private repositories)
   - `read:org` (Read org and team membership)
5. Copy the generated token

### 3. Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback`
   - Copy the Client ID and Client Secret

### 4. Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_ORGANIZATIONS=your-org1,your-org2
GITHUB_REPOSITORIES=owner1/repo1,owner2/repo2

# Optional Filters
GITHUB_LABELS=bug,feature,enhancement
GITHUB_ASSIGNEES=yourusername

# Google Calendar Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_CALENDAR_ID=primary

# Sync Configuration
SYNC_CRON_SCHEDULE=0 */6 * * *
# Runs every 6 hours by default

# Application
PORT=3000
NODE_ENV=development
```

### 5. Run the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 6. Authorize Google Calendar

1. Open your browser and go to: `http://localhost:3000/auth/google`
2. Sign in with your Google account
3. Grant calendar access permissions
4. You'll be redirected to a success page

That's it! The sync will now run automatically based on your cron schedule.

## 📊 API Endpoints

### Application Info
```
GET /
```
Returns application information and available endpoints.

### Health Check
```
GET /health
```
Returns service health status.

### Manual Sync
```
POST /sync/manual
```
Triggers an immediate sync operation.

**Response:**
```json
{
  "status": "success",
  "totalIssues": 42,
  "created": 10,
  "updated": 32,
  "errors": 0,
  "duration": 5234,
  "completedAt": "2025-12-03T10:30:00.000Z"
}
```

### Sync Status
```
GET /sync/status
```
Returns current sync status and statistics.

**Response:**
```json
{
  "syncInProgress": false,
  "lastSyncTime": "2025-12-03T10:30:00.000Z",
  "lastSyncStats": {
    "totalIssues": 42,
    "created": 10,
    "updated": 32,
    "errors": 0
  },
  "isAuthenticated": true
}
```

### Google OAuth
```
GET /auth/google
```
Initiates Google OAuth flow.

```
GET /auth/google/callback
```
OAuth callback handler (automatically used during authorization).

## ⚙️ Configuration

### Cron Schedule Examples

The `SYNC_CRON_SCHEDULE` environment variable uses standard cron syntax:

```
# Every hour
0 * * * *

# Every 30 minutes
*/30 * * * *

# Every 6 hours (default)
0 */6 * * *

# Every day at 9 AM
0 9 * * *

# Every Monday at 9 AM
0 9 * * 1

# Every weekday at 9 AM and 5 PM
0 9,17 * * 1-5
```

### Filter Configuration

**Labels**: Only sync issues with specific labels
```env
GITHUB_LABELS=bug,critical,p0
```

**Assignees**: Only sync issues assigned to specific users
```env
GITHUB_ASSIGNEES=alice,bob
```

Leave empty to sync all issues (no filtering).

### Calendar Color Coding

Events are automatically color-coded based on labels:

- 🔴 **Red (Tomato)**: `critical`, `urgent`, `bug`
- 🔵 **Blue (Blueberry)**: `feature`
- 🟢 **Green (Basil)**: `enhancement`
- 🔷 **Teal (Peacock)**: `documentation`
- 🟡 **Yellow (Banana)**: `question`
- ⚫ **Gray (Graphite)**: Default (no specific label)

## 🏗️ Architecture

```
src/
├── app.module.ts          # Main application module
├── main.ts                # Application entry point
├── github/
│   ├── github.service.ts  # GitHub API integration (GraphQL)
│   ├── github.module.ts
│   └── interfaces/
│       └── github.interface.ts
├── calendar/
│   ├── calendar.service.ts  # Google Calendar API integration
│   ├── calendar.module.ts
│   └── interfaces/
│       └── calendar.interface.ts
└── sync/
    ├── sync.service.ts      # Main sync orchestration
    ├── sync.controller.ts   # REST API endpoints
    └── sync.module.ts
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use environment-specific tokens** - Different tokens for dev/prod
3. **Rotate tokens regularly** - GitHub and Google tokens should be rotated
4. **Restrict token permissions** - Only grant necessary scopes
5. **Secure token storage** - Tokens are stored in `tokens/` directory (gitignored)

## 🐛 Troubleshooting

### "Not authenticated with Google Calendar"

**Solution**: Visit `http://localhost:3000/auth/google` to authorize the app.

### "Organization not found or not accessible"

**Solution**: Ensure your GitHub token has `read:org` scope and you're a member of the organization.

### "Rate limit exceeded"

**Solution**: 
- GitHub: Default rate limit is 5,000 requests/hour for authenticated users
- Reduce sync frequency or limit the number of organizations/repos
- Consider using GitHub Apps for higher rate limits

### Sync is not running automatically

**Solution**:
- Verify your `SYNC_CRON_SCHEDULE` syntax
- Check application logs for scheduler errors
- Ensure the application is running continuously

### Calendar events not updating

**Solution**:
- Check sync status at `/sync/status`
- Review application logs for errors
- Verify Google Calendar API quota hasn't been exceeded

## 📈 Performance

- **GraphQL Efficiency**: Fetches all data in optimized batches
- **Duplicate Prevention**: Automatic deduplication of issues
- **Update Detection**: Only modifies changed events
- **Pagination Support**: Handles large numbers of issues automatically
- **Error Resilience**: Individual sync failures don't stop the entire process

## 🚢 Deployment Options

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

### GitHub Actions (Free Scheduled Sync)

Create `.github/workflows/sync.yml`:

```yaml
name: Sync GitHub to Calendar
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Run sync
        env:
          GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
          GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
        run: npm run start:prod
```

### Cloud Platforms

- **Heroku**: Add `Procfile` with `web: npm run start:prod`
- **Railway**: Connect GitHub repo, set env variables
- **Fly.io**: Use `fly launch` with provided Dockerfile
- **AWS ECS/Fargate**: Deploy as containerized service
- **Google Cloud Run**: Deploy with cloud build

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🎯 Roadmap

- [ ] Two-way sync (Calendar → GitHub)
- [ ] Webhook support for instant syncing
- [ ] Web dashboard UI
- [ ] Multiple calendar support
- [ ] Custom field mapping
- [ ] Notification system
- [ ] Analytics and reporting
- [ ] Docker compose setup
- [ ] Terraform/IaC templates

## 💡 Use Cases

- **Project Management**: Keep track of all issues across multiple projects
- **Team Coordination**: Share synced calendar with team members
- **Personal Productivity**: View GitHub tasks alongside other calendar events
- **Sprint Planning**: Visualize milestone due dates
- **Client Updates**: Show project progress in calendar view

## 📞 Support

For issues, questions, or suggestions:
- Open a GitHub Issue
- Check existing documentation
- Review logs for error details

---

**Built with ❤️ using NestJS, GitHub GraphQL API, and Google Calendar API**


