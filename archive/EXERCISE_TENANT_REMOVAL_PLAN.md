# Exercise Tenant Removal - Application Code Update Plan

## Status: Database Migration Completed ✅
The database schema has been successfully updated to remove tenant_id from the exercises table. Now we need to update the application code.

## Files That Need Updates

### 1. API Routes - exercises.ts (/apps/api/src/routes/exercises.ts)
**Current Issues:**
- GET `/` route filters by tenant_id (line ~130)
- POST `/from-template/:templateId` inserts tenant_id (line ~197)
- POST `/` inserts tenant_id (line ~247)
- PUT `/:exerciseId` filters by tenant_id in WHERE clause
- GET `/:exerciseId` filters by tenant_id

**Required Changes:**
- Remove tenant_id filtering from all SELECT queries
- Remove tenant_id from all INSERT statements
- Remove tenant_id from WHERE clauses in UPDATE/DELETE
- Change exercise access from tenant-specific to global

### 2. Simple Server - simple-server.js (/apps/api/src/simple-server.js)
**Current Issues:**
- Line 524: `SELECT exercise_id FROM exercises WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)`
- Line 532: `INSERT INTO exercises (tenant_id, name, muscle_groups, equipment, exercise_category, notes)`
- Line 634: `LEFT JOIN exercises e ON e.exercise_id = st.exercise_id AND e.tenant_id = s.tenant_id`
- Line 796: Another INSERT with tenant_id
- Line 959: Logs tenant_id for exercises

**Required Changes:**
- Remove tenant_id from exercise lookups
- Remove tenant_id from exercise creation
- Remove tenant_id from JOIN conditions
- Update logging to not reference tenant_id

### 3. Sessions REST API - sessions-rest.ts (/apps/api/src/routes/sessions-rest.ts)
**Current Issues:**
- Line 263: `INSERT INTO exercises (tenant_id, name, notes)`
- Line 356: `INSERT INTO exercises (tenant_id, name, muscle_groups, equipment, exercise_category, notes)`

**Required Changes:**
- Remove tenant_id from exercise creation in session context

### 4. Sample Data Generation - generate-sample-workouts.js (/scripts/generate-sample-workouts.js)
**Current Issues:**
- Line 174: `SELECT exercise_id FROM exercises WHERE tenant_id = $1 AND name = $2`
- Line 180: `INSERT INTO exercises (tenant_id, name, muscle_groups, equipment)`

**Required Changes:**
- Remove tenant_id from exercise lookups
- Remove tenant_id from exercise creation

### 5. Database Views - 003_analytics_views.sql (/packages/db/migrations/003_analytics_views.sql)
**Current Issues:**
- Lines 105, 121, 128, 148: Views reference exercises.tenant_id in analytics

**Required Changes:**
- Remove tenant_id references from analytics views
- Update JOIN conditions to not filter by tenant

## Implementation Strategy

### Phase 1: Core API Updates
1. Update exercises.ts routes to remove tenant filtering
2. Update simple-server.js exercise operations
3. Update sessions-rest.ts exercise creation

### Phase 2: Supporting Code Updates
1. Update generate-sample-workouts.js script
2. Update analytics views migration

### Phase 3: Testing
1. Test exercise access across different tenant contexts
2. Verify exercises are globally available
3. Test exercise creation without tenant_id
4. Verify existing functionality still works

## New Exercise Access Pattern

**Before (Tenant-Isolated):**
```sql
SELECT * FROM exercises WHERE tenant_id = $1 AND name = $2
```

**After (Global):**
```sql
SELECT * FROM exercises WHERE name = $1
```

**Benefits:**
- Simplified queries
- Global exercise library
- Consistent exercise data across tenants
- Easier exercise management

## Risk Mitigation
- Database migration already completed with data preservation
- All existing exercises remain accessible
- Unique constraint on exercise names prevents duplicates
- Gradual rollout of application changes