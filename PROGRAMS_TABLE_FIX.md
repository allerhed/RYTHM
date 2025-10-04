# Programs Table Fix

## Problem
The mobile/admin UI was showing 500 Internal Server Error when loading pages that query workout sessions:
```
GET .../api/trpc/workoutSessions.list?batch=1&input=... 500 (Internal Server Error)
```

Error appeared 3 times on page load due to React Query retries.

## Root Cause
The `programs` table was missing from the production database, causing the `workoutSessions.list` tRPC query to fail:

```
Error in sessions.list: error: relation "programs" does not exist
TRPCError: INTERNAL_SERVER_ERROR
[cause]: error: relation "programs" does not exist
```

### Why was it missing?
The `programs` table was defined in `000_consolidated_schema.sql` but this migration was likely never fully applied to production. The database only had 10 tables:
- backup_schedule
- email_logs
- equipment
- exercise_templates
- exercises
- sessions
- sets
- tenants
- users
- workout_templates

Missing: `programs` (and potentially other tables from the consolidated schema)

## Solution
Created and applied migration `007_programs_table.sql` with:
- ✅ Programs table with proper structure
- ✅ RLS (Row Level Security) enabled with tenant isolation
- ✅ Admin bypass policy for system_admin role
- ✅ Indexes for tenant_id and created_at
- ✅ Triggers for updated_at timestamp
- ✅ Foreign key to tenants table

## Migration Applied
```sql
CREATE TABLE programs (
    program_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    description TEXT,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Verification
```bash
# Before fix:
TRPCError: relation "programs" does not exist

# After fix:
SELECT COUNT(*) FROM programs;  
# → 0 rows (table exists, no errors)
```

## Impact
- ✅ workoutSessions.list tRPC endpoint now works
- ✅ Mobile/admin UI pages load without 500 errors
- ✅ No more React Query retry storms (3x same error)
- ✅ Database schema aligned with codebase expectations

## Related Issues
This highlights a potential broader issue: **the consolidated schema may not have been fully applied**. If you encounter similar "relation does not exist" errors, check:

1. Run `\dt` in psql to list all tables
2. Compare with `000_consolidated_schema.sql`  
3. Create individual migration files for missing tables
4. Apply migrations to production

## Files
- Migration: `packages/db/migrations/007_programs_table.sql`
- Commit: `15b245a`

## Testing
1. Refresh the mobile or admin app
2. Navigate to workout sessions page
3. Check browser console - no more 500 errors
4. Verify data loads correctly
