# Quick Start Guide - Automated Database Backups

## What Was Implemented

✅ **Cron Scheduler Service**
- Runs every minute in the API container
- Checks database for backup schedule configuration
- Executes backups at configured time (default 02:00 UTC)
- Sends email notifications to system admins
- Updates timestamps after each backup

✅ **Files Created/Modified**
- `apps/api/src/services/BackupScheduler.ts` - Main scheduler service
- `apps/api/package.json` - Added node-cron dependency
- `apps/api/src/index.ts` - Initialize scheduler on startup
- `scripts/run-backup-schedule-migration.sh` - Helper to apply migration
- `CRON_SCHEDULER_IMPLEMENTATION.md` - Full documentation

## Current Status

🚀 **Deployment In Progress**
- GitHub Actions building new container image
- Expected completion: ~10-12 minutes
- Commit: `a869b8d`

⏳ **Migration Pending**
- Migration file: `packages/db/migrations/006_backup_schedule.sql`
- Status: Created but not yet applied to database
- Required for scheduler to function

## Next Steps (In Order)

### 1. Wait for Deployment (10-12 minutes)
Check GitHub Actions: https://github.com/allerhed/RYTHM/actions

When complete, verify new revision:
```bash
az containerapp revision list \
  --name ca-api-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --query "[0].{name:name,active:properties.active,created:properties.createdTime}" \
  --output table
```

### 2. Apply Database Migration
```bash
./scripts/run-backup-schedule-migration.sh
```

Or manually:
```bash
psql -h psql-tvqklipuckq3a.postgres.database.azure.com \
     -U rythm_admin \
     -d rythm \
     -f packages/db/migrations/006_backup_schedule.sql
```

Verify:
```sql
SELECT * FROM backup_schedule;
```

Expected:
```
 schedule_id | enabled | schedule_time | retention_days | last_run_at | next_run_at
-------------+---------+---------------+----------------+-------------+-------------
 <uuid>      | false   | 02:00:00      | 30             | NULL        | NULL
```

### 3. Test in Admin UI
1. Go to https://admin.rythm.training/backups
2. Scroll to "Automated Daily Backups" section
3. Toggle switch to **ON**
4. Wait for scheduled time OR update schedule_time for immediate test

### 4. Verify Execution
Watch container logs:
```bash
az containerapp logs show \
  --name ca-api-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --follow \
  --tail 50
```

Look for:
```
✅ Backup scheduler initialized - checking every minute
🎯 Scheduled time matched: 02:00 UTC - executing backup...
📦 Creating scheduled database backup...
✅ Scheduled backup completed successfully in 8s
📧 Backup notification sent to 2 admin(s)
```

## Quick Test (Immediate Execution)

To test without waiting for 02:00 UTC:

1. **Get current UTC time + 2 minutes:**
   ```bash
   # Current UTC time
   date -u +"%H:%M"
   # Add 2 minutes manually (e.g., 14:35 → 14:37)
   ```

2. **Update schedule time:**
   ```bash
   psql -h psql-tvqklipuckq3a.postgres.database.azure.com \
        -U rythm_admin \
        -d rythm \
        -c "UPDATE backup_schedule SET schedule_time = '14:37:00', enabled = true;"
   ```

3. **Watch logs** (see command above)

4. **Verify in admin UI:**
   - New backup in list
   - "Last Backup" time updated
   - Check your email (system admin)

## Troubleshooting

### Scheduler Not Visible in Logs
- Check deployment completed successfully
- Verify container restarted with new code
- Look for any startup errors in logs

### Migration Fails
- Check database credentials
- Ensure you have CREATE TABLE permissions
- Verify no conflicts with existing tables

### Backups Not Executing
- Ensure `enabled = true` in database
- Check `schedule_time` is in 24-hour format
- Verify scheduler logs show time checks
- Ensure migration was applied successfully

### No Email Notifications
- Check admin users exist with valid emails
- Verify ACS_CONNECTION_STRING is configured
- Check email_logs table for send status
- Review API logs for email service errors

## Configuration Details

**Default Settings:**
- Schedule Time: 02:00 UTC (2 AM UTC)
- Retention Period: 30 days
- Enabled: false (must be toggled on)
- Cleanup: Automatic (runs with each backup)

**Customization:**
- Edit via admin UI: https://admin.rythm.training/backups
- Direct database: `UPDATE backup_schedule SET ...`
- All times in UTC to avoid timezone issues

## Email Notifications

System admins will receive emails containing:
- ✅/❌ Backup status (success/failure)
- Backup ID (filename)
- File size
- Duration
- Timestamp
- Error details (if failed)

Verify email logs:
```sql
SELECT * FROM email_logs WHERE email_type = 'backup_notification' ORDER BY sent_at DESC LIMIT 5;
```

## Monitoring Commands

**Check scheduler status:**
```bash
az containerapp logs show \
  --name ca-api-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --tail 100 | grep "Backup scheduler"
```

**Check recent backups:**
```bash
az storage blob list \
  --account-name rythmbackups \
  --container-name database-backups \
  --query "[].{name:name,size:properties.contentLength,created:properties.creationTime}" \
  --output table
```

**Check backup schedule config:**
```bash
psql -h psql-tvqklipuckq3a.postgres.database.azure.com \
     -U rythm_admin \
     -d rythm \
     -c "SELECT * FROM backup_schedule;"
```

## Success Checklist

- [ ] Deployment completed (GitHub Actions green)
- [ ] Container shows new revision active
- [ ] Database migration applied successfully
- [ ] Scheduler initialized log visible on startup
- [ ] Schedule configuration exists in database
- [ ] Backups toggle visible in admin UI
- [ ] Test execution successful (either scheduled or manual)
- [ ] New backup file created in Azure Storage
- [ ] Email notification received by admin
- [ ] last_run_at timestamp updated in database

## Getting Help

- Full documentation: `CRON_SCHEDULER_IMPLEMENTATION.md`
- Migration file: `packages/db/migrations/006_backup_schedule.sql`
- Scheduler code: `apps/api/src/services/BackupScheduler.ts`
- Admin UI: https://admin.rythm.training/backups

## Estimated Timeline

| Task | Duration | Status |
|------|----------|--------|
| Deployment | 10-12 min | 🔄 In Progress |
| Migration | 1 min | ⏳ Pending |
| UI Toggle | 1 min | ⏳ Pending |
| First Test | 2-5 min | ⏳ Pending |
| **Total** | **15-20 min** | |

---

**Current Time:** Check deployment progress at https://github.com/allerhed/RYTHM/actions

**Next Action:** Wait for deployment to complete, then apply migration.
