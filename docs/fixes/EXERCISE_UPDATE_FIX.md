# Exercise Template Update Fix - Issue Resolution

## Problem Statement
When editing an exercise in the Admin UI at https://admin.rythm.training/exercises and clicking "Update Exercise", the operation failed with a 400 Bad Request error:

```
POST https://api.rythm.training/api/trpc/admin.updateExerciseTemplate 400 (Bad Request)
Error saving exercise template: Error: HTTP 400
```

## Root Cause
The issue was with the tRPC HTTP request format. When making direct HTTP POST calls to tRPC endpoints, the data needs to be wrapped in a `json` property, but the admin API client was sending data directly without this wrapper.

This is a known pattern documented in `archive/REGISTRATION_FIX_SUMMARY.md` which describes a similar issue with the registration flow.

## Solution
Updated all tRPC POST request methods in `apps/admin/src/lib/api.ts` to wrap the request body data in the required `{ json: data }` format.

### Example Transformation
```typescript
// ❌ Before (incorrect)
updateExerciseTemplate: async (exerciseTemplateData: UpdateExerciseTemplateData): Promise<ExerciseTemplate> => {
  const response = await fetch(`${this.baseUrl}/api/trpc/admin.updateExerciseTemplate`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify(exerciseTemplateData),  // Missing json wrapper
  })
  // ...
}

// ✅ After (correct)
updateExerciseTemplate: async (exerciseTemplateData: UpdateExerciseTemplateData): Promise<ExerciseTemplate> => {
  const response = await fetch(`${this.baseUrl}/api/trpc/admin.updateExerciseTemplate`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({ json: exerciseTemplateData }),  // Properly wrapped
  })
  // ...
}
```

## Scope of Changes
To prevent similar issues across the admin panel, all 22 tRPC POST request methods were updated:

### Exercise Template Management (Reported Issue)
- ✅ `createExerciseTemplate`
- ✅ `updateExerciseTemplate` ← **Primary fix**
- ✅ `deleteExerciseTemplate`

### User Management
- ✅ `createUser`
- ✅ `updateUser`
- ✅ `deleteUser`

### Organization/Tenant Management
- ✅ `createOrganization`
- ✅ `updateOrganization`
- ✅ `deleteOrganization`

### Workout Template Management
- ✅ `createWorkoutTemplate`
- ✅ `updateWorkoutTemplate`
- ✅ `deleteWorkoutTemplate`

### Equipment Management
- ✅ `createEquipment`
- ✅ `updateEquipment`
- ✅ `deleteEquipment`

### Export/Import Operations
- ✅ `exportTenant`
- ✅ `exportGlobalData`
- ✅ `exportAll`
- ✅ `importTenant`
- ✅ `importGlobalData`

### Backup Operations
- ✅ `restoreFromBackup`

## Files Modified
- `apps/admin/src/lib/api.ts` - All tRPC POST methods updated (22 methods)

## Technical Details

### Why the `json` Property is Required
tRPC's HTTP adapter expects POST request bodies to be in the format:
```json
{
  "json": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

This is part of tRPC's batching and type-safety features. The `json` property distinguishes data payloads from batch requests and other metadata.

### GET Requests
Note that GET requests to tRPC endpoints use query parameters and don't need this wrapper:
```typescript
// GET requests are correct (no change needed)
const response = await fetch(
  `${this.baseUrl}/api/trpc/admin.getExerciseTemplates?input=${encodeURIComponent(JSON.stringify(params))}`
)
```

### Direct Endpoints
Direct (non-tRPC) endpoints like `/api/admin/auth/login` don't use this format and were left unchanged.

## Testing Recommendations

### Manual Testing
1. Navigate to https://admin.rythm.training/exercises
2. Click "Edit" on any exercise template
3. Modify any field (name, muscle groups, equipment, etc.)
4. Click "Update Exercise"
5. Verify the update succeeds and the exercise is updated in the list

### Additional Test Cases
- Create a new exercise template
- Delete an exercise template
- Update other admin resources (users, organizations, equipment)
- Test import/export operations
- Test backup restore operations

### Expected Results
- All update operations should return 200/201 status codes
- No more 400 Bad Request errors
- Exercise templates should persist changes correctly

## Prevention
To prevent similar issues in the future:

1. **Pattern Recognition**: When adding new tRPC POST endpoints, always use the `{ json: data }` wrapper
2. **Documentation**: Reference this document and `archive/REGISTRATION_FIX_SUMMARY.md`
3. **Code Review**: Check that all tRPC POST methods follow the correct pattern
4. **Consider tRPC Client**: For future improvements, consider using the official tRPC client library instead of raw fetch calls, which would handle this formatting automatically

## Related Documentation
- `archive/REGISTRATION_FIX_SUMMARY.md` - Similar issue with registration
- tRPC Documentation: https://trpc.io/docs/v10/fetch

## Status
✅ **Fixed and Ready for Deployment**

All changes have been committed and pushed to the branch. The fix is minimal, focused, and doesn't introduce any new type errors or breaking changes.
