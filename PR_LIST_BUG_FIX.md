# Personal Records List Bug Fix

## Problem Identified

The Personal Records (PR) page was not listing any records despite successful PR creation. The root cause is a **naming conflict** between:

1. **VIEW `personal_records`** - Created in `000_consolidated_schema.sql` (line 355)
   - Auto-calculated analytics view that computes PRs from historical sets data
   - Has columns: `tenant_id`, `user_id`, `exercise_id`, `exercise_name`, `pr_type`, `value`, `achieved_at`

2. **TABLE `personal_records`** - Attempted creation in `010_personal_records.sql`
   - User-managed table for explicit PR tracking
   - Has columns: `pr_id`, `template_id`, `metric_name`, `category`, `current_value_numeric`, etc.

### Why This Caused the Bug

PostgreSQL does **not** allow a table and view to have the same name in the same schema. The migration order is:

1. `000_consolidated_schema.sql` runs first → creates **VIEW** `personal_records`
2. `010_personal_records.sql` runs second → `CREATE TABLE IF NOT EXISTS personal_records` **silently fails** because a view with that name exists

Result: The backend API code queries `personal_records` expecting the table structure, but gets the view instead. The column mismatch causes queries to fail or return empty results.

### Backend Query That Failed

From `apps/api/src/routes/personalRecords.ts`, the list endpoint queries:

```sql
SELECT 
  pr.pr_id,           -- ❌ Column doesn't exist in VIEW
  pr.template_id,     -- ❌ Column doesn't exist in VIEW
  et.name as exercise_name,
  pr.metric_name,     -- ❌ Column doesn't exist in VIEW
  pr.category,        -- ❌ Column doesn't exist in VIEW
  pr.current_value_numeric,  -- ❌ Column doesn't exist in VIEW
  ...
FROM personal_records pr
JOIN exercise_templates et ON pr.template_id = et.template_id  -- ❌ JOIN fails
```

The VIEW has: `tenant_id`, `user_id`, `exercise_id`, `exercise_name`, `pr_type`, `value`, `achieved_at`  
The backend expects: `pr_id`, `template_id`, `metric_name`, `category`, `current_value_numeric`, etc.

**Complete column mismatch → query fails silently → empty results returned**

## Solution

Created migration `012_fix_personal_records_conflict.sql` that:

1. **Drops the conflicting VIEW** `personal_records`
2. **Ensures the TABLE exists** with correct structure
3. **Recreates all indexes** for performance
4. **Fixes RLS policies** - combines tenant + user checks in single policy
5. **Ensures triggers and permissions** are set correctly

### Key Changes in New Migration

- Uses `DROP VIEW IF EXISTS personal_records CASCADE` to remove the view
- Uses `CREATE TABLE IF NOT EXISTS` to safely create the table
- Combines RLS policies: `tenant_id = ... AND user_id = ...` (was split before)
- Uses `current_setting('app.current_tenant_id', true)::uuid` (added `true` flag for safer config access)

## How to Apply the Fix

### Option 1: Fresh Database (Recommended for Development)

```bash
# Stop and remove all containers with volumes
cd /Users/lars-olofallerhed/Code/Azure/RYTHM
./scripts/stop.sh
# When prompted, answer 'y' to remove volumes

# Start fresh - migrations will run in correct order
./scripts/start.sh
```

### Option 2: Apply Migration to Existing Database

```bash
# Ensure Docker is running
docker ps

# Apply the migration manually
docker exec rythm-db-1 psql -U rythm_api -d rythm -f /docker-entrypoint-initdb.d/012_fix_personal_records_conflict.sql

# Verify the table exists and view is gone
docker exec rythm-db-1 psql -U rythm_api -d rythm -c "\d personal_records"
# Should show TABLE structure, not VIEW

# Restart API to clear any caches
docker restart rythm-api-1
```

### Option 3: Manual SQL Execution

If you prefer to run SQL directly:

```bash
docker exec -it rythm-db-1 psql -U rythm_api -d rythm
```

Then run the contents of `packages/db/migrations/012_fix_personal_records_conflict.sql` manually.

## Verification Steps

After applying the fix:

1. **Check table exists:**
   ```bash
   docker exec rythm-db-1 psql -U rythm_api -d rythm -c "\d personal_records"
   ```
   Should show table with columns: `pr_id`, `template_id`, `metric_name`, `category`, etc.

2. **Check view is gone:**
   ```bash
   docker exec rythm-db-1 psql -U rythm_api -d rythm -c "\dv personal_records"
   ```
   Should return "Did not find any relation named 'personal_records'"

3. **Test PR Creation:**
   - Go to http://localhost:3000/prs
   - Click "+ New PR"
   - Create a test PR
   - Should appear in the list immediately

4. **Check backend logs:**
   ```bash
   docker logs rythm-api-1 --tail 50
   ```
   Should not show any SQL errors related to personal_records

## Production Deployment

For production (Azure Container Apps):

1. The migration will automatically run as part of the deployment process
2. No data loss - the VIEW contained no persistent data (it was calculated on-the-fly)
3. Existing PRs created via the API will need to be recreated (if any exist)
4. The new TABLE-based PR system is the intended design going forward

## Technical Details

### RLS Policy Improvement

**Before (split policies):**
```sql
-- Two separate policies (OR logic by default)
CREATE POLICY personal_records_isolation ON personal_records
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY personal_records_user_isolation ON personal_records
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

**After (combined policy):**
```sql
-- Single policy with AND logic
CREATE POLICY personal_records_isolation ON personal_records
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid 
        AND user_id = current_setting('app.current_user_id', true)::uuid
    );
```

Benefits:
- Explicit AND logic prevents any RLS bypass scenarios
- Uses `current_setting(..., true)` which returns NULL instead of error if not set
- Clearer security model - both tenant AND user must match

### Database Schema Comparison

**Old VIEW (auto-calculated, read-only):**
```
personal_records
├── tenant_id
├── user_id  
├── exercise_id
├── exercise_name
├── pr_type ('weight' or '1rm_estimate')
├── value
└── achieved_at
```

**New TABLE (user-managed, full CRUD):**
```
personal_records
├── pr_id (UUID, primary key)
├── user_id
├── tenant_id
├── template_id (references exercise_templates)
├── metric_name ('1RM', '3RM', '5km', etc.)
├── category ('strength' or 'cardio')
├── current_value_numeric
├── current_value_unit
├── current_achieved_date
├── notes
├── created_at
└── updated_at

pr_history (tracks progression over time)
├── history_id
├── pr_id
├── value_numeric
├── value_unit
├── achieved_date
├── notes
├── session_id (optional link to workout)
└── created_at
```

## Files Modified

- `packages/db/migrations/012_fix_personal_records_conflict.sql` (new)
- `PR_LIST_BUG_FIX.md` (this file)

## Next Steps

1. Apply the migration using one of the methods above
2. Test PR creation and listing
3. Verify other PR endpoints (getById, update, delete) work correctly
4. Consider adding integration tests for PR functionality
5. Update any documentation that referenced the old VIEW-based PR system

## Related Issues

- The old VIEW in `000_consolidated_schema.sql` should be considered deprecated
- If analytics on historical PRs from sets data is needed, create a new view with a different name (e.g., `exercise_pr_analytics` or `calculated_prs`)
- The user-managed PR system (new TABLE) is the intended design for explicit PR tracking
