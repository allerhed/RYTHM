# Exercise Template Update Fix - Equipment ID Field

## Issue
When editing an exercise template in the admin UI and trying to save, the following error occurred:
```
POST https://api.rythm.training/api/trpc/admin.updateExerciseTemplate 400 (Bad Request)
Error saving exercise template: Error: HTTP 400
```

## Root Cause
The admin UI form (`ExerciseModal.tsx`) was sending an `equipment_id` field as part of the form data when updating an exercise template. However, the API endpoint's Zod schema for `updateExerciseTemplate` in `/apps/api/src/routes/admin.ts` did not include `equipment_id` in the accepted fields.

This created an inconsistency:
- `createExerciseTemplate` accepted `equipment_id` ✅
- `updateExerciseTemplate` did NOT accept `equipment_id` ❌

When the admin UI spread `...formData` (which includes `equipment_id`), Zod rejected the request with a 400 Bad Request.

## Solution
Added `equipment_id: z.string().optional()` to the `updateExerciseTemplate` Zod schema to match the `createExerciseTemplate` schema.

## Files Changed

### 1. `/apps/api/src/routes/admin.ts`
**Before:**
```typescript
updateExerciseTemplate: adminProcedure
  .input(z.object({
    template_id: z.string(),
    name: z.string().optional(),
    muscle_groups: z.array(z.string()).optional(),
    equipment: z.string().optional(),
    exercise_category: z.string().optional(),
    exercise_type: z.enum(['STRENGTH', 'CARDIO']).optional(),
    default_value_1_type: z.string().optional(),
    default_value_2_type: z.string().optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
  }))
```

**After:**
```typescript
updateExerciseTemplate: adminProcedure
  .input(z.object({
    template_id: z.string(),
    name: z.string().optional(),
    muscle_groups: z.array(z.string()).optional(),
    equipment: z.string().optional(),
    equipment_id: z.string().optional(),  // ← ADDED
    exercise_category: z.string().optional(),
    exercise_type: z.enum(['STRENGTH', 'CARDIO']).optional(),
    default_value_1_type: z.string().optional(),
    default_value_2_type: z.string().optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
  }))
```

### 2. `/apps/admin/src/lib/api.ts`
Updated TypeScript interfaces to include `equipment_id`:

**CreateExerciseTemplateData:**
```typescript
interface CreateExerciseTemplateData {
  name: string
  muscle_groups: string[]
  equipment?: string
  equipment_id?: string  // ← ADDED
  exercise_category: string
  exercise_type: 'STRENGTH' | 'CARDIO'
  default_value_1_type: string
  default_value_2_type: string
  description?: string
  instructions?: string
}
```

**UpdateExerciseTemplateData:**
```typescript
interface UpdateExerciseTemplateData {
  template_id: string
  name?: string
  muscle_groups?: string[]
  equipment?: string
  equipment_id?: string  // ← ADDED
  exercise_category?: string
  exercise_type?: 'STRENGTH' | 'CARDIO'
  default_value_1_type?: string
  default_value_2_type?: string
  description?: string
  instructions?: string
}
```

## Testing
To verify the fix:
1. Navigate to https://admin.rythm.training/exercises
2. Click "Edit" on any exercise template
3. Modify any field (name, muscle groups, equipment, etc.)
4. Click "Update Exercise Template"
5. Verify the update succeeds without 400 errors ✅

## Impact
- ✅ Exercise template updates now work correctly in the admin UI
- ✅ Schema consistency between create and update operations
- ✅ Support for equipment_id in both create and update operations
- ✅ No breaking changes - added optional field only

## Related
This fix is similar to the scope field issue documented in `EXERCISE_UPDATE_FIX.md`, where inconsistencies between frontend form data and backend Zod schemas caused validation errors.
