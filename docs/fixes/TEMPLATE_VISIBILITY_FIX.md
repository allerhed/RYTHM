# Workout Template Visibility Fix

## Issue Summary
End users could not see system-scoped workout templates in the `/templates` page, even though they could see 3 templates when creating a new workout (via the template selection modal).

## Root Cause
The `workoutTemplates.list` and `workoutTemplates.count` tRPC queries were incorrectly filtering **all** templates (including system-scoped ones) by the user's `tenant_id`. This meant:

- ✅ User templates: Worked correctly (own templates only)
- ✅ Tenant templates: Worked correctly (organization templates)
- ❌ **System templates: Only visible if created in the same tenant as the user**

Since system templates are meant to be global and visible to all users across all organizations, filtering by `tenant_id` broke this functionality.

## Why New Workout Modal Worked
The template selection modal in the new workout page (`apps/mobile/src/app/training/new/page.tsx`) uses a different tRPC query: `workoutTemplates.getForSelection`. This query already had the correct logic:

```sql
WHERE is_active = true
AND (
  (scope = 'user' AND user_id = $2 AND tenant_id = $1)
  OR (scope = 'tenant' AND tenant_id = $1)
  OR (scope = 'system')  -- ✅ No tenant_id filter for system templates
)
```

## The Fix

### Before (Incorrect)
```sql
WHERE wt.is_active = true
AND wt.tenant_id = $1  -- ❌ This filtered out system templates from other tenants
AND (
  (wt.scope = 'user' AND wt.user_id = $2)
  OR (wt.scope = 'tenant')
  OR (wt.scope = 'system')
)
```

### After (Correct)
```sql
WHERE wt.is_active = true
AND (
  -- User's own templates (in their tenant)
  (wt.scope = 'user' AND wt.user_id = $2 AND wt.tenant_id = $1)
  OR
  -- Tenant templates for user's tenant
  (wt.scope = 'tenant' AND wt.tenant_id = $1)
  OR
  -- System templates (visible to all, regardless of tenant) ✅
  (wt.scope = 'system')
)
```

## Files Modified

### `apps/api/src/routes/workoutTemplates.ts`

1. **`list` query** (lines 16-50)
   - Moved `tenant_id` filter into the OR conditions
   - System templates no longer filtered by tenant

2. **`count` query** (lines 94-119)
   - Applied same fix for pagination count
   - Ensures correct total count across all scopes

3. **`getById` query** (already correct)
   - No changes needed
   - Already had proper logic

4. **`getForSelection` query** (already correct)
   - No changes needed
   - This was working correctly, which is why templates showed in new workout modal

## Template Visibility Rules (After Fix)

### System Templates (`scope = 'system'`)
- ✅ Visible to **all users** across **all organizations**
- ✅ Can be created by: `org_admin`, `super_admin`, `system_admin`
- ✅ Use case: Default workout templates, company-wide programs

### Tenant Templates (`scope = 'tenant'`)
- ✅ Visible to **all users in the same organization** only
- ✅ Can be created by: `tenant_admin`, `org_admin`, `system_admin`
- ✅ Use case: Organization-specific workout programs

### User Templates (`scope = 'user'`)
- ✅ Visible to **template creator only**
- ✅ Can be created by: Any authenticated user
- ✅ Use case: Personal workout templates

## Testing

### Test Scenario 1: End User Template List
1. Log in as regular user (not admin)
2. Navigate to `/templates`
3. **Expected**: See 3 system templates + any personal templates
4. **Before Fix**: No templates visible
5. **After Fix**: ✅ All system templates visible

### Test Scenario 2: New Workout Template Selection
1. Navigate to `/training/new`
2. Click "Load from Template"
3. **Expected**: See same templates as in `/templates` page
4. **Before Fix**: ✅ 3 templates visible (this was working)
5. **After Fix**: ✅ 3 templates visible (still working)

### Test Scenario 3: Different Organizations
1. Log in as User A in Organization X
2. Create a system template (if admin)
3. Log in as User B in Organization Y
4. **Expected**: User B can see the system template created by User A
5. **After Fix**: ✅ Works correctly

### Test Scenario 4: Tenant Isolation
1. Log in as User A in Organization X
2. Create a tenant template
3. Log in as User B in Organization Y
4. **Expected**: User B cannot see Organization X's tenant template
5. **After Fix**: ✅ Still works correctly (tenant isolation maintained)

## Impact Analysis

### What Changed
- ✅ System templates now visible to all users as intended
- ✅ Template list page now shows correct templates
- ✅ Consistency between `/templates` and new workout modal

### What Didn't Change
- ✅ User template privacy maintained (only creator can see)
- ✅ Tenant template isolation maintained (only org members can see)
- ✅ Permission system unchanged
- ✅ No database schema changes
- ✅ No breaking changes to API

## Deployment

**Status:** ✅ Deployed to production

**Commit:** `a84b6b4`

**Branch:** `main`

**Deployment Time:** ~10-15 minutes (automatic via GitHub Actions)

## Related Code

### tRPC Queries
- `workoutTemplates.list` - Main template listing (FIXED)
- `workoutTemplates.count` - Pagination count (FIXED)
- `workoutTemplates.getById` - Single template fetch (already correct)
- `workoutTemplates.getForSelection` - Modal selection (already correct)

### UI Components
- `/apps/mobile/src/app/templates/page.tsx` - Template list page
- `/apps/mobile/src/app/training/new/page.tsx` - New workout with template modal

### Database
- Table: `workout_templates`
- Scope column: `'user' | 'tenant' | 'system'`
- RLS: Not applicable (handled in application layer)

## Future Considerations

### Potential Enhancements
1. Add template sharing between users
2. Add template favoriting/starring
3. Add template categories/tags
4. Add template search across all scopes
5. Add template usage statistics

### Performance Notes
- Removing the top-level `tenant_id` filter might slightly increase query time
- However, templates table is small (<1000 rows expected)
- Proper indexes exist on `scope`, `is_active`, and `tenant_id`
- No performance issues anticipated

## Lessons Learned

1. **Always consider cross-tenant visibility** when designing scope-based features
2. **Test all entry points** for the same data (list page vs modal)
3. **Query consistency** is critical - ensure all queries follow same logic
4. **Document scope behavior** explicitly in code comments

---

**Issue:** System templates not visible in template list page  
**Cause:** Incorrect tenant_id filtering for system-scoped templates  
**Fix:** Moved tenant_id filter into OR conditions, excluded system templates from tenant filter  
**Status:** ✅ Complete and deployed  
**Impact:** Users can now see all system templates as intended
