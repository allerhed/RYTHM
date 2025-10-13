# Avatar Upload 500 Error — Production Fix Required

## Issue
Avatar uploads are failing with **500 Internal Server Error** in production (rythm.training).

## Root Cause
The database migration `017_add_avatar_data_column.sql` has not been applied to the production database yet. The API is trying to update columns (`avatar_data`, `avatar_content_type`) that don't exist.

## Error Details
```
PUT https://rythm.training/api/auth/avatar 500 (Internal Server Error)
Avatar update error: Error: Failed to update avatar
```

## Solution

### Apply the Migration to Production

**Option 1: Via Azure Portal (Manual)**
```bash
# Connect to production database
psql -h <azure-postgres-host> -U <admin-user> -d rythm

# Run migration
\i /path/to/017_add_avatar_data_column.sql

# Verify columns exist
\d users
```

**Option 2: Via Database Migration Script**
```bash
# If you have a deployment pipeline that runs migrations
# Ensure 017_add_avatar_data_column.sql is included and runs
```

**Option 3: Via Azure Cloud Shell**
```bash
# Upload migration file to Cloud Shell
# Connect to database
psql "host=<server>.postgres.database.azure.com port=5432 dbname=rythm user=<user> sslmode=require"

# Run migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_content_type TEXT;

# Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'avatar%';
```

## Additional Fix Applied

**URL Prefix Issue**: Fixed double `/api/api/` prefix in avatar URLs.
- API now returns `/auth/avatar/:id` (without `/api`)
- Frontend proxy adds `/api` prefix
- Result: `/api/auth/avatar/:id` ✅

Commit: `6287dcb`

## Verification After Migration

1. **Check columns exist:**
   ```sql
   \d users
   ```
   Should show:
   - `avatar_data TEXT`
   - `avatar_content_type TEXT`

2. **Test avatar upload:**
   - Go to Profile page in mobile app
   - Upload a profile picture
   - Should succeed with 200 status

3. **Test avatar retrieval:**
   ```bash
   curl https://rythm.training/api/auth/avatar/<user-id>
   ```
   Should return image data (or 404 if no avatar yet)

## Status
- ✅ Code deployed (commits 2d79591, feee53c, 6287dcb)
- ❌ **Migration NOT applied to production database**
- ⏳ **Action required: Apply migration to production**

## Next Steps
1. Apply migration to production database using one of the options above
2. Verify columns exist
3. Test avatar upload in production
4. Confirm profile pictures persist after deployment

---

**Priority**: HIGH — Users cannot upload profile pictures until migration is applied.
