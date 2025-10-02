# API Schemas and Data Models

This document describes the data models and validation schemas used throughout the RYTHM API.

## Overview

RYTHM uses [Zod](https://github.com/colinhacks/zod) for schema validation and type generation. All API endpoints validate input using Zod schemas, ensuring type safety and data integrity.

## Location

Shared schemas are defined in: `packages/shared/src/schemas.ts`

## Core Data Models

### User

```typescript
interface User {
  user_id: string;          // UUID
  tenant_id: string;        // UUID
  email: string;            // Valid email format
  first_name: string;       // 1-100 characters
  last_name: string;        // 1-100 characters
  role: UserRole;           // Enum
  avatar_url?: string;      // URL or null
  bio?: string;             // Max 2000 characters
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

enum UserRole {
  ATHLETE = 'athlete',
  COACH = 'coach',
  TENANT_ADMIN = 'tenant_admin',
  ORG_ADMIN = 'org_admin',
  SYSTEM_ADMIN = 'system_admin'
}
```

**Zod Schema**:
```typescript
const UserSchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: z.enum(['athlete', 'coach', 'tenant_admin', 'org_admin', 'system_admin']),
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  is_active: z.boolean(),
  last_login: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
```

### Workout Template

```typescript
interface WorkoutTemplate {
  template_id: string;      // UUID
  tenant_id?: string;       // UUID or null
  user_id?: string;         // UUID or null
  created_by: string;       // UUID
  name: string;             // 1-255 characters
  description?: string;     // Optional text
  scope: TemplateScope;     // Enum
  category?: string;        // 'strength' | 'cardio' | 'hybrid'
  exercises: Exercise[];    // Array of exercises
  estimated_duration?: number; // Minutes
  difficulty_level?: number;   // 1-5
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

enum TemplateScope {
  USER = 'user',
  TENANT = 'tenant',
  SYSTEM = 'system'
}
```

**Zod Schema**:
```typescript
const WorkoutTemplateSchema = z.object({
  template_id: z.string().uuid(),
  tenant_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  created_by: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  scope: z.enum(['user', 'tenant', 'system']),
  category: z.enum(['strength', 'cardio', 'hybrid']).optional(),
  exercises: z.array(ExerciseSchema),
  estimated_duration: z.number().int().positive().optional(),
  difficulty_level: z.number().int().min(1).max(5).optional(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
```

### Session

```typescript
interface Session {
  session_id: string;           // UUID
  tenant_id: string;            // UUID
  user_id: string;              // UUID
  program_id?: string;          // UUID or null
  template_id?: string;         // UUID or null
  name?: string;                // Optional session name
  category: SessionCategory;    // Enum (required)
  notes?: string;               // Optional text
  started_at: Date;             // Timestamp
  completed_at?: Date;          // Timestamp or null
  duration_seconds?: number;    // Calculated duration
  training_load?: number;       // Calculated load
  perceived_exertion?: number;  // 0-10, decimal
  created_at: Date;
  updated_at: Date;
}

enum SessionCategory {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  HYBRID = 'hybrid'
}
```

**Zod Schema**:
```typescript
const SessionSchema = z.object({
  session_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  program_id: z.string().uuid().nullable().optional(),
  template_id: z.string().uuid().nullable().optional(),
  name: z.string().max(255).optional(),
  category: z.enum(['strength', 'cardio', 'hybrid']),
  notes: z.string().optional(),
  started_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable().optional(),
  duration_seconds: z.number().int().positive().optional(),
  training_load: z.number().int().optional(),
  perceived_exertion: z.number().min(0).max(10).optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
```

### Set

```typescript
interface Set {
  set_id: string;          // UUID
  session_id: string;      // UUID
  exercise_id: string;     // UUID
  set_number: number;      // 1-based index
  reps?: number;           // Optional count
  weight_kg?: number;      // Decimal, max 9999.99
  distance_m?: number;     // Decimal, max 99,999,999.99
  duration_m?: number;     // Decimal (minutes), max 999,999.99
  calories?: number;       // Integer
  rpe?: number;            // 0-10, decimal
  notes?: string;          // Optional text
  completed_at?: Date;     // Timestamp or null
  created_at: Date;
  updated_at: Date;
}
```

**Zod Schema**:
```typescript
const SetSchema = z.object({
  set_id: z.string().uuid(),
  session_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  set_number: z.number().int().positive(),
  reps: z.number().int().positive().optional(),
  weight_kg: z.number().positive().max(9999.99).optional(),
  distance_m: z.number().positive().max(99999999.99).optional(),
  duration_m: z.number().positive().max(999999.99).optional(),
  calories: z.number().int().positive().optional(),
  rpe: z.number().min(0).max(10).optional(),
  notes: z.string().optional(),
  completed_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
```

### Exercise Template

```typescript
interface ExerciseTemplate {
  template_id: string;         // UUID
  name: string;                // 1-255 characters
  description?: string;        // Optional text
  exercise_type: ExerciseType; // Enum
  muscle_groups?: string[];    // Array of muscle names
  equipment?: string[];        // Array of equipment names
  instructions?: string;       // Optional HTML/markdown
  video_url?: string;          // URL or null
  thumbnail_url?: string;      // URL or null
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

enum ExerciseType {
  STRENGTH = 'STRENGTH',
  CARDIO = 'CARDIO'
}
```

**Zod Schema**:
```typescript
const ExerciseTemplateSchema = z.object({
  template_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  exercise_type: z.enum(['STRENGTH', 'CARDIO']),
  muscle_groups: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  video_url: z.string().url().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
```

## Input Validation Schemas

### Authentication

**Login Request**:
```typescript
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  keepMeLoggedIn: z.boolean().optional().default(false),
});
```

**Register Request**:
```typescript
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[a-z]/, "Password must contain lowercase letter")
    .regex(/[0-9]/, "Password must contain number"),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  tenant_id: z.string().uuid().optional(),
});
```

### Profile Update

```typescript
const ProfileUpdateSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});
```

### Session Creation

```typescript
const CreateSessionSchema = z.object({
  name: z.string().max(255).optional(),
  category: z.enum(['strength', 'cardio', 'hybrid']),
  template_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  started_at: z.coerce.date().optional(),
});
```

### Set Creation

```typescript
const CreateSetSchema = z.object({
  exercise_id: z.string().uuid(),
  set_number: z.number().int().positive(),
  reps: z.number().int().positive().optional(),
  weight_kg: z.number().positive().max(9999.99).optional(),
  distance_m: z.number().positive().optional(),
  duration_m: z.number().positive().optional(),
  calories: z.number().int().positive().optional(),
  rpe: z.number().min(0).max(10).optional(),
  notes: z.string().optional(),
});
```

### Template Creation

```typescript
const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  scope: z.enum(['user', 'tenant', 'system']).default('system'),
  category: z.enum(['strength', 'cardio', 'hybrid']).optional(),
  exercises: z.array(z.object({
    exercise_id: z.string().uuid(),
    order: z.number().int().positive(),
    sets: z.number().int().positive().optional(),
    reps: z.number().int().positive().optional(),
    rest_seconds: z.number().int().positive().optional(),
  })),
  estimated_duration: z.number().int().positive().optional(),
  difficulty_level: z.number().int().min(1).max(5).optional(),
});
```

## Response Schemas

### Success Response

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});
```

### Paginated Response

```typescript
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  });
```

## Validation Helpers

### Usage in API Routes

```typescript
import { z } from 'zod';
import { CreateSessionSchema } from '@rythm/shared';

export const createSession = async (input: unknown) => {
  // Validate input
  const validated = CreateSessionSchema.parse(input);
  
  // validated is now typed and safe to use
  const session = await db.sessions.create({
    ...validated,
    user_id: ctx.user.userId,
    tenant_id: ctx.user.tenantId,
  });
  
  return session;
};
```

### Error Handling

```typescript
try {
  const validated = LoginSchema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.errors,
      },
    };
  }
  throw error;
}
```

## Type Generation

TypeScript types are automatically inferred from Zod schemas:

```typescript
// Infer types from schemas
type User = z.infer<typeof UserSchema>;
type Session = z.infer<typeof SessionSchema>;
type CreateSession = z.infer<typeof CreateSessionSchema>;

// Use in functions
function processUser(user: User) {
  // user is fully typed
  console.log(user.first_name);
}
```

## Validation Rules

### Common Constraints

- **UUIDs**: All IDs use UUID v4 format
- **Emails**: RFC 5322 compliant
- **Passwords**: Min 8 chars, max 100, requires uppercase, lowercase, number
- **Names**: Min 1 char, max 100 chars
- **Decimals**: Appropriate precision for physical measurements
- **Enums**: Strict string literal types
- **Dates**: Coerced to Date objects from ISO strings

### Custom Validators

```typescript
// Duration must be positive and reasonable
const durationValidator = z.number()
  .positive()
  .max(999999.99)
  .refine(val => val > 0, "Duration must be greater than 0");

// Weight must be realistic
const weightValidator = z.number()
  .positive()
  .max(9999.99)
  .refine(val => val <= 500, "Weight seems unrealistic");
```

## Related Documentation

- **[API Endpoints](endpoints.md)** - How to use these schemas in API calls
- **[Authentication](authentication.md)** - Auth-specific schemas
- **[Database Design](../architecture/database.md)** - Database schema matching

---

*For implementation examples, see `packages/shared/src/schemas.ts`*
