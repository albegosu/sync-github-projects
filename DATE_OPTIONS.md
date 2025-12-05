# 📅 Date Configuration Options

## Current Behavior

### Projects Items:
1. **With due date** → All-day event on due date
2. **No due date** → 1-hour event on last update date

### Issues:
1. **With milestone due date** → All-day event on milestone date
2. **No milestone** → 1-hour event on last update date

---

## 🎯 Option 1: Always Use Today (Quick Fix)

To make all tasks appear **today** regardless of GitHub dates:

**Edit**: `src/sync/sync.service.ts`

Find `determineProjectItemStart` (line ~456) and replace with:

```typescript
private determineProjectItemStart(item: GithubProjectItem): any {
  // Always use today's date
  const today = new Date();
  return {
    dateTime: today.toISOString(),
    timeZone: 'UTC',
  };
}
```

**Restart and re-sync:**
```bash
npm run start:dev
curl -X POST http://localhost:3000/sync/projects
```

---

## 🎯 Option 2: Use Created Date

To use when task was **created** instead of updated:

```typescript
private determineProjectItemStart(item: GithubProjectItem): any {
  const content = item.content;
  const startDate = new Date(content.createdAt); // Use created, not updated
  return {
    dateTime: startDate.toISOString(),
    timeZone: 'UTC',
  };
}
```

---

## 🎯 Option 3: Future Dates (Next Week)

To schedule all tasks for **next week**:

```typescript
private determineProjectItemStart(item: GithubProjectItem): any {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7); // 7 days from now
  return {
    dateTime: nextWeek.toISOString(),
    timeZone: 'UTC',
  };
}
```

---

## 🎯 Option 4: Spread Over Next 7 Days

To distribute tasks evenly over the next week:

```typescript
private taskCounter = 0; // Add as class property

private determineProjectItemStart(item: GithubProjectItem): any {
  const today = new Date();
  const daysFromNow = this.taskCounter % 7; // Spread over 7 days
  today.setDate(today.getDate() + daysFromNow);
  this.taskCounter++;
  
  return {
    date: today.toISOString().split('T')[0], // All-day event
  };
}
```

---

## 🎯 Option 5: Use GitHub Project Status

To schedule based on status column:

```typescript
private determineProjectItemStart(item: GithubProjectItem): any {
  const status = item.fieldValues?.status?.toLowerCase() || '';
  const today = new Date();
  
  // Different dates based on status
  if (status.includes('todo')) {
    today.setDate(today.getDate() + 7); // Next week
  } else if (status.includes('in progress')) {
    // Today
  } else if (status.includes('done')) {
    today.setDate(today.getDate() - 7); // Last week
  }
  
  return {
    date: today.toISOString().split('T')[0],
  };
}
```

---

## 🎯 Recommended: Use GitHub Due Dates

**Best practice**: Set due dates in your GitHub Project!

### How to Add Due Date Field:

1. Open your project
2. Click **"+ New field"**
3. Select **"Date"** type
4. Name it **"Due Date"**
5. Set dates on your tasks

The system will automatically use these dates! No code changes needed.

---

## 🔄 After Making Changes

Always restart and re-sync:

```bash
# 1. Stop server (Ctrl+C)

# 2. Start again
npm run start:dev

# 3. Re-sync
curl -X POST http://localhost:3000/sync/projects
```

Old events will be **updated** with new dates!

---

## 📊 Current Logic Summary

| Scenario | Date Used | Event Type |
|----------|-----------|------------|
| Project with due date | Due date | All-day |
| Project without due date | Last updated | 1-hour timed |
| Issue with milestone | Milestone due | All-day |
| Issue without milestone | Last updated | 1-hour timed |

---

## 💡 My Recommendation

1. **Add due dates in GitHub** (best option)
2. **Or use "Always Today" option** (simple fix)
3. **Or use "Spread Over Week" option** (organized view)

Which would you prefer?

