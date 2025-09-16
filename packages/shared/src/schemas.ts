import { z } from 'zod';

// Base enums matching the PRD
export const SessionCategory = z.enum(['strength', 'cardio', 'hybrid']);
export const SetValueType = z.enum(['weight_kg', 'distance_m', 'duration_s', 'calories', 'reps']);
export const UserRole = z.enum(['athlete', 'coach', 'tenant_admin', 'org_admin']);
export const TemplateScope = z.enum(['user', 'tenant', 'system']);

export type SessionCategory = z.infer<typeof SessionCategory>;
export type SetValueType = z.infer<typeof SetValueType>;
export type UserRole = z.infer<typeof UserRole>;
export type TemplateScope = z.infer<typeof TemplateScope>;

// Value type constants and helpers
export const VALUE_TYPE_LABELS = {
  weight_kg: 'Weight (kg)',
  distance_m: 'Distance (m)',
  duration_s: 'Duration (s)',
  calories: 'Calories',
  reps: 'Reps',
} as const;

export const VALUE_TYPE_UNITS = {
  weight_kg: 'kg',
  distance_m: 'm',
  duration_s: 's',
  calories: 'cal',
  reps: 'reps',
} as const;

export const VALUE_TYPE_PLACEHOLDERS = {
  weight_kg: 'e.g., 75, 80, 85',
  distance_m: 'e.g., 1000, 5000',
  duration_s: 'e.g., 30, 60, 120',
  calories: 'e.g., 200, 300',
  reps: 'e.g., 8-10, 12, AMRAP',
} as const;

// Common value type combinations for different exercise types
export const COMMON_VALUE_TYPE_COMBINATIONS = {
  strength: [
    { value_1_type: 'weight_kg' as const, value_2_type: 'reps' as const, label: 'Weight × Reps' },
    { value_1_type: 'reps' as const, value_2_type: null, label: 'Reps Only' },
  ],
  cardio: [
    { value_1_type: 'duration_s' as const, value_2_type: 'distance_m' as const, label: 'Duration × Distance' },
    { value_1_type: 'duration_s' as const, value_2_type: null, label: 'Duration Only' },
    { value_1_type: 'distance_m' as const, value_2_type: null, label: 'Distance Only' },
    { value_1_type: 'calories' as const, value_2_type: null, label: 'Calories Only' },
  ],
  hybrid: [
    { value_1_type: 'weight_kg' as const, value_2_type: 'reps' as const, label: 'Weight × Reps' },
    { value_1_type: 'duration_s' as const, value_2_type: 'distance_m' as const, label: 'Duration × Distance' },
    { value_1_type: 'reps' as const, value_2_type: null, label: 'Reps Only' },
    { value_1_type: 'duration_s' as const, value_2_type: null, label: 'Duration Only' },
  ],
} as const;

// Core entity schemas
export const TenantSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  branding: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const UserSchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  password_hash: z.string(),
  role: UserRole,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  muscle_groups: z.array(z.string()),
  equipment: z.string().optional(),
  media: z.record(z.any()).optional(),
  notes: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const SessionSchema = z.object({
  session_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  program_id: z.string().uuid().optional(),
  started_at: z.date(),
  completed_at: z.date().optional(),
  category: SessionCategory,
  notes: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const SetSchema = z.object({
  set_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  session_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  set_index: z.number().int().positive(),
  reps: z.number().int().positive().optional(),
  value_1_type: SetValueType.optional(),
  value_1_numeric: z.number().nonnegative().optional(),
  value_2_type: SetValueType.optional(),
  value_2_numeric: z.number().nonnegative().optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ProgramSchema = z.object({
  program_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  duration_weeks: z.number().int().positive(),
  created_at: z.date(),
  updated_at: z.date(),
});

// API schemas for requests/responses
export const CreateSessionRequest = z.object({
  category: SessionCategory,
  program_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const CreateSetRequest = z.object({
  exercise_id: z.string().uuid(),
  reps: z.number().int().positive().optional(),
  value_1_type: SetValueType.optional(),
  value_1_numeric: z.number().nonnegative().optional(),
  value_2_type: SetValueType.optional(),
  value_2_numeric: z.number().nonnegative().optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export const AnalyticsFilters = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
  category: SessionCategory.optional(),
  muscle_group: z.string().optional(),
});

// Computed metrics schemas
export const VolumeMetrics = z.object({
  total_volume: z.number(),
  strength_volume: z.number(),
  cardio_distance: z.number(),
  total_duration: z.number(),
  session_count: z.number(),
});

export const PRRecord = z.object({
  exercise_id: z.string().uuid(),
  exercise_name: z.string(),
  pr_type: z.enum(['weight', '1rm_estimate', 'distance', 'duration']),
  value: z.number(),
  achieved_at: z.date(),
});

// Workout Template schemas
export const TemplateExercise = z.object({
  exercise_id: z.string().uuid().optional(), // Optional for custom exercises
  name: z.string().min(1).max(255),
  category: SessionCategory,
  muscle_groups: z.array(z.string()),
  sets: z.number().int().positive(),
  // Configurable value types instead of hardcoded reps/weight/duration
  value_1_type: SetValueType.optional(),
  value_1_default: z.string().optional(), // e.g., "75", "30", "100"
  value_2_type: SetValueType.optional(),
  value_2_default: z.string().optional(), // e.g., "8-10", "2 min", "1km"
  notes: z.string().optional(),
  rest_time: z.string().optional(), // e.g., "60s", "2-3 min", etc.
  order: z.number().int().nonnegative().default(0),
});

export const WorkoutTemplateSchema = z.object({
  template_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid().optional(), // NULL for tenant/system templates
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  scope: TemplateScope,
  exercises: z.array(TemplateExercise),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional(),
});

export const CreateWorkoutTemplateRequest = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  scope: TemplateScope.default('user'),
  exercises: z.array(TemplateExercise),
});

export const UpdateWorkoutTemplateRequest = z.object({
  template_id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  scope: TemplateScope.optional(),
  exercises: z.array(TemplateExercise).optional(),
});

export const WorkoutTemplateFilters = z.object({
  scope: TemplateScope.optional(),
  search: z.string().optional(),
  category: SessionCategory.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

// Export types
export type Tenant = z.infer<typeof TenantSchema>;
export type User = z.infer<typeof UserSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Set = z.infer<typeof SetSchema>;
export type Program = z.infer<typeof ProgramSchema>;

export type CreateSessionRequest = z.infer<typeof CreateSessionRequest>;
export type CreateSetRequest = z.infer<typeof CreateSetRequest>;
export type AnalyticsFilters = z.infer<typeof AnalyticsFilters>;
export type VolumeMetrics = z.infer<typeof VolumeMetrics>;
export type PRRecord = z.infer<typeof PRRecord>;

export type TemplateExercise = z.infer<typeof TemplateExercise>;
export type WorkoutTemplate = z.infer<typeof WorkoutTemplateSchema>;
export type CreateWorkoutTemplateRequest = z.infer<typeof CreateWorkoutTemplateRequest>;
export type UpdateWorkoutTemplateRequest = z.infer<typeof UpdateWorkoutTemplateRequest>;
export type WorkoutTemplateFilters = z.infer<typeof WorkoutTemplateFilters>;