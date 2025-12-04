# 📚 Project Documentation Index

Welcome to the GitHub to Google Calendar Sync project! This index will help you find the information you need.

## 🚀 Getting Started

Start here if you're new to the project:

1. **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes
2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed step-by-step setup instructions
3. **[README.md](README.md)** - Complete project documentation

## 📖 Documentation Structure

### For Users

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **QUICK_START.md** | Fast setup guide | When you want to get started immediately |
| **SETUP_GUIDE.md** | Detailed setup instructions | When you need help with configuration |
| **README.md** | Full documentation | When you want to understand everything |
| **PROJECT_SUMMARY.md** | High-level overview | When you want to understand complexity |

### For Developers

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **ARCHITECTURE.md** | Technical architecture | When you want to understand how it works |
| **PROJECT_SUMMARY.md** | Complexity assessment | When evaluating the project |
| **src/** | Source code | When you want to customize or extend |

## 📁 Project Structure

```
sync-github-projects/
│
├── 📚 Documentation
│   ├── INDEX.md              ← You are here
│   ├── QUICK_START.md        ← Start here (5 min setup)
│   ├── SETUP_GUIDE.md        ← Detailed setup
│   ├── README.md             ← Full documentation
│   ├── ARCHITECTURE.md       ← Technical details
│   └── PROJECT_SUMMARY.md    ← Complexity overview
│
├── 🔧 Configuration
│   ├── .env.example          ← Environment template
│   ├── package.json          ← Dependencies & scripts
│   ├── tsconfig.json         ← TypeScript config
│   ├── nest-cli.json         ← NestJS config
│   ├── .prettierrc           ← Code formatting
│   ├── .eslintrc.js          ← Linting rules
│   └── .gitignore            ← Git ignore rules
│
├── 🐳 Deployment
│   ├── Dockerfile            ← Docker image
│   ├── docker-compose.yml    ← Docker compose
│   └── .dockerignore         ← Docker ignore
│
├── 🛠️ Scripts
│   ├── setup.sh              ← Automated setup
│   └── test-setup.sh         ← Verify setup
│
└── 💻 Source Code
    └── src/
        ├── main.ts           ← Entry point
        ├── app.module.ts     ← Main module
        ├── app.controller.ts ← App controller
        ├── app.service.ts    ← App service
        │
        ├── github/           ← GitHub integration
        │   ├── github.service.ts
        │   ├── github.module.ts
        │   └── interfaces/
        │
        ├── calendar/         ← Google Calendar integration
        │   ├── calendar.service.ts
        │   ├── calendar.module.ts
        │   └── interfaces/
        │
        └── sync/             ← Sync orchestration
            ├── sync.service.ts
            ├── sync.controller.ts
            └── sync.module.ts
```

## 🎯 Quick Navigation

### I want to...

#### ...get started quickly
→ Read [QUICK_START.md](QUICK_START.md)

#### ...understand the setup process
→ Read [SETUP_GUIDE.md](SETUP_GUIDE.md)

#### ...know how complex this is
→ Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

#### ...understand the architecture
→ Read [ARCHITECTURE.md](ARCHITECTURE.md)

#### ...see all features and API endpoints
→ Read [README.md](README.md)

#### ...customize the sync logic
→ Edit `src/sync/sync.service.ts`

#### ...change event colors
→ Edit `determineEventColor()` in `src/sync/sync.service.ts`

#### ...modify event descriptions
→ Edit `buildEventDescription()` in `src/sync/sync.service.ts`

#### ...add more filters
→ Edit `src/github/github.service.ts`

#### ...change OAuth flow
→ Edit `src/calendar/calendar.service.ts`

#### ...deploy to production
→ See "Deployment" section in [README.md](README.md)

#### ...troubleshoot issues
→ See "Troubleshooting" in [SETUP_GUIDE.md](SETUP_GUIDE.md)

## 🔑 Key Concepts

### GitHub Integration
- Uses **GraphQL API** for efficient data fetching
- Supports **multiple organizations** and **repositories**
- Filters by **labels** and **assignees**
- Automatically **deduplicates** issues

### Google Calendar Integration
- Uses **OAuth 2.0** for authentication
- Creates **rich calendar events** with links
- **Updates existing events** when issues change
- **Color-codes events** based on labels

### Sync Process
- Runs on a **configurable schedule** (cron)
- Can be **triggered manually** via API
- Tracks **sync statistics** and errors
- Handles **partial failures** gracefully

## 📊 Complexity Summary

| Aspect | Level | Details |
|--------|-------|---------|
| **Setup** | ⭐⭐☆☆☆ | 5-30 minutes |
| **Configuration** | ⭐⭐☆☆☆ | Environment variables |
| **Customization** | ⭐⭐⭐☆☆ | Modify service methods |
| **Deployment** | ⭐⭐☆☆☆ | Docker or cloud platform |
| **Maintenance** | ⭐☆☆☆☆ | Token rotation only |

## 🛠️ Common Tasks

### Setup & Installation
```bash
# Quick setup
npm install
cp .env.example .env
# Edit .env with your credentials
npm run start:dev

# Or use automated script
./scripts/setup.sh
```

### Running the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Docker
docker-compose up -d
```

### Testing & Verification
```bash
# Test setup
./scripts/test-setup.sh

# Manual sync
curl -X POST http://localhost:3000/sync/manual

# Check status
curl http://localhost:3000/sync/status
```

### Authorization
```bash
# Start server
npm run start:dev

# Visit in browser
open http://localhost:3000/auth/google
```

## 📞 Support & Help

### Documentation
- All documentation is in markdown files in the root directory
- Each file has a specific purpose (see table above)
- Start with QUICK_START.md for fastest results

### Troubleshooting
- Check [SETUP_GUIDE.md](SETUP_GUIDE.md) troubleshooting section
- Review application logs for errors
- Verify environment variables in `.env`
- Test setup with `./scripts/test-setup.sh`

### Common Issues
1. **Not authenticated** → Visit `/auth/google`
2. **No issues syncing** → Check filters and token scopes
3. **Port in use** → Change `PORT` in `.env`
4. **Rate limiting** → Reduce sync frequency

## 🎓 Learning Path

### Beginner
1. Read QUICK_START.md
2. Follow the 5-minute setup
3. Trigger a manual sync
4. Check your Google Calendar

### Intermediate
1. Read SETUP_GUIDE.md
2. Understand configuration options
3. Customize filters and labels
4. Adjust sync schedule

### Advanced
1. Read ARCHITECTURE.md
2. Understand the code structure
3. Modify sync logic
4. Add custom features
5. Deploy to production

## 🔗 External Resources

### GitHub API
- [GitHub GraphQL API Docs](https://docs.github.com/en/graphql)
- [Personal Access Tokens](https://github.com/settings/tokens)
- [GitHub API Rate Limits](https://docs.github.com/en/rest/rate-limit)

### Google Calendar API
- [Google Calendar API Docs](https://developers.google.com/calendar/api)
- [OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

### NestJS
- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Schedule Module](https://docs.nestjs.com/techniques/task-scheduling)
- [NestJS Config Module](https://docs.nestjs.com/techniques/configuration)

## 📈 Project Stats

- **Total Files**: ~25 files
- **Lines of Code**: ~1,500 lines
- **Dependencies**: 9 production, 18 development
- **Setup Time**: 5-30 minutes
- **Complexity**: Moderate (3/5)
- **Cost**: Free (except hosting)

## 🎉 Quick Commands Reference

```bash
# Setup
npm install                    # Install dependencies
npm run setup                  # Run setup script
npm run test:setup            # Verify setup

# Development
npm run start:dev             # Start dev server
npm run build                 # Build for production
npm run start:prod            # Start production server

# Docker
docker-compose up -d          # Start with Docker
docker-compose logs -f        # View logs
docker-compose down           # Stop containers

# API
curl http://localhost:3000                      # App info
curl http://localhost:3000/health               # Health check
curl -X POST http://localhost:3000/sync/manual  # Manual sync
curl http://localhost:3000/sync/status          # Sync status

# Authorization
open http://localhost:3000/auth/google          # Authorize Google
```

## 📝 Notes

- All sensitive data goes in `.env` (never commit this file)
- OAuth tokens are stored in `tokens/` directory (gitignored)
- Logs are printed to console (use PM2 or Docker for log management)
- The service is stateless (can be restarted anytime)

---

**Need help?** Start with [QUICK_START.md](QUICK_START.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md)

**Want to understand more?** Read [ARCHITECTURE.md](ARCHITECTURE.md) or [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

**Ready to deploy?** See the deployment section in [README.md](README.md)


