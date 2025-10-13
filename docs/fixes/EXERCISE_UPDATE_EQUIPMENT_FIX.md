# Exercise Template Update Fix - Equipment ID Field

## Issue
When editing an exercise template in the admin UI and trying to save, the following error occurred:
```
POST https://api.rythm.training/api/trpc/admin.updateExerciseTemplate 400 (Bad Request)
Error saving exercise template: Error: HTTP 400
```

## Root Causes

### Issue 1: Missing equipment_id in API Schema
The admin UI form (`ExerciseModal.tsx`) was sending an `equipment_id` field as part of the form data when updating an exercise template. However, the API endpoint's Zod schema for `updateExerciseTemplate` in `/apps/api/src/routes/admin.ts` did not include `equipment_id` in the accepted fields.

This created an inconsistency:
- `createExerciseTemplate` accepted `equipment_id` ✅
- `updateExerciseTemplate` did NOT accept `equipment_id` ❌

When the admin UI spread `...formData` (which includes `equipment_id`), Zod rejected the request with a 400 Bad Request.

### Issue 2: Missing equipment_id in TypeScript Interfaces
The `ExerciseTemplate` interface in `/apps/admin/src/lib/api.ts` was missing the `equipment_id` field, which meant:
- TypeScript couldn't properly type-check the property
- The form couldn't access `exerciseTemplate.equipment_id` when loading existing templates
- Equipment selection was not preserved when editing templates

### Issue 3: Form Not Preserving equipment_id
In `ExerciseModal.tsx`, when loading an existing exercise template for editing, the `equipment_id` was hardcoded to an empty string `''` instead of using the actual value from the template:
```typescript
equipment_id: '', // Will be populated based on equipment lookup  ❌
```

This meant the equipment dropdown would always reset to "Select equipment (optional)" when editing, even if the template had equipment selected.

## Solutions

### Fix 1: Added equipment_id to API Schema
Added `equipment_id: z.string().optional()` to the `updateExerciseTemplate` Zod schema to match the `createExerciseTemplate` schema.

**File:** `/apps/api/src/routes/admin.ts`

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

Also added debug logging to help diagnose future issues:
```typescript
console.log('🔧 updateExerciseTemplate called with input:', JSON.stringify(input, null, 2));
console.log('📝 Update data:', JSON.stringify(updateData, null, 2));
```

### Fix 2: Added equipment_id to TypeScript Interfaces
Updated all relevant TypeScript interfaces to include `equipment_id`.

**File:** `/apps/admin/src/lib/api.ts`

**ExerciseTemplate Interface:**
```typescript
interface ExerciseTemplate {
  template_id: string
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
  created_at: string
  updated_at?: string
}
```

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

### Fix 3: Form Properly Preserves equipment_id
Updated the form initialization in `ExerciseModal.tsx` to use the actual `equipment_id` from the template.

**File:** `/apps/admin/src/components/ExerciseModal.tsx`

**Before:**
```typescript
useEffect(() => {
  if (exerciseTemplate) {
    setFormData({
      name: exerciseTemplate.name,
      muscle_groups: exerciseTemplate.muscle_groups,
      equipment: exerciseTemplate.equipment || '',
      equipment_id: '', // ❌ Always empty
      // ... rest of fields
    })
  }
}, [exerciseTemplate])
```

**After:**
```typescript
useEffect(() => {
  if (exerciseTemplate) {
    setFormData({
      name: exerciseTemplate.name,
      muscle_groups: exerciseTemplate.muscle_groups,
      equipment: exerciseTemplate.equipment || '',
      equipment_id: exerciseTemplate.equipment_id || '', // ✅ Uses actual value
      // ... rest of fields
    })
  }
}, [exerciseTemplate])
```

## Testing
To verify the fix:
1. Wait for deployment to complete (~10-15 minutes)
2. Navigate to https://admin.rythm.training/exercises
3. Click "Edit" on any exercise template that has equipment assigned
4. Verify the equipment dropdown shows the correct equipment
5. Modify any field (name, muscle groups, equipment, etc.)
6. Click "Update Exercise Template"
7. Verify the update succeeds without 400 errors ✅
8. Verify the equipment selection is preserved ✅

## Impact
- ✅ Exercise template updates now work correctly in the admin UI
- ✅ Schema consistency between create and update operations
- ✅ Support for equipment_id in both create and update operations
- ✅ Equipment selection is properly preserved when editing templates
- ✅ TypeScript provides proper type checking for equipment_id field
- ✅ No breaking changes - only added optional fields
- ✅ Added debug logging for easier troubleshooting

## Deployment Status
- **Commit 1:** `ffd5995` - Added equipment_id to schemas (deployed ✓)
- **Commit 2:** `e9798af` - Fixed form and interfaces (deploying...)

## Related
This fix is similar to the scope field issue documented in `EXERCISE_UPDATE_FIX.md`, where inconsistencies between frontend form data and backend Zod schemas caused validation errors.
