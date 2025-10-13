# Cron Scheduler Implementation - Automated Database Backups

## Overview
Implemented a production-ready cron scheduler service that runs inside the API container to automatically execute scheduled database backups. The scheduler checks the database configuration every minute and triggers backups when conditions are met.

## Implementation Details

### Files Modified

1. **apps/api/package.json**
   - Added `node-cron: ^3.0.3` (runtime dependency)
   - Added `@types/node-cron: ^3.0.11` (dev dependency)

2. **apps/api/src/services/BackupScheduler.ts** (NEW)
   - Complete cron scheduler service with singleton pattern
   - Runs every minute to check backup schedule conditions
   - Prevents concurrent executions with `isRunning` flag
   - Sends email notifications to system admins on success/failure
   - Updates `last_run_at` and `next_run_at` timestamps after each backup

3. **apps/api/src/index.ts**
   - Imported `backupScheduler` from services
   - Initialized scheduler after server starts: `backupScheduler.start()`

### How It Works

#### Cron Expression
```typescript
'* * * * *' // Runs every minute
```

#### Execution Logic
1. **Check Schedule Configuration**
   - Queries `backup_schedule` table for enabled status and schedule time
   - Returns early if backups are disabled (logs hourly to avoid spam)

2. **Time Matching**
   - Gets current UTC time in HH:MM format
   - Compares with configured `schedule_time` (also HH:MM)
   - If times match, proceeds to backup execution

3. **Duplicate Prevention**
   - Checks `last_run_at` timestamp
   - Skips execution if backup ran within last 2 minutes
   - Prevents multiple executions due to minute-level granularity

4. **Backup Execution**
   - Calls `backupService.createBackup()`
   - Creates timestamped SQL dump file
   - Uploads to Azure Blob Storage
   - Automatic cleanup of old backups (30-day retention)

5. **Post-Backup Updates**
   - Updates `last_run_at` to current timestamp
   - Calculates and updates `next_run_at` (24 hours from now)
   - Sends email notification to all system admins

6. **Email Notifications**
   - Queries all users with `role = 'system_admin'`
   - Sends backup status email (success or failure)
   - Includes: backup ID, size, duration, timestamp
   - On failure: includes error message for debugging

### Key Features

✅ **Container-Native**: Runs directly in API container (no external dependencies)  
✅ **Database-Driven**: Configuration stored in database (editable via admin UI)  
✅ **Concurrency-Safe**: Prevents overlapping backup executions  
✅ **Error-Resilient**: Try-catch blocks with comprehensive logging  
✅ **Email Notifications**: Automatic alerts to system admins  
✅ **UTC Time**: All times in UTC to avoid timezone issues  
✅ **Automatic Cleanup**: Old backups deleted per retention policy  
✅ **Production-Ready**: Structured logging with emojis for easy log parsing

### Configuration

The scheduler reads from the `backup_schedule` table:

```sql
SELECT * FROM backup_schedule LIMIT 1;
```

Expected columns:
- `schedule_id` (UUID): Primary key
- `enabled` (BOOLEAN): Turn scheduled backups on/off
- `schedule_time` (TIME): Daily execution time (e.g., '02:00:00' for 2 AM UTC)
- `retention_days` (INTEGER): How long to keep backups (30 days)
- `last_run_at` (TIMESTAMPTZ): When last backup completed
- `next_run_at` (TIMESTAMPTZ): When next backup is scheduled

### Logs to Watch For

When scheduler is working correctly, you'll see:

```
🚀 RYTHM API server running on port 3001
📊 Health check: http://localhost:3001/health
🔌 tRPC endpoint: http://localhost:3001/api/trpc
🔄 Starting backup scheduler...
✅ Backup scheduler initialized - checking every minute
```

When backup executes:

```
🎯 Scheduled time matched: 02:00 UTC - executing backup...
📦 Creating scheduled database backup...
Starting database backup...
Backup created: rythm-backup-2025-01-29T02:00:01-123Z.sql (156.5 KB)
Uploaded to blob storage: rythm-backup-2025-01-29T02:00:01-123Z.sql
✅ Scheduled backup completed successfully in 8s
   Backup: rythm-backup-2025-01-29T02:00:01-123Z.sql
   Size: 156.5 KB
   Next run: 2025-01-30T02:00:00.000Z
📧 Backup notification sent to 2 admin(s)
```

When backups are disabled:

```
ℹ️  Automated backups are disabled
```
(Only logs once per hour to avoid spam)

### Testing Instructions

#### 1. Deploy the Code
```bash
git add .
git commit -m "feat: implement cron scheduler for automated backups"
git push origin main
```

Wait for GitHub Actions to complete (~10-12 minutes).

#### 2. Apply Database Migration
```bash
# Option A: Using helper script
./scripts/run-backup-schedule-migration.sh

# Option B: Direct psql command
psql -h psql-tvqklipuckq3a.postgres.database.azure.com \
     -U rythm_admin \
     -d rythm \
     -f packages/db/migrations/006_backup_schedule.sql
```

Verify table exists:
```sql
SELECT * FROM backup_schedule;
```

Expected result:
```
 schedule_id | enabled | schedule_time | retention_days | last_run_at | next_run_at | created_at | updated_at
-------------+---------+---------------+----------------+-------------+-------------+------------+------------
 uuid...     | false   | 02:00:00      | 30             | NULL        | NULL        | timestamp  | timestamp
```

#### 3. Test Immediate Execution
Go to admin panel: https://admin.rythm.training/backups

**Option A: Wait for scheduled time**
- Toggle "Automated Daily Backups" to ON
- Default schedule is 02:00 UTC
- Wait until 02:00 UTC tomorrow
- Check backups list for new backup

**Option B: Test immediately**
1. Get current UTC time:
   ```bash
   date -u +"%H:%M"
   ```
   Output: `14:35` (for example)

2. Update schedule to 2 minutes from now:
   ```bash
   psql -h psql-tvqklipuckq3a.postgres.database.azure.com \
        -U rythm_admin \
        -d rythm \
        -c "UPDATE backup_schedule SET schedule_time = '14:37:00', enabled = true;"
   ```

3. Watch the API logs:
   ```bash
   az containerapp logs show \
     --name ca-api-tvqklipuckq3a \
     --resource-group rg-rythm-prod \
     --follow \
     --tail 50
   ```

4. At 14:37 UTC, you should see backup execution logs

5. Verify in admin UI:
   - New backup appears in list
   - "Last Backup" time updates
   - Email notification sent to admin email

#### 4. Monitor Production
After deployment, monitor container logs for scheduler activity:

```bash
# Live logs
az containerapp logs show \
  --name ca-api-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --follow

# Filter for scheduler logs
az containerapp logs show \
  --name ca-api-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --follow | grep -E "(Backup scheduler|scheduled backup)"
```

Look for:
- ✅ Scheduler initialization on container startup
- 🎯 Time matching when backup executes
- ✅ Successful backup completion
- 📧 Email notification sent
- ⚠️ Any error messages

### Troubleshooting

#### Scheduler Not Starting
**Symptom**: No "Backup scheduler initialized" log on startup

**Fix**:
1. Check if deployment succeeded: `az containerapp revision list`
2. Verify node-cron installed: Check package.json in deployed container
3. Check for compilation errors: Review GitHub Actions build logs

#### Backups Not Executing at Scheduled Time
**Symptom**: Time matches but no backup happens

**Checklist**:
- [ ] Is `enabled = true` in database?
- [ ] Is `schedule_time` correct (UTC time)?
- [ ] Did migration 006 apply successfully?
- [ ] Check container logs for error messages
- [ ] Verify `last_run_at` isn't preventing execution (2-minute threshold)

#### Email Notifications Not Sending
**Symptom**: Backup succeeds but no email received

**Checklist**:
- [ ] Are there users with `role = 'system_admin'` in database?
- [ ] Do admin users have valid email addresses?
- [ ] Is `ACS_CONNECTION_STRING` configured in container?
- [ ] Is `ACS_SENDER_ADDRESS` configured in container?
- [ ] Check email_logs table for sent status

#### Multiple Backups Created at Same Time
**Symptom**: Duplicate backups in same minute

**Fix**:
- Verify `isRunning` flag is working (should prevent concurrency)
- Check `last_run_at` timestamp is updating correctly
- Increase duplicate prevention threshold from 2 to 5 minutes if needed

### Architecture Benefits

1. **No External Dependencies**
   - No need for Azure Logic Apps, Functions, or Automation
   - Runs directly in existing API container
   - Simplifies deployment and maintenance

2. **Database-Driven Configuration**
   - Toggle on/off from admin UI
   - Change schedule without code deployment
   - Historical tracking with timestamps

3. **Azure Container Apps Compatible**
   - Stateless service (no local storage)
   - Graceful shutdown support
   - Health check integration

4. **Cost-Effective**
   - No additional Azure services required
   - Uses existing API container compute
   - Cron runs in-process (negligible overhead)

5. **Observable**
   - Structured logging with clear emojis
   - Email notifications for every backup
   - Timestamp tracking in database

### Future Enhancements (Optional)

- [ ] Add weekly/monthly backup schedules (not just daily)
- [ ] Support multiple schedule configurations per tenant
- [ ] Add Slack/Teams webhook notifications (in addition to email)
- [ ] Implement backup verification (restore to temp database, check integrity)
- [ ] Add metrics export for Azure Monitor/Application Insights
- [ ] Support backup to multiple storage accounts (redundancy)
- [ ] Add compression (gzip) for backup files to reduce storage costs

## Summary

✅ Cron scheduler fully implemented and integrated  
✅ Runs in API container (no external services needed)  
✅ Database-driven configuration  
✅ Email notifications to admins  
✅ 30-day retention with automatic cleanup  
✅ Production-ready logging  
✅ Concurrency-safe execution  

**Next Steps:**
1. Deploy code to Azure Container Apps
2. Apply database migration (006_backup_schedule.sql)
3. Enable scheduled backups in admin UI
4. Monitor first execution at scheduled time
5. Verify email notification delivery

**Estimated Time to Production:**
- Deployment: ~10-12 minutes (GitHub Actions)
- Migration: ~1 minute (manual psql command)
- Testing: ~5 minutes (toggle + verify)
- **Total: ~15-20 minutes**
