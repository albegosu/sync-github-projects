# 🚀 Projects Quick Start

## Get GitHub Projects Syncing in 3 Steps!

### Step 1: Open Projects UI

```
http://localhost:3000/projects
```

### Step 2: Select Your Projects

1. Enter your GitHub username: `albegosu`
2. Click "Load Projects"
3. Click on projects you want to sync (they'll highlight)

### Step 3: Save & Sync

Click the green **"Save & Sync Selected Projects"** button!

---

## ✅ Done!

Your project items are now in Google Calendar! 🎉

### What Got Synced:
- 📋 All issues from selected projects
- 🔀 All pull requests from selected projects
- 📝 All draft issues from selected projects

### Sync Again Anytime:

```bash
curl -X POST http://localhost:3000/sync/projects
```

---

## 🎯 Next Steps

- Check your Google Calendar
- Try selecting more projects
- Use `/sync/full` to sync both issues AND projects

**Full guide**: See PROJECTS_GUIDE.md
