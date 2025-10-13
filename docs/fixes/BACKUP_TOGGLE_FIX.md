# Backup Schedule Toggle Fix

## Problem
The backup automation toggle switch in the admin UI was not making API calls when clicked. The UI would update but no network requests appeared in the browser console.

## Root Cause
The Express.js catch-all route `app.all('/api/*', ...)` was incorrectly positioned and was intercepting ALL API requests, including those meant for the backup REST endpoints. This route was returning a 404 for all `/api/*` paths except `/api/trpc`.

### Technical Details
```typescript
// ❌ This was blocking all REST endpoints:
app.all('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API route not found',
    availableRoutes: ['/api/trpc']
  });
});
```

Even though the backup routes were registered BEFORE the catch-all:
```typescript
app.use('/api/backups', backupRoutes);        // Line 508
app.use('/api/email-logs', emailLogsRoutes);  // Line 511
app.use('/api/trpc', createExpressMiddleware({...}));  // Line 514
app.all('/api/*', (req, res) => {...});       // Line 523 - BLOCKING!
```

The `app.all()` method matches ALL HTTP methods and was catching requests that didn't match the registered routes perfectly.

## Solution
**Removed the catch-all route entirely** (commit `67b0791`):
- Express.js automatically handles 404s for unmatched routes
- The catch-all was unnecessary and causing conflicts
- REST endpoints now work correctly

**Added debug logging** to the admin UI toggle handler (commit `0ff43c3`):
- Console logs show when API calls are initiated
- Response status codes are logged
- Errors are logged with emoji indicators (🔄 📡 ✅ ❌)

## Files Changed
1. **apps/api/src/index.ts**: Removed blocking catch-all route
2. **apps/admin/src/app/backups/page.tsx**: Added comprehensive logging

## Verification
```bash
# Before fix (route blocked):
curl https://api-url/api/backups
# {"error":"API route not found","availableRoutes":["/api/trpc"]}

# After fix (authentication required - route works!):
curl https://api-url/api/backups  
# {"error":"Access token required"}
```

## Impact
- ✅ Backup schedule toggle now works correctly
- ✅ Email logs API accessible (was also blocked)
- ✅ All REST endpoints functioning
- ✅ Better debugging with console logs

## Deployment
- Deployed via GitHub Actions: Run #18245280375
- Both API and Admin containers updated
- Database migration 006_backup_schedule.sql applied
- Feature fully operational

## Testing
1. Login to admin UI: https://admin.rythm.training
2. Navigate to Backups page
3. Toggle "Automated Daily Backups" switch
4. Check browser console for API call logs:
   - 🔄 Updating backup schedule
   - 📡 Response status: 200
   - ✅ Schedule updated

## Related Files
- Migration: `packages/db/migrations/006_backup_schedule.sql`
- Scheduler: `apps/api/src/services/BackupScheduler.ts`
- API Routes: `apps/api/src/routes/backups.ts`
- UI Component: `apps/admin/src/app/backups/page.tsx`
