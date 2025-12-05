# 🐳 Docker Quick Start

## Run Your App with Docker in 3 Steps!

### Step 1: Make Sure `.env` is Configured

```bash
# Check if .env exists
ls .env

# If not, create it:
cp .env.example .env
nano .env
```

Make sure you have:
```env
GITHUB_TOKEN=ghp_your_token
GITHUB_ORGANIZATIONS=albegosu
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_CALENDAR_ID=your-calendar-id
SYNC_CRON_SCHEDULE=*/10 * * * *
```

### Step 2: Build and Run

```bash
docker-compose up -d
```

That's it! The app is now running in Docker! 🎉

### Step 3: Authorize Google Calendar

```bash
# Open in browser
open http://localhost:3000/auth/google
```

Complete the OAuth flow.

---

## ✅ Verify It's Running

```bash
# Check container status
docker-compose ps

# Should show:
# NAME                    STATUS
# github-calendar-sync    Up X minutes (healthy)
```

```bash
# View logs
docker-compose logs -f

# You should see:
# 🚀 Application is running on: http://localhost:3000
# 🔄 Sync service is scheduled...
```

---

## 🎯 Use the App

### Access Web UI
```
http://localhost:3000/projects
```

### Check Health
```
http://localhost:3000/health
```

### Trigger Sync
```bash
curl -X POST http://localhost:3000/sync/projects
```

---

## 🔄 Managing the Container

### View Logs
```bash
# Follow logs in real-time
docker-compose logs -f

# Last 50 lines
docker-compose logs --tail=50
```

### Restart
```bash
docker-compose restart
```

### Stop
```bash
docker-compose stop
```

### Start Again
```bash
docker-compose start
```

### Stop and Remove
```bash
docker-compose down
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs

# Common issues:
# - Port 3000 already in use
# - Missing .env file
# - Invalid credentials in .env
```

### Can't Access the App

```bash
# Check if container is running
docker-compose ps

# Check if port is mapped correctly
docker-compose port sync-service 3000
```

### Google Auth Fails

Make sure `GOOGLE_REDIRECT_URI` in `.env` is:
```env
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Tokens Not Persisting

```bash
# Check volume mount
docker-compose exec sync-service ls -la /app/tokens

# Should show google-tokens.json
```

---

## 📊 Monitor Your App

### Check Health
```bash
curl http://localhost:3000/health
```

### Check Sync Status
```bash
curl http://localhost:3000/sync/status
```

### View Container Stats
```bash
docker stats github-calendar-sync
```

---

## 🎉 Benefits of Docker

- ✅ **Isolated environment** - No conflicts with other apps
- ✅ **Easy deployment** - Works anywhere Docker runs
- ✅ **Auto-restart** - Container restarts if it crashes
- ✅ **Consistent** - Same environment everywhere
- ✅ **Easy updates** - Just rebuild and restart

---

## 🚀 Production Deployment

### Deploy to Any Cloud Platform

Your Docker setup works on:
- Railway
- Fly.io
- AWS ECS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

Just push your Docker image and set environment variables!

---

## ✅ You're Done!

Your app is now running in Docker with:
- ✅ Automatic syncing every 10 minutes
- ✅ Auto-restart on failure
- ✅ Persistent token storage
- ✅ Health checks
- ✅ Easy management with docker-compose

**No manual intervention needed - it just works!** 🎉

