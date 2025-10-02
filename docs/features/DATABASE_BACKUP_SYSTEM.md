# Database Backup System

## Overview

The RYTHM platform includes a comprehensive database backup and restore system designed for Azure Blob Storage. This system provides automated retention policies, manual backups, and secure restoration capabilities.

## Features

- ✅ **Full PostgreSQL Backups**: Uses `pg_dump` to create complete, restorable database dumps
- ✅ **Azure Blob Storage**: Cost-effective, scalable cloud storage for backups
- ✅ **10-Day Retention**: Automatic cleanup of backups older than 10 days
- ✅ **Admin UI**: Full-featured interface for backup management
- ✅ **Download Capability**: Download backups for local storage or migration
- ✅ **Secure Access**: System admin-only access with JWT authentication
- ✅ **RESTful API**: Complete API for programmatic access

## Architecture

### Components

1. **BackupService** (`apps/api/src/services/backup.service.ts`)
   - Core backup logic
   - Azure Blob Storage integration
   - Retention policy enforcement
   - PostgreSQL backup/restore operations

2. **API Routes** (`apps/api/src/routes/backups.ts`)
   - RESTful endpoints for backup operations
   - Admin authentication middleware
   - Error handling and logging

3. **Admin UI** (`apps/admin/src/app/backups/page.tsx`)
   - User-friendly backup management interface
   - Real-time status updates
   - Confirmation dialogs for destructive operations

## Configuration

### Environment Variables

Add these to your environment configuration:

```bash
# Azure Blob Storage Connection String
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net

# Optional: Custom container name (defaults to 'database-backups')
AZURE_BACKUP_CONTAINER=database-backups

# Database connection (already configured)
DATABASE_URL=postgresql://user:password@host:port/database
```

### Azure Setup

1. **Create Storage Account**:
   ```bash
   az storage account create \
     --name rythmbackups \
     --resource-group rythm-resources \
     --location swedencentral \
     --sku Standard_LRS \
     --kind StorageV2
   ```

2. **Get Connection String**:
   ```bash
   az storage account show-connection-string \
     --name rythmbackups \
     --resource-group rythm-resources \
     --output tsv
   ```

3. **Container Creation** (automatic on first backup):
   - The system will automatically create the container if it doesn't exist
   - Container name: `database-backups` (configurable via env)

### Cost Optimization

**Azure Blob Storage Pricing** (Sweden Central, Standard LRS):
- Storage: ~$0.018 per GB/month
- Operations: Minimal cost for backup/restore operations
- Estimated cost for 10 days of daily backups (assuming 1GB DB): ~$0.20/month

**Alternative Storage Options Considered**:
- ❌ Azure Files: More expensive, overkill for backups
- ❌ Azure Managed Disks: Not designed for backup storage
- ✅ Azure Blob Storage: Optimal for this use case

## API Reference

### Base URL
```
{API_URL}/api/backups
```

### Authentication
All endpoints require:
- JWT token in `Authorization: Bearer {token}` header
- System admin role

### Endpoints

#### 1. Create Backup
```http
POST /api/backups
```

**Response**:
```json
{
  "success": true,
  "message": "Backup created successfully",
  "data": {
    "name": "backup-2024-01-15T10-30-00.sql",
    "size": 1048576,
    "createdAt": "2024-01-15T10:30:00Z",
    "url": "https://..."
  }
}
```

#### 2. List Backups
```http
GET /api/backups
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "backup-2024-01-15T10-30-00.sql",
      "size": 1048576,
      "createdAt": "2024-01-15T10:30:00Z",
      "url": "https://..."
    }
  ],
  "count": 1
}
```

#### 3. Restore Backup
```http
POST /api/backups/{filename}/restore
```

**⚠️ WARNING**: This operation:
- Overwrites the current database
- Cannot be undone
- Requires double confirmation in the UI

**Response**:
```json
{
  "success": true,
  "message": "Database restored successfully",
  "filename": "backup-2024-01-15T10-30-00.sql"
}
```

#### 4. Delete Backup
```http
DELETE /api/backups/{filename}
```

**Response**:
```json
{
  "success": true,
  "message": "Backup deleted successfully",
  "filename": "backup-2024-01-15T10-30-00.sql"
}
```

#### 5. Download Backup
```http
GET /api/backups/{filename}/download
```

**Response**: Binary SQL file with appropriate headers

## Usage Guide

### Manual Backup

1. Navigate to **Backups** in the admin panel
2. Click **"Create Backup"**
3. Confirm the operation
4. Wait for completion (progress indicator shown)
5. Backup appears in the list

### Restore from Backup

⚠️ **CRITICAL**: Restoring will overwrite your current database!

1. Navigate to **Backups** in the admin panel
2. Find the backup you want to restore
3. Click **"Restore"** button
4. Read the warning carefully
5. Confirm twice (double confirmation required)
6. Wait for restoration
7. Application will reload automatically

### Download Backup

1. Navigate to **Backups** in the admin panel
2. Find the backup you want to download
3. Click **"Download"** button
4. Save the `.sql` file locally

### Delete Backup

1. Navigate to **Backups** in the admin panel
2. Find the backup you want to delete
3. Click **"Delete"** button
4. Confirm the operation

## Backup Process Details

### Backup Creation

1. **pg_dump** creates a plain SQL dump of the entire database
2. Dump is temporarily stored in the OS temp directory
3. File is uploaded to Azure Blob Storage
4. Temporary file is deleted
5. Old backups (>10 days) are automatically removed

**Format**: Plain SQL (`.sql`)
**Compression**: Not compressed (can be added if needed)
**Size**: Varies based on data (typically 1-10 MB for small databases)

### Restore Process

1. Backup file is downloaded from Azure Blob Storage
2. File is temporarily stored in the OS temp directory
3. **psql** executes the SQL dump against the database
4. Database is completely replaced with backup data
5. Temporary file is deleted

**⚠️ Limitations**:
- Database must be accessible during restore
- Active connections may cause issues (recommend maintenance window)
- Large databases take longer to restore

## Retention Policy

- **Automatic Cleanup**: Runs on each backup creation
- **Retention Period**: 10 days
- **Logic**: Deletes backups with `createdAt` older than 10 days
- **Manual Override**: Download before automatic deletion

## Security

### Access Control
- **System Admin Only**: Only `system_admin` role can access backups
- **JWT Authentication**: All requests require valid auth token
- **Row Level Security**: No RLS conflicts (operates at service account level)

### Best Practices
- Store `AZURE_STORAGE_CONNECTION_STRING` in Azure Key Vault
- Never commit connection strings to git
- Use Azure AD authentication when possible (future enhancement)
- Regularly test restore procedures
- Keep local backups of critical data

## Monitoring & Logging

### Logs
All backup operations are logged:
- Backup creation start/complete
- Restore operations with warnings
- Deletion operations
- Errors with full stack traces

### Metrics to Monitor
- Backup file sizes (growth over time)
- Backup duration (performance)
- Failed backup attempts
- Storage costs

## Troubleshooting

### Common Issues

#### 1. "Database connection failed"
**Cause**: DATABASE_URL not configured or database unreachable
**Solution**: Check environment variables and database connectivity

#### 2. "Azure Storage error"
**Cause**: Invalid connection string or missing permissions
**Solution**: Verify `AZURE_STORAGE_CONNECTION_STRING` is correct

#### 3. "pg_dump not found"
**Cause**: PostgreSQL client tools not installed in container
**Solution**: Ensure Dockerfile includes `postgresql-client` package

#### 4. Restore fails with "permission denied"
**Cause**: Database user lacks necessary permissions
**Solution**: Ensure database user has CREATE/DROP permissions

#### 5. "Backup file too large"
**Cause**: Database has grown significantly
**Solution**: Consider compression or selective backups

### Debug Mode

Enable detailed logging by setting:
```bash
LOG_LEVEL=debug
```

## Future Enhancements

### Planned Features
- [ ] **Scheduled Backups**: Cron job for automatic daily backups
- [ ] **Compression**: Gzip compression for large databases
- [ ] **Incremental Backups**: WAL-based incremental backups
- [ ] **Email Notifications**: Alerts for backup success/failure
- [ ] **Backup Verification**: Automated restore tests
- [ ] **Multi-region Replication**: Geo-redundant backups
- [ ] **Selective Restore**: Restore specific tables only

### Scheduling Implementation (Coming Soon)

Add cron scheduling for automated backups:

```typescript
// Example: Daily backup at 2 AM
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  console.log('Running scheduled backup...');
  await backupService.createBackup();
});
```

## Testing

### Manual Testing Checklist
- [ ] Create backup successfully
- [ ] List backups shows correct data
- [ ] Download backup produces valid SQL file
- [ ] Restore from backup works correctly
- [ ] Delete backup removes file from storage
- [ ] 10-day retention policy triggers cleanup
- [ ] Non-admin users cannot access endpoints
- [ ] UI shows appropriate loading states
- [ ] Error messages are user-friendly

### Automated Tests (TODO)
```bash
# Run backup service tests
npm test apps/api/src/services/backup.service.test.ts

# Run API route tests
npm test apps/api/src/routes/backups.test.ts
```

## Production Deployment

### Pre-deployment Checklist
1. [ ] Configure `AZURE_STORAGE_CONNECTION_STRING` in production
2. [ ] Create Azure Storage Account in production resource group
3. [ ] Test backup creation in staging environment
4. [ ] Test restore process in staging environment
5. [ ] Verify retention policy works correctly
6. [ ] Document recovery procedures for team
7. [ ] Set up monitoring/alerting for backup failures

### Deployment Steps
1. Deploy API with new backup service
2. Deploy admin UI with backups page
3. Add environment variables to Azure Container Apps
4. Create initial backup to verify configuration
5. Document backup schedule and procedures

## Support

For issues or questions:
- Check logs in Azure Container Apps
- Review this documentation
- Contact system administrator
- File issue in project repository

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainer**: RYTHM DevOps Team
