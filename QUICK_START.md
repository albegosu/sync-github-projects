# ⚡ Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- GitHub account with admin access to repos/orgs
- Google account

## 🚀 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
npm install
```

Or use the setup script:

```bash
./scripts/setup.sh
```

### 2. Get GitHub Token (2 min)

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` and `read:org`
4. Copy the token

### 3. Get Google Credentials (2 min)

1. Go to: https://console.cloud.google.com/
2. Create a new project
3. Enable "Google Calendar API"
4. Create OAuth credentials (Web application)
5. Add redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret

### 4. Configure Environment (30 sec)

```bash
cp .env.example .env
```

Edit `.env`:

```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_ORGANIZATIONS=your-org
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
```

### 5. Start & Authorize (1 min)

```bash
# Start the server
npm run start:dev

# In your browser, visit:
# http://localhost:3000/auth/google
```

Click "Allow" to authorize.

### 6. Test It! (30 sec)

```bash
# Trigger a sync
curl -X POST http://localhost:3000/sync/manual

# Check your Google Calendar!
```

## ✅ That's It!

Your GitHub issues are now syncing to Google Calendar!

## 📋 What Happens Next?

- Issues sync automatically every 6 hours
- New issues are added to calendar
- Updated issues are reflected in calendar
- Events include links back to GitHub

## 🔧 Customize

Edit these values in `.env`:

```env
# Sync more frequently (every hour)
SYNC_CRON_SCHEDULE=0 * * * *

# Filter by labels
GITHUB_LABELS=bug,feature

# Filter by assignee
GITHUB_ASSIGNEES=yourusername

# Track specific repos
GITHUB_REPOSITORIES=owner/repo1,owner/repo2
```

## 📚 Need More Help?

- **Setup Issues**: See `SETUP_GUIDE.md`
- **How It Works**: See `ARCHITECTURE.md`
- **Full Documentation**: See `README.md`

## 🎯 Common Commands

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Docker
docker-compose up -d

# Manual sync
curl -X POST http://localhost:3000/sync/manual

# Check status
curl http://localhost:3000/sync/status

# Test setup
./scripts/test-setup.sh
```

## 🐛 Troubleshooting

### "Not authenticated with Google Calendar"
→ Visit: http://localhost:3000/auth/google

### "Organization not found"
→ Check your GitHub token has `read:org` scope

### No issues appearing
→ Check filters in `.env` (remove filters to see all issues)

### Port 3000 in use
→ Change `PORT=3000` to another port in `.env`

## 🎉 Success!

You now have a fully automated GitHub to Google Calendar sync!

---

**Time to setup**: ~5 minutes  
**Cost**: $0 (free to run)  
**Maintenance**: Minimal (token rotation every few months)


