import { z } from 'zod';

// Base enums matching the PRD
export const SessionCategory = z.enum(['strength', 'cardio', 'hybrid']);
export const SetValueType = z.enum(['weight_kg', 'distance_m', 'duration_s', 'calories']);
export const UserRole = z.enum(['athlete', 'coach', 'tenant_admin', 'org_admin']);

export type SessionCategory = z.infer<typeof SessionCategory>;
export type SetValueType = z.infer<typeof SetValueType>;
export type UserRole = z.infer<typeof UserRole>;

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