# Setup Guide

This guide will walk you through setting up the GitHub to Google Calendar sync service from scratch.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get GitHub Personal Access Token

1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `Calendar Sync Token`
4. Select scopes:
   - ✅ `repo` - Full control of private repositories
   - ✅ `read:org` - Read org and team membership
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again)

### 3. Set Up Google Cloud Project

#### Create Project
1. Go to: https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name: `GitHub Calendar Sync`
4. Click "Create"

#### Enable Calendar API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

#### Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: `GitHub Calendar Sync`
   - User support email: your email
   - Developer contact: your email
   - Save and continue through all steps
4. Back to "Create OAuth client ID":
   - Application type: **Web application**
   - Name: `GitHub Calendar Sync`
   - Authorized redirect URIs:
     - Add: `http://localhost:3000/auth/google/callback`
   - Click "Create"
5. **Copy the Client ID and Client Secret**

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Replace with your GitHub token
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Add your organizations (comma-separated)
GITHUB_ORGANIZATIONS=my-company,my-org

# Or add specific repositories
GITHUB_REPOSITORIES=username/repo1,username/repo2

# Optional: Filter by labels
GITHUB_LABELS=bug,feature

# Optional: Filter by assignees
GITHUB_ASSIGNEES=yourusername

# Replace with your Google OAuth credentials
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# Keep these as-is for local development
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_CALENDAR_ID=primary

# Adjust sync frequency (default: every 6 hours)
SYNC_CRON_SCHEDULE=0 */6 * * *

# Port (default: 3000)
PORT=3000
NODE_ENV=development
```

### 5. Start the Application

```bash
npm run start:dev
```

You should see:
```
🚀 Application is running on: http://localhost:3000
🔄 Sync service is scheduled based on SYNC_CRON_SCHEDULE
```

### 6. Authorize Google Calendar

1. Open browser: http://localhost:3000/auth/google
2. Sign in with your Google account
3. Click "Allow" to grant calendar permissions
4. You'll see "Authorization Successful!"

### 7. Trigger Initial Sync

You can either wait for the scheduled sync or trigger it manually:

```bash
curl -X POST http://localhost:3000/sync/manual
```

Or visit: http://localhost:3000/sync/manual in your browser

### 8. Verify It's Working

Check your Google Calendar! You should see events created from your GitHub issues.

Check sync status:
```bash
curl http://localhost:3000/sync/status
```

## Troubleshooting

### "Organization not found or not accessible"

Your GitHub token might not have access to the organization. Make sure:
- You're a member of the organization
- The token has `read:org` scope
- For private repos, the token needs `repo` scope

### "Not authenticated with Google Calendar"

You need to authorize the app first:
1. Visit: http://localhost:3000/auth/google
2. Complete the OAuth flow

### "Invalid credentials"

Double-check your `.env` file:
- GitHub token is correct and not expired
- Google Client ID and Secret are correct
- No extra spaces or quotes in the values

### Calendar Events Not Appearing

Check the sync status:
```bash
curl http://localhost:3000/sync/status
```

View application logs for detailed error messages.

### Port Already in Use

If port 3000 is already in use:
1. Change `PORT=3000` to a different port in `.env`
2. Update the redirect URI in Google Cloud Console
3. Update `GOOGLE_REDIRECT_URI` in `.env`
4. Restart the application

## Testing Your Setup

### Test GitHub Connection
```bash
# This will trigger a manual sync and show results
curl -X POST http://localhost:3000/sync/manual
```

Expected response:
```json
{
  "status": "success",
  "totalIssues": 10,
  "created": 10,
  "updated": 0,
  "errors": 0,
  "duration": 3245,
  "completedAt": "2025-12-03T10:30:00.000Z"
}
```

### Test Calendar Connection
```bash
curl http://localhost:3000/sync/status
```

Expected response:
```json
{
  "syncInProgress": false,
  "lastSyncTime": "2025-12-03T10:30:00.000Z",
  "lastSyncStats": {
    "totalIssues": 10,
    "created": 10,
    "updated": 0,
    "errors": 0
  },
  "isAuthenticated": true
}
```

If `isAuthenticated` is `false`, you need to authorize at `/auth/google`.

## Production Deployment

### Using Docker

```bash
# Build the image
docker build -t github-calendar-sync .

# Run the container
docker run -d \
  --name github-calendar-sync \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/tokens:/app/tokens \
  github-calendar-sync
```

Or use docker-compose:

```bash
docker-compose up -d
```

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/main.js --name github-calendar-sync

# Save PM2 configuration
pm2 save

# Enable auto-start on system boot
pm2 startup
```

## Security Best Practices

1. **Never commit `.env`** - It's already in `.gitignore`
2. **Rotate tokens regularly** - Change GitHub and Google tokens periodically
3. **Use read-only tokens when possible** - The GitHub token only needs read access
4. **Secure the tokens directory** - Make sure `tokens/` is not publicly accessible
5. **Use HTTPS in production** - Always use HTTPS for OAuth callbacks in production

## Next Steps

- Customize the sync logic in `src/sync/sync.service.ts`
- Adjust calendar colors in `determineEventColor()`
- Modify event descriptions in `buildEventDescription()`
- Add more filters or custom logic
- Set up monitoring and alerting
- Deploy to production

## Support

If you run into issues:
1. Check the application logs
2. Review this guide carefully
3. Check GitHub Issues for similar problems
4. Create a new issue with logs and error messages

Happy syncing! 🎉


