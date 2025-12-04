# 🪝 GitHub Webhooks Setup Guide

## Overview

GitHub webhooks enable **instant synchronization**! When you change a task in GitHub, it automatically syncs to your Google Calendar within seconds.

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Generate Webhook Secret

Create a secure random string for webhook verification:

```bash
# Generate a random secret (32 characters)
openssl rand -hex 32
```

Copy the output (e.g., `abc123def456...`)

### Step 2: Add Secret to `.env`

```bash
# Edit your .env file
nano .env

# Add this line:
GITHUB_WEBHOOK_SECRET=your_generated_secret_here
```

### Step 3: Restart Server

```bash
npm run start:dev
```

### Step 4: Expose Your Local Server (Development)

For local testing, you need to expose your localhost to the internet. Use **ngrok**:

```bash
# Install ngrok (if you don't have it)
# Visit: https://ngrok.com/download

# Run ngrok
ngrok http 3000
```

You'll see something like:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the `https://` URL!** (e.g., `https://abc123.ngrok.io`)

### Step 5: Configure GitHub Webhook

#### For User Projects:

1. Go to: https://github.com/settings/hooks
2. Click **"Add webhook"**
3. Configure:
   - **Payload URL**: `https://abc123.ngrok.io/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Your secret from Step 1
   - **Events**: Select:
     - ✅ Projects v2 items
     - ✅ Issues
     - ✅ Issue comments
4. Click **"Add webhook"**

#### For Organization Projects:

1. Go to: `https://github.com/organizations/YOUR_ORG/settings/hooks`
2. Follow same steps as above

---

## ✅ Test It Works!

### 1. Check Webhook Status

Go back to your webhook settings and you should see:
- ✅ Green checkmark (delivery successful)
- 🏓 Recent ping event

### 2. Test Manually

```bash
# Test the webhook endpoint
curl -X POST http://localhost:3000/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"type": "projects"}'
```

Should return:
```json
{
  "status": "success",
  "message": "Test webhook processed"
}
```

### 3. Test with Real GitHub Change

1. Go to your GitHub project
2. **Edit a task** (change title, status, anything)
3. **Watch your terminal** - you should see:
   ```
   📨 Received GitHub webhook: projects_v2_item
   ✅ Webhook signature verified
   🔄 Triggering sync for project: edited
   ✅ Webhook sync completed
   ```
4. **Check Google Calendar** - the change should appear!

---

## 🎯 What Triggers Auto-Sync?

### Project Events:
- ✅ Task created
- ✅ Task edited
- ✅ Task deleted
- ✅ Task status changed
- ✅ Task moved
- ✅ Task archived/restored

### Issue Events:
- ✅ Issue opened
- ✅ Issue edited
- ✅ Issue closed/reopened
- ✅ Issue assigned/unassigned
- ✅ Labels changed

---

## 🔧 Production Deployment

For production (not localhost), you don't need ngrok:

### Option 1: Deploy to Cloud

Deploy your app to:
- Heroku: `https://your-app.herokuapp.com`
- Railway: `https://your-app.railway.app`
- Fly.io: `https://your-app.fly.dev`

Then use that URL for the webhook:
```
https://your-app.herokuapp.com/webhooks/github
```

### Option 2: Use Your Own Domain

If you have a domain:
```
https://yourdomain.com/webhooks/github
```

---

## 🔐 Security Features

### Webhook Signature Verification

Every webhook is verified using HMAC SHA-256:
- ✅ Ensures webhook is from GitHub
- ✅ Prevents malicious requests
- ✅ Uses timing-safe comparison

### What Happens Without Secret?

If `GITHUB_WEBHOOK_SECRET` is not set:
- ⚠️ Warning logged
- 🔓 Verification skipped (development only)
- ❌ **NOT recommended for production!**

---

## 📊 Monitoring Webhooks

### Check Recent Deliveries

In GitHub webhook settings:
1. Scroll to "Recent Deliveries"
2. Click on any delivery to see:
   - Request payload
   - Response from your server
   - Status code
   - Timing

### Check Your Logs

Your terminal will show:
```
[Nest] 5746  - 10:30:00 PM     LOG [WebhooksController] 📨 Received GitHub webhook: projects_v2_item (delivery: abc-123)
[Nest] 5746  - 10:30:00 PM     LOG [WebhooksController] ✅ Webhook signature verified
[Nest] 5746  - 10:30:00 PM     LOG [WebhooksController] 🔄 Triggering sync for project: edited
[Nest] 5746  - 10:30:02 PM     LOG [SyncService] ✅ Project sync completed successfully
```

---

## 🐛 Troubleshooting

### "Invalid signature" Error

**Cause**: Secret mismatch

**Solution**:
1. Check your `.env` has correct secret
2. Check GitHub webhook has same secret
3. Restart your server after changing `.env`

### Webhook Not Firing

**Solutions**:
1. Check webhook is **active** in GitHub settings
2. Check your server is **running**
3. Check ngrok is **running** (for local dev)
4. Check firewall allows incoming connections

### "Connection Refused"

**Solutions**:
1. Make sure server is running on port 3000
2. Check ngrok URL is correct
3. Try accessing `https://your-ngrok-url/health` in browser

### Events Received But Not Syncing

**Check**:
1. Is Google Calendar authenticated? (`/sync/status`)
2. Are there any errors in server logs?
3. Is the event type supported? (see "What Triggers" section)

---

## 📝 Advanced Configuration

### Custom Webhook Path

If you want a different webhook URL, edit `webhooks.controller.ts`:

```typescript
@Controller('my-custom-path')
export class WebhooksController {
  // ...
}
```

Then use: `https://yourdomain.com/my-custom-path/github`

### Selective Event Handling

Edit `webhooks.service.ts` to customize which events trigger syncs:

```typescript
shouldTriggerSync(event: string, action?: string): boolean {
  // Add your custom logic here
}
```

### Rate Limiting

For production, consider adding rate limiting to prevent abuse:

```bash
npm install @nestjs/throttler
```

---

## 🎉 Benefits of Webhooks

### Before (Scheduled Sync):
- ⏰ Changes sync every 6 hours
- 🐌 Up to 6 hour delay
- 🔄 Unnecessary syncs even without changes

### After (Webhooks):
- ⚡ **Instant** sync (within seconds)
- 🎯 Only syncs when there are actual changes
- 🚀 More efficient and faster

---

## 📋 Summary

**You now have:**
- ✅ Webhook endpoint at `/webhooks/github`
- ✅ Signature verification for security
- ✅ Automatic sync on GitHub changes
- ✅ Support for projects and issues
- ✅ Test endpoint for debugging

**To use:**
1. Add `GITHUB_WEBHOOK_SECRET` to `.env`
2. Use ngrok to expose localhost (or deploy to cloud)
3. Configure webhook in GitHub
4. Changes now sync instantly! 🎉

---

## 🔗 Useful Links

- **GitHub Webhooks Docs**: https://docs.github.com/en/webhooks
- **ngrok**: https://ngrok.com/download
- **Test Webhooks**: https://webhook.site (for testing payloads)

---

**Need help?** Check the terminal logs for detailed webhook information!

