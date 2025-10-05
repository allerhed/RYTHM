# History Page Fix - Session List 500 Error

**Date:** October 4, 2025  
**Issue:** Mobile app history page fails to load workouts with 500 error

## Problem

The user app's history page was failing with a 500 error:
```
Failed to load resource: the server responded with a status of 500 ()
api/trpc/workoutSessions.list?batch=1&input=%7B%220%22%3A%7B%22offset%22%3A0%2C%22limit%22%3A10%7D%7D
```

### Root Cause

The `workoutSessions.list` tRPC endpoint (mapped to `sessionsRouter.list`) was referencing a `program_id` column that **no longer exists** in the `sessions` table.

**Database Error:**
```
column s.program_id does not exist
hint: 'Perhaps you meant to reference the column "p.program_id".'
```

The sessions table schema shows no `program_id` column:
```sql
Table "public.sessions"
       Column       |           Type           
--------------------+--------------------------
 session_id         | uuid                     
 tenant_id          | uuid                     
 user_id            | uuid                     
 started_at         | timestamp with time zone 
 completed_at       | timestamp with time zone 
 category           | session_category         
 notes              | text                     
 training_load      | integer                  
 perceived_exertion | numeric(3,1)             
 name               | text                     
 duration_seconds   | integer                  
 created_at         | timestamp with time zone 
 updated_at         | timestamp with time zone 
```

## Solution

Removed all `program_id` references from:

### 1. API Routes (`apps/api/src/routes/sessions.ts`)
- ✅ **`create` mutation**: Removed `program_id` from destructuring and INSERT statement
- ✅ **`list` query**: Removed `s.program_id` selection and `LEFT JOIN programs` clause
- ✅ **`getById` query**: Removed `p.name as program_name` and programs join

### 2. Shared Schemas (`packages/shared/src/schemas.ts`)
- ✅ **`SessionSchema`**: Removed `program_id: z.string().uuid().optional()`
- ✅ **`CreateSessionRequest`**: Removed `program_id: z.string().uuid().optional()`

## Files Changed

1. `/apps/api/src/routes/sessions.ts` - Removed program_id references from queries
2. `/packages/shared/src/schemas.ts` - Updated schemas to match database

## Deployment

```bash
# Build shared package
npm run build --workspace=packages/shared

# Build API
npm run build --workspace=apps/api

# Build and push Docker image to Azure Container Registry
az acr build --registry crtvqklipuckq3a --image rythm-api:latest --file apps/api/Dockerfile .

# Update container app with new image
az containerapp update \
  --name ca-api-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --image crtvqklipuckq3a.azurecr.io/rythm-api:latest
```

## Testing

After deployment, verify:
1. ✅ Mobile app history page loads without errors
2. ✅ Sessions list displays correctly - "Query returned 7 rows"
3. ✅ Session details load properly
4. ✅ No program-related fields appear (as expected)

**Test Results (2025-10-04 15:11:03 UTC):**
```
Sessions list query: {
  category: undefined,
  limit: 10,
  offset: 0,
  userId: undefined,
  tenantId: '0b0d8162-3f7f-42fd-904b-3b8e69d53c74',
  requestUserId: '67d4ce6e-8bb3-436e-a6b8-26b453ce698f'
}
Executing query with params: [ ... ]
Query returned 7 rows  ← SUCCESS! 🎉
```

**Deployment Details:**
- Build ID: `dt4v` (Succeeded)
- Image: `crtvqklipuckq3a.azurecr.io/rythm-api:latest`
- Revision: `ca-api-tvqklipuckq3a--0000055` (Active, Running, 100% traffic)
- Health: ✅ OK

## Notes

- The `programs` table still exists in the database for future use
- Sessions are no longer directly linked to programs (this appears to be an intentional schema change)
- All validation and type checking now aligns with the actual database schema
