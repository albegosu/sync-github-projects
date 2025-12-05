# 🐳 Docker Deployment Guide

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# Make sure .env is configured
cp .env.example .env
# Edit .env with your credentials

# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 📋 Docker Commands Reference

### Building
```bash
# Build image
docker-compose build

# Build without cache (fresh build)
docker-compose build --no-cache

# Build specific service
docker-compose build sync-service
```

### Running
```bash
# Start in background (detached)
docker-compose up -d

# Start and see logs (foreground)
docker-compose up

# Start and rebuild if needed
docker-compose up -d --build
```

### Monitoring
```bash
# Check container status
docker-compose ps

# View logs (all)
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View last 50 lines
docker-compose logs --tail=50

# View logs for specific service
docker-compose logs -f sync-service
```

### Managing
```bash
# Stop containers
docker-compose stop

# Start stopped containers
docker-compose start

# Restart containers
docker-compose restart

# Stop and remove containers
docker-compose down

# Stop, remove containers AND volumes
docker-compose down -v
```

### Debugging
```bash
# Execute command in running container
docker-compose exec sync-service sh

# View container processes
docker-compose top

# Inspect container
docker inspect github-calendar-sync

# Check resource usage
docker stats github-calendar-sync
```

---

## 🔧 Environment Configuration

Your `.env` file is automatically loaded. Make sure you have:

```env
# GitHub
GITHUB_TOKEN=ghp_xxx
GITHUB_ORGANIZATIONS=albegosu

# Google Calendar
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_CALENDAR_ID=primary

# Sync
SYNC_CRON_SCHEDULE=*/10 * * * *

# Webhooks (optional)
GITHUB_WEBHOOK_SECRET=xxx
```

---

## 📁 Volume Mounts

The `tokens/` directory is mounted as a volume:
- **Host**: `./tokens`
- **Container**: `/app/tokens`
- **Purpose**: Persist Google OAuth tokens across container restarts

---

## 🌐 Accessing the App

Once running:
- **Web UI**: http://localhost:3000/projects
- **API**: http://localhost:3000
- **Health**: http://localhost:3000/health

---

## 🔄 Update Process

```bash
# 1. Pull latest code (if from git)
git pull

# 2. Rebuild and restart
docker-compose up -d --build

# 3. Check logs
docker-compose logs -f
```

---

## 🚨 Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs sync-service

# Remove and rebuild
docker-compose down
docker-compose up -d --build
```

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Can't access tokens
```bash
# Check volume mount
docker-compose exec sync-service ls -la /app/tokens

# Check permissions
chmod 755 tokens/
```

### Google auth fails in Docker
```bash
# Make sure GOOGLE_REDIRECT_URI matches
# If using different port, update in .env
```

---

## 🎯 Production Deployment

### Deploy to Cloud

#### Railway
```bash
# Install Railway CLI
npm install -g railway

# Login and deploy
railway login
railway init
railway up
```

#### Fly.io
```bash
# Install flyctl
brew install flyctl

# Login and deploy
fly auth login
fly launch
fly deploy
```

#### Heroku
```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login and deploy
heroku login
heroku container:login
heroku create your-app-name
heroku container:push web
heroku container:release web
```

---

## 🔐 Security Best Practices

1. **Never commit `.env`** - already in `.gitignore`
2. **Use secrets management** in production
3. **Enable HTTPS** for webhooks in production
4. **Rotate tokens regularly**
5. **Use health checks** for monitoring

---

## 📊 Monitoring

### Check health endpoint
```bash
curl http://localhost:3000/health
```

### Check sync status
```bash
curl http://localhost:3000/sync/status
```

### View container stats
```bash
docker stats github-calendar-sync
```

---

## ✅ Next Steps

1. ✅ Configure `.env`
2. ✅ Run `docker-compose up -d`
3. ✅ Visit http://localhost:3000/auth/google to authorize
4. ✅ Check logs: `docker-compose logs -f`
5. ✅ Test sync: `curl -X POST http://localhost:3000/sync/projects`

Your app is now running in Docker! 🎉

