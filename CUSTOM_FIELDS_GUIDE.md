# 🎯 Custom Fields Guide

## Your Custom Date Fields Configuration

The system now uses your GitHub Project custom fields with this priority:

### Date Priority (in order):
1. **Meeting Date** 📅 (highest priority)
2. **Target Date** 🎯 (second priority)
3. **Updated Date** 🔄 (fallback)

---

## ✅ How It Works

### Example Scenarios:

**Task A has:**
- Meeting Date: Dec 10, 2025
- Target Date: Dec 15, 2025
- **Result**: Event appears on **Dec 10** (Meeting Date used)

**Task B has:**
- No Meeting Date
- Target Date: Dec 20, 2025
- **Result**: Event appears on **Dec 20** (Target Date used)

**Task C has:**
- No Meeting Date
- No Target Date
- Last Updated: Dec 5, 2025
- **Result**: Event appears on **Dec 5** (Updated Date used)

---

## 🔄 Automatic Updates

### YES! We're prepared for date changes! ✅

The system **automatically updates** calendar events when:
- ✅ You change Meeting Date
- ✅ You change Target Date
- ✅ You update the task (changes Updated Date)
- ✅ You add a date to a task that didn't have one
- ✅ You remove a date from a task

### How Update Works:

1. **Sync runs** (scheduled or manual)
2. **Fetches all tasks** from GitHub Projects
3. **For each task:**
   - Checks if calendar event already exists (by GitHub task ID)
   - If exists: **UPDATES the event** with new dates/content
   - If new: **CREATES a new event**
4. **Result**: Calendar always matches GitHub!

### Update Detection:

The system stores the GitHub task ID in each calendar event's metadata. This allows it to:
- ✅ Find existing events quickly
- ✅ Update them instead of creating duplicates
- ✅ Preserve event links and reminders
- ✅ Update all fields (title, description, dates, etc.)

---

## 🧪 Testing Your Configuration

### Step 1: Restart Server

```bash
# Stop server (Ctrl+C)
npm run start:dev
```

### Step 2: Sync Your Projects

```bash
curl -X POST http://localhost:3000/sync/projects
```

### Step 3: Check Logs

Watch the terminal output. You'll see which date is being used for each task:

```
Using Meeting Date for BetSolar: 2025-12-10
Using Target Date for Energigante: 2025-12-15
Using Updated Date for Ravenwits: 2025-12-05T14:30:00Z
```

### Step 4: Check Calendar

Open Google Calendar and verify tasks appear on correct dates!

---

## 🔄 Test Updates

### Try This:

1. **Go to your GitHub Project**
2. **Pick a task** that already synced
3. **Change its Meeting Date** to tomorrow
4. **Wait for scheduled sync** (or trigger manually):
   ```bash
   curl -X POST http://localhost:3000/sync/projects
   ```
5. **Check Google Calendar** - the event should move to the new date!

---

## 📊 Field Value Support

The system now supports ALL GitHub Project custom fields:

### Supported Field Types:
- ✅ **Date fields** (Meeting Date, Target Date, Due Date, etc.)
- ✅ **Text fields** (any text custom field)
- ✅ **Single select fields** (Status, Priority, etc.)

### How to Use More Fields:

If you have other custom fields you want to use, they're automatically available!

For example, to use a "Priority" field in descriptions:

**Edit**: `src/sync/sync.service.ts` → `buildProjectItemDescription()`

Add:
```typescript
if (item.fieldValues?.Priority) {
  parts.push(`⚡ Priority: ${item.fieldValues.Priority}`);
}
```

---

## 🎨 Calendar Event Format

### With Meeting Date:
```
📋 [Tasks] BetSolar
Date: Dec 10, 2025 (all-day)
Description: Full task details with link to GitHub
```

### With Target Date:
```
📋 [Tasks] Energigante
Date: Dec 15, 2025 (all-day)
Description: Full task details with link to GitHub
```

### With Only Updated Date:
```
📋 [Tasks] Ravenwits
Date: Dec 5, 2025 at 2:30 PM (1-hour event)
Description: Full task details with link to GitHub
```

---

## 💡 Best Practices

### For Meetings:
- ✅ Set **Meeting Date** for actual meetings
- 📌 Event shows as all-day on that date
- 🔗 Link directly to task for meeting notes

### For Deadlines:
- ✅ Set **Target Date** for project deadlines
- 🎯 Event shows as all-day on deadline
- ⚡ Use Status field to track progress

### For Tasks:
- ✅ Set **Target Date** for when you plan to work on it
- 📅 Helps plan your week
- 🔄 System auto-updates if you reschedule

---

## 🔧 Customization

### Want Different Field Names?

If your fields are named differently (e.g., "Due Date" instead of "Target Date"):

**Edit**: `src/sync/sync.service.ts` → `determineProjectItemStart()`

Change:
```typescript
// Instead of 'Target Date', use your field name:
if (fieldValues['Due Date']) {
  const dueDate = new Date(fieldValues['Due Date']);
  return {
    date: dueDate.toISOString().split('T')[0],
  };
}
```

### Want Different Priority Order?

Reorder the checks in `determineProjectItemStart()`:

```typescript
// Example: Target Date first, then Meeting Date
if (fieldValues['Target Date']) { ... }
if (fieldValues['Meeting Date']) { ... }
```

---

## 🚨 Troubleshooting

### "Field not found" or dates not working?

**Check field names exactly match** in GitHub:
1. Go to your project settings
2. Check **exact spelling** of field names
3. They're **case-sensitive**: "Meeting Date" ≠ "meeting date"

### Tasks not updating?

**Make sure sync is running:**
```bash
# Check sync status
curl http://localhost:3000/sync/status

# Trigger manual sync
curl -X POST http://localhost:3000/sync/projects
```

### Wrong dates appearing?

**Check which date is being used** in logs:
```bash
# Watch terminal output during sync
# Look for "Using Meeting Date..." or "Using Target Date..."
```

---

## 📋 Summary

✅ **Priority**: Meeting Date > Target Date > Updated Date  
✅ **Updates**: Automatic when dates change  
✅ **All Fields**: Supported and accessible  
✅ **Flexible**: Easy to customize  
✅ **Reliable**: No duplicates, proper updates  

Your tasks will now appear exactly where you want them in your calendar! 🎉

---

## 🔗 Related

- **DATE_OPTIONS.md** - Alternative date configurations
- **PROJECTS_GUIDE.md** - Full projects documentation
- **WEBHOOKS_SETUP.md** - Instant sync setup

---

**Need help?** Check the logs during sync to see which dates are being used!

