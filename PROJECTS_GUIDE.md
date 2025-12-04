# 🗂️ GitHub Projects Sync Guide

## Overview

This guide explains how to sync **GitHub Projects** (not just issues) to Google Calendar. You can now sync all items from your GitHub Projects including:
- 📋 Issues
- 🔀 Pull Requests  
- 📝 Draft Issues

## 🚀 Quick Start

### 1. Open the Projects UI

Visit the projects selection interface:

```
http://localhost:3000/projects
```

### 2. Load Your Projects

1. Enter your GitHub username or organization (e.g., `albegosu`)
2. Click **"Load Projects"**
3. You'll see all your available GitHub Projects

### 3. Select Projects to Sync

- Click on any project card to select it
- Selected projects will be highlighted
- You can select multiple projects

### 4. Save & Sync

Click the **"Save & Sync Selected Projects"** button at the bottom right.

Your project items will now sync to Google Calendar! 🎉

---

## 📊 What Gets Synced

### From Each Project:
- ✅ All issues in the project
- ✅ All pull requests in the project
- ✅ All draft issues in the project
- ✅ Assignees
- ✅ Labels
- ✅ Status (if available)
- ✅ Priority (if available)
- ✅ Due dates (if available)

### Calendar Event Format:

**Issues**: `📋 [Project Name] Issue Title`  
**Pull Requests**: `🔀 [Project Name] PR Title`  
**Draft Issues**: `📝 [Project Name] Draft Title`

---

## 🔄 Sync Options

### Manual Project Sync

```bash
curl -X POST http://localhost:3000/sync/projects
```

This syncs **only** selected projects.

### Manual Issue Sync (Original)

```bash
curl -X POST http://localhost:3000/sync/manual
```

This syncs **only** issues from repositories/organizations.

### Full Sync (Both)

```bash
curl -X POST http://localhost:3000/sync/full
```

This syncs **both** issues AND projects!

---

## 🎨 Features

### Visual Project Selection
- Beautiful web UI
- Real-time selection
- Project metadata (number, visibility)
- Selection counter

### Smart Syncing
- Detects duplicates (won't create duplicate events)
- Updates existing events when items change
- Color-codes by labels (same as issues)
- Rich descriptions with all details

### Persistent Configuration
- Your project selections are saved
- Survives server restarts
- Stored in `tokens/project-selections.json`

---

## 📋 API Endpoints

### Projects UI
```
GET /projects
```
Opens the visual project selection interface.

### List Projects
```
GET /projects/list?username=albegosu
```
Returns JSON list of all projects for a user/org.

### Save Selection
```
POST /projects/select
Body: {
  "username": "albegosu",
  "projectIds": ["PROJECT_ID_1", "PROJECT_ID_2"]
}
```
Saves which projects to sync.

### Get Selected Projects
```
GET /projects/selected?username=albegosu
```
Returns currently selected projects.

### Sync Projects
```
POST /sync/projects
```
Syncs all selected projects to calendar.

### Full Sync
```
POST /sync/full
```
Syncs both issues and projects.

---

## 🔧 Configuration

### Automatic Syncing

The scheduled sync (every 6 hours by default) will sync **both** issues and projects automatically.

To change the schedule, edit `.env`:

```env
SYNC_CRON_SCHEDULE=0 */6 * * *
```

### Mixed Mode

You can sync:
- ✅ Issues only (from repos/orgs)
- ✅ Projects only (selected projects)
- ✅ Both issues AND projects

All three modes work together seamlessly!

---

## 🎯 Use Cases

### Personal Task Management
- Select your personal projects
- All tasks appear in your calendar
- Track progress visually

### Team Coordination
- Select team projects
- Everyone sees project items in calendar
- Better sprint planning

### Multi-Project Tracking
- Select projects from different orgs
- Unified calendar view
- Cross-project visibility

---

## 🐛 Troubleshooting

### "No projects found"

**Solutions:**
- Make sure you have GitHub Projects (v2)
- Check your GitHub token has proper permissions
- Try both your username and organization name

### "No items synced"

**Solutions:**
- Make sure your projects have items
- Check that items aren't all closed
- Verify Google Calendar is authenticated

### "Projects not loading"

**Solutions:**
- Check your GitHub token is valid
- Ensure token has `read:project` scope
- Check browser console for errors

---

## 🔐 Permissions Required

Your GitHub token needs these scopes:
- `repo` - Access repositories
- `read:org` - Read organization data
- `read:project` - **Read project data** (new!)

If projects aren't loading, you may need to regenerate your token with the `read:project` scope.

---

## 💡 Tips

### Selecting Projects
- Start with 1-2 projects to test
- You can always add more later
- Deselect by clicking again

### Organizing Calendar
- Projects use same color coding as issues
- Filter by project name in calendar
- Use calendar views (day/week/month)

### Performance
- Syncing projects is fast (< 5 seconds for 100 items)
- No impact on issue syncing
- Both can run simultaneously

---

## 📈 What's Next?

Future enhancements:
- [ ] Filter project items by status
- [ ] Custom field mapping
- [ ] Project-specific calendars
- [ ] Roadmap view
- [ ] Milestone integration

---

## 🎉 Summary

You now have **full GitHub Projects integration**!

**What you can do:**
1. ✅ Browse all your GitHub Projects
2. ✅ Select which ones to sync
3. ✅ Sync all project items to calendar
4. ✅ Mix with issue syncing
5. ✅ Beautiful web UI

**How to use:**
1. Visit: http://localhost:3000/projects
2. Select your projects
3. Click "Save & Sync"
4. Check your Google Calendar!

---

**Need help?** Check the main README.md or SETUP_GUIDE.md

