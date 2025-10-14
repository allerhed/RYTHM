# Agent Instructions — RYTHM Hybrid Training Platform

> **Purpose**: This file provides comprehensive guidance for AI coding agents (GitHub Copilot Workspace, Aider, Cursor, etc.) working in the RYTHM repository. It complements the Copilot instructions and UI guidelines with agent-specific workflows and best practices.

---

## Overview

**RYTHM** is a multi-tenant hybrid training platform with:
- **Mobile PWA** (Next.js, offline-capable)
- **Admin Web Dashboard** (Next.js)
- **tRPC API** (Node/TypeScript, Zod validation)
- **PostgreSQL 15+** with Row Level Security (RLS)
- **Azure Container Apps** deployment

This repository uses a structured approach to AI-assisted development:

1. **`.github/copilot-instructions.md`** — Core coding standards, tRPC patterns, Azure deployment guidelines
2. **`.github/instructions/ui.instructions.md`** — UI/UX design principles and accessibility requirements
3. **`docs/TRPC_CODING_STANDARDS.md`** — tRPC indentation, payload normalization, and gotchas
4. **`agent.md`** (this file) — Agent workflows, decision trees, and advanced patterns

**Key Principle**: Agents should maximize autonomy while maintaining code quality, Azure-readiness, and tRPC best practices.

---

## Agent Capabilities & Workflows

### 1) Discovery Phase

Before making changes, agents should:

1. **Read project instructions** (`.github/copilot-instructions.md`, `docs/TRPC_CODING_STANDARDS.md`, `.github/instructions/*.md`)
2. **Understand RYTHM domain rules**:
   - Sessions: `category ∈ {strength, cardio, hybrid}` (required)
   - Sets: Two configurable value types from `{weight_kg, distance_m, duration_m, calories}`
   - 98 exercise templates (68 strength, 30 cardio) for fresh deployments
   - All durations in **minutes** (not seconds)
3. **Explore repository structure** using file search and semantic search
4. **Identify tRPC patterns** (payload normalization, indentation, RLS policies)
5. **Check for dependencies** and Azure deployment requirements
6. **Review recent commits** to understand ongoing work

**Decision Tree:**
```
User Request
  ├─ Is it a new tRPC endpoint?
  │   ├─ Check docs/TRPC_CODING_STANDARDS.md
  │   ├─ Use payload normalization pattern (raw + { json: ... })
  │   ├─ Verify proper indentation (4 spaces for .input/.mutation)
  │   ├─ Add RLS policies if tenant-scoped
  │   └─ Plan implementation with user
  │
  ├─ Is it a database change?
  │   ├─ Check existing schema in packages/db/
  │   ├─ Write idempotent migration with rollback comment
  │   ├─ Update RLS policies if needed
  │   └─ Consider Azure PostgreSQL compatibility
  │
  ├─ Is it a bug fix?
  │   ├─ Reproduce the issue (check payload shapes for tRPC)
  │   ├─ Locate the root cause (indentation? payload wrapper?)
  │   ├─ Check for related code
  │   └─ Fix + add regression test
  │
  └─ Is it Azure deployment related?
      ├─ Review azure.yaml and Dockerfiles
      ├─ Ensure stateless design
      ├─ Add/update health checks
      └─ Verify environment variable handling
```

---

### 2) Implementation Strategy

#### Multi-File Changes

When changes span multiple files:

1. **Create a plan** and share with user
2. **Identify dependencies** between changes
3. **Order changes logically** (types → implementations → tests)
4. **Use multi-file edit tools** when available
5. **Validate incrementally** (run tests after each logical step)

#### Testing Strategy

- **Unit tests**: Required for business logic, calculations (pace, 1RM), validators
- **Integration tests**: Required for tRPC endpoints + DB with test schema (wrap in transaction, rollback)
- **RLS tests**: Prove cross-tenant queries fail; same-tenant succeed
- **E2E tests**: Offline log → reconnect → conflict resolution (server wins with deterministic merge)

**When to skip tests:**
- Trivial type changes
- Documentation updates
- Configuration tweaks (with user approval)

**RYTHM-specific test examples:**
```typescript
// Unit: Pace calculator (duration in minutes)
describe('pace', () => {
  it('computes m/s when both inputs valid', () => {
    // Note: duration_m is in minutes, convert to seconds for pace
    expect(pace(2000, 6.67)).toBeCloseTo(5, 1); // 2000m / (6.67min * 60s/min) = 5 m/s
  });
  it('throws on zero/negative duration', () => {
    expect(() => pace(1000, 0)).toThrow();
  });
});

// Integration: tRPC endpoint with RLS
describe('admin.deleteExerciseTemplate', () => {
  it('deletes template when admin authenticated', async () => {
    const result = await caller.admin.deleteExerciseTemplate({
      template_id: testTemplateId,
    });
    expect(result.success).toBe(true);
  });
  
  it('rejects cross-tenant delete (RLS)', async () => {
    await expect(
      otherTenantCaller.admin.deleteExerciseTemplate({
        template_id: testTemplateId,
      })
    ).rejects.toThrow();
  });
});
```

#### Error Handling Pattern

**RYTHM uses tRPC with Zod validation — never throw raw errors:**

```typescript
// tRPC endpoint pattern
import { z } from 'zod';
import { adminProcedure, router } from '../trpc';

// Define input schema (tolerates { json: ... } wrapper)
const payloadSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().optional(),
});

export const exampleRouter = router({
  updateTemplate: adminProcedure
    .input(
      z.union([
        payloadSchema,
        z.object({ json: payloadSchema }),
      ]).transform((payload) => ('json' in payload ? payload.json : payload))
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Business logic with RLS active
        const result = await db.updateTemplate({
          template_id: input.templateId,
          name: input.name,
        });
        
        return result;
      } catch (error) {
        // Log error with context
        console.error('Update failed', { error, input, userId: ctx.user?.id });
        
        // Typed errors map to tRPC error codes
        if (error.code === '23505') { // unique violation
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Template name already exists',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Update failed',
        });
      }
    }),
});
```

**Email Service Pattern (CRITICAL):**
```typescript
// ALWAYS use EmailService, never Azure SDK directly
import { emailService } from '../services/EmailService';

await emailService.sendBackupNotification({
  to: adminEmail,
  tenantId: tenant.id,
  tenantName: tenant.name,
  backupId: backup.id,
  status: 'success',
  size: backup.size,
  duration: backup.duration,
});
// Automatically logs to email_logs table with metadata
```

---

### 3) Code Quality Guidelines

#### Type Safety

- **Always use TypeScript strict mode** (RYTHM has `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Define Zod schemas at tRPC boundaries** (mirror DB constraints)
- **Avoid `any`** — use `unknown` with type guards or Zod parsing
- **Use discriminated unions** for state management (e.g., session categories)

**RYTHM Pattern:**
```typescript
// Zod schema mirrors DB and handles optional fields
export const SessionCreateSchema = z.object({
  category: z.enum(['strength', 'cardio', 'hybrid']),
  startedAt: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

export type SessionCreate = z.infer<typeof SessionCreateSchema>;
```

#### Validation

```typescript
// Input validation pattern with Zod
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin', 'moderator']),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Use at API boundary
export async function createUser(rawInput: unknown) {
  const input = CreateUserSchema.parse(rawInput); // Throws on invalid
  // ... implementation
}
```

#### Database Operations

- **Use transactions** for multi-step operations
- **Implement idempotent operations** (migrations MUST be idempotent)
- **Add PostgreSQL migrations** in `packages/db/migrations/`
- **Include rollback comment** (`-- To rollback: ...`)
- **Test with RLS enabled** — RYTHM uses Row Level Security on all tenant tables
- **Compatible with Azure PostgreSQL Flexible Server**

**RYTHM Migration Pattern:**
```sql
-- Migration: add_exercise_equipment_id.sql
-- Idempotent, transactional, rollback comment
-- Compatible with Azure PostgreSQL Flexible Server

BEGIN;

-- Add equipment_id column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='exercise_templates' AND column_name='equipment_id'
  ) THEN
    ALTER TABLE exercise_templates 
      ADD COLUMN equipment_id UUID REFERENCES equipment(equipment_id);
    
    CREATE INDEX IF NOT EXISTS idx_exercise_templates_equipment 
      ON exercise_templates(equipment_id);
  END IF;
END $$;

-- Update RLS policies if needed
DROP POLICY IF EXISTS tenant_exercise_templates ON exercise_templates;
CREATE POLICY tenant_exercise_templates ON exercise_templates
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

COMMIT;

-- To rollback:
-- ALTER TABLE exercise_templates DROP COLUMN IF EXISTS equipment_id;
```

---

### 4) Azure Container Apps & Deployment

All RYTHM code must be **Azure-ready**, **containerized**, and **stateless**:

#### Dockerfile Best Practices (RYTHM Pattern)

```dockerfile
# Multi-stage build for Azure Container Apps
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runtime

# Run as non-root user for Azure security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

WORKDIR /app

# Copy built artifacts
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Health check required for Azure Container Apps
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:${PORT}/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE ${PORT}
CMD ["node", "dist/index.js"]
```

#### Environment Variables (Azure Container Apps)

```typescript
// Validate environment at startup - Azure Container Apps pattern
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Database (Azure PostgreSQL Flexible Server)
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  
  // Auth
  JWT_SECRET: z.string().min(32), // From Azure Key Vault
  JWT_EXPIRES_IN: z.string().default('15m'),
  
  // Server
  PORT: z.coerce.number().int().positive().default(3001),
  
  // Azure
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  APPLICATION_INSIGHTS_KEY: z.string().optional(),
  
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const env = EnvSchema.parse(process.env);
```

#### Health Checks (Required for Azure Container Apps)

```typescript
// REQUIRED: All RYTHM services must implement health endpoints
import { Router } from 'express';
import { db } from '@rythm/db';

export const healthRouter = Router();

// Basic liveness check
healthRouter.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Readiness check (verifies dependencies)
healthRouter.get('/health/ready', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check other dependencies if needed
    // await checkRedis();
    // await checkExternalAPI();
    
    res.status(200).json({ 
      status: 'ready',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
```

---

### 5) Security & RLS First

**RYTHM uses Row Level Security (RLS)** for multi-tenancy. All data-layer changes must preserve tenant isolation:

#### RLS Policy Pattern (RYTHM Standard)

```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tenant's data
CREATE POLICY sessions_tenant_isolation ON sessions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: Users can only insert into their own tenant
CREATE POLICY sessions_tenant_insert ON sessions
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### Setting Tenant Context (tRPC Middleware)

```typescript
// apps/api/src/middleware/tenant.ts
import { TRPCError } from '@trpc/server';
import { db } from '@rythm/db';

export const setTenantContext = async (tenantId: string) => {
  if (!tenantId) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED', 
      message: 'Missing tenant context' 
    });
  }
  
  // Set PostgreSQL session variable for RLS
  await db.query(
    `SELECT set_config('app.current_tenant_id', $1, false)`,
    [tenantId]
  );
};

// Usage in tRPC context
export const createTRPCContext = async ({ req }: CreateContextOptions) => {
  const tenantId = req.user?.tenant_id; // from JWT
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  return { db, user: req.user, tenantId };
};
```

#### Security Checklist

- [ ] All tenant-scoped tables have RLS enabled
- [ ] Policies verify `tenant_id` matches session context
- [ ] JWT contains `tenant_id` claim verified on write operations
- [ ] Secrets stored in Azure Key Vault (not env vars)
- [ ] All SQL queries use parameterized statements
- [ ] CORS deny-by-default with explicit origins
- [ ] Rate limiting on auth endpoints
- [ ] Health checks don't expose sensitive info

#### Testing RLS (REQUIRED for data-layer changes)

```typescript
// packages/db/tests/rls.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db, setTenantContext } from '@rythm/db';

describe('Sessions RLS Policies', () => {
  const tenant1Id = 'tenant-1-uuid';
  const tenant2Id = 'tenant-2-uuid';
  
  it('prevents cross-tenant reads', async () => {
    // Insert session for tenant 1
    await setTenantContext(tenant1Id);
    const session1 = await db.query(
      `INSERT INTO sessions (tenant_id, category) VALUES ($1, 'strength') RETURNING id`,
      [tenant1Id]
    );
    
    // Switch to tenant 2 - should not see tenant 1's data
    await setTenantContext(tenant2Id);
    const result = await db.query(
      `SELECT * FROM sessions WHERE id = $1`,
      [session1.rows[0].id]
    );
    
    expect(result.rows).toHaveLength(0); // RLS blocks access
  });
  
  it('prevents cross-tenant inserts', async () => {
    await setTenantContext(tenant2Id);
    
    // Attempt to insert into tenant 1 while context is tenant 2
    await expect(
      db.query(
        `INSERT INTO sessions (tenant_id, category) VALUES ($1, 'cardio')`,
        [tenant1Id] // Wrong tenant!
      )
    ).rejects.toThrow(); // RLS policy violation
  });
});
```

---

### 6) Performance Optimization

#### Database Queries (RYTHM Best Practices)

- **Use indexes** for frequently queried columns (tenant_id, user_id, timestamps)
- **Implement pagination** for list endpoints (admin search, workout history)
- **Avoid N+1 queries** — use joins or batch loading for sets/exercises
- **RLS overhead** — RLS adds query overhead; monitor performance in Azure

```typescript
// Pagination pattern for tRPC (RYTHM admin search example)
export const searchExercises = publicProcedure
  .input(
    z.object({
      query: z.string(),
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(20),
    })
  )
  .query(async ({ input, ctx }) => {
    const offset = (input.page - 1) * input.limit;
    
    const [exercises, total] = await Promise.all([
      ctx.db.query(
        `SELECT * FROM exercise_templates 
         WHERE name ILIKE $1 
         ORDER BY name ASC 
         LIMIT $2 OFFSET $3`,
        [`%${input.query}%`, input.limit, offset]
      ),
      ctx.db.query(
        `SELECT COUNT(*) FROM exercise_templates WHERE name ILIKE $1`,
        [`%${input.query}%`]
      ),
    ]);
    
    return {
      data: exercises.rows,
      pagination: {
        page: input.page,
        limit: input.limit,
        total: parseInt(total.rows[0].count),
        totalPages: Math.ceil(parseInt(total.rows[0].count) / input.limit),
      },
    };
  });
```

#### Caching Strategy (Azure-Ready)

```typescript
// Azure Cache for Redis pattern (future RYTHM enhancement)
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}
```

---

### 7) Logging & Observability (Azure-Ready)

**RYTHM uses structured JSON logs** for Azure Monitor integration:

#### Structured Logging (Pino)

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Usage with context
logger.info({ 
  userId: req.user?.id, 
  tenantId: req.user?.tenant_id,
  action: 'session_created' 
}, 'Workout session created');

logger.error({ 
  err: error, 
  correlationId: req.correlationId 
}, 'Database query failed');
```

#### Request Correlation (Azure Container Apps)

```typescript
// Correlation ID middleware for distributed tracing
import { randomUUID } from 'crypto';

export const correlationMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || randomUUID();
  res.setHeader('x-correlation-id', req.correlationId);
  
  // Add to logger context
  req.log = logger.child({ correlationId: req.correlationId });
  next();
};
```

#### Email Service Logging (CRITICAL)

**ALL emails MUST be logged to database** using `EmailService`:

```typescript
// CORRECT: Use EmailService for all emails
import { EmailService } from '../services/EmailService';

const emailService = new EmailService();

await emailService.sendBackupNotification({
  to: adminEmail,
  tenantId: tenant.id,
  tenantName: tenant.name,
  backupId: backup.id,
  status: 'success',
  size: '15MB',
  duration: '2.3s',
});

// WRONG: Never send emails directly via Azure SDK
// await emailClient.send({ ... }); // ❌ Missing database log
```

---

### 8) Git & Version Control

#### Commit Messages (RYTHM Standard)

Follow conventional commits with package scope:

```
feat(api): add session analytics endpoint
fix(mobile): resolve offline sync conflict resolution
refactor(db): extract RLS helpers to shared module
docs: update Azure deployment guide
test(api): add RLS policy integration tests
chore: update dependencies to latest stable versions
```

#### Branch Strategy (RYTHM)

- `main` — production-ready code (deployed to Azure Container Apps)
- `feature/*` — new features (e.g., `feature/exercise-templates`)
- `fix/*` — bug fixes (e.g., `fix/trpc-payload-wrapper`)
- `refactor/*` — refactoring work
- `docs/*` — documentation updates

---

### 9) Documentation Requirements (RYTHM)

#### Code Comments (TypeScript + JSDoc)

```typescript
/**
 * Calculates the 1RM (one-rep max) using Epley formula.
 * 
 * Formula: 1RM = weight * (1 + reps / 30)
 * 
 * @param weight - Weight lifted in kg
 * @param reps - Number of repetitions performed
 * @returns Estimated 1RM in kg
 * @throws {Error} If weight or reps are invalid (<=0)
 * 
 * @example
 * const oneRm = oneRmEpley(100, 5); // 116.67 kg
 */
export function oneRmEpley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) {
    throw new Error('Weight and reps must be positive');
  }
  return weight * (1 + reps / 30);
}
```

#### RYTHM-Specific Documentation

- **API routes**: Document tRPC procedures with input/output schemas
- **RLS policies**: Include policy descriptions in migration comments
- **Azure deployment**: Keep azure.yaml and Bicep templates documented
- **Domain rules**: Document exercise categories, set variables, analytics formulas

---

### 10) Agent Self-Improvement

#### When Stuck (RYTHM Context)

1. **Check copilot-instructions.md** — primary guidance source
2. **Search for similar patterns** — grep for tRPC procedures, RLS tests, etc.
3. **Review TRPC_CODING_STANDARDS.md** — for payload wrapper issues
4. **Propose multiple solutions** with Azure deployment trade-offs
5. **Request human review** for RLS policy changes and migrations

#### Learning from Feedback

- **Track common corrections** — e.g., tRPC payload wrapper pattern
- **Update approach** based on user preferences (commit frequency, testing depth)
- **Reference previous solutions** — RLS patterns, Azure health checks
- **Avoid repeated mistakes** — always validate tenant_id, never bypass RLS

---

## Common Patterns & Solutions (RYTHM)

### Database Migration Template (with RLS)

```sql
-- Migration: add_sets_value_types
-- Created: 2024-01-13
-- Description: Add configurable value type columns to sets table
-- RYTHM Requirement: Support two independent value types per set

-- ============================================
-- Up Migration
-- ============================================

BEGIN;

-- Create value type enum
CREATE TYPE set_value_type AS ENUM ('weight_kg', 'distance_m', 'duration_m', 'calories');

-- Add columns to sets table
ALTER TABLE sets 
  ADD COLUMN IF NOT EXISTS value_1_type set_value_type,
  ADD COLUMN IF NOT EXISTS value_1_numeric DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS value_2_type set_value_type,
  ADD COLUMN IF NOT EXISTS value_2_numeric DECIMAL(10, 2);

-- Add check constraint (values must be non-negative)
ALTER TABLE sets 
  ADD CONSTRAINT check_value_1_positive CHECK (value_1_numeric IS NULL OR value_1_numeric >= 0),
  ADD CONSTRAINT check_value_2_positive CHECK (value_2_numeric IS NULL OR value_2_numeric >= 0);

-- Enable RLS if not already enabled
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for tenant isolation
DROP POLICY IF EXISTS sets_tenant_isolation ON sets;
CREATE POLICY sets_tenant_isolation ON sets
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

DROP POLICY IF EXISTS sets_tenant_insert ON sets;
CREATE POLICY sets_tenant_insert ON sets
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

COMMIT;

-- ============================================
-- Down Migration (Rollback)
-- ============================================

-- BEGIN;
-- ALTER TABLE sets DROP COLUMN IF EXISTS value_1_type;
-- ALTER TABLE sets DROP COLUMN IF EXISTS value_1_numeric;
-- ALTER TABLE sets DROP COLUMN IF EXISTS value_2_type;
-- ALTER TABLE sets DROP COLUMN IF EXISTS value_2_numeric;
-- DROP TYPE IF EXISTS set_value_type;
-- COMMIT;
```

### tRPC Procedure Template (RYTHM)

```typescript
/**
 * Create a new workout session
 * 
 * Input: { category: 'strength' | 'cardio' | 'hybrid', startedAt?, notes? }
 * Output: Created session with camelCase fields
 * 
 * Constraints:
 * - Attaches tenant_id from JWT claims
 * - RLS enforced (no bypass)
 * - Returns 201 or problem+json on error
 * - Must be stateless for Azure Container Apps
 */
export const createSession = protectedProcedure
  .input(
    z.union([
      z.object({ json: SessionCreateSchema }).transform(({ json }) => json),
      SessionCreateSchema,
    ])
  )
  .mutation(async ({ input, ctx }) => {
    try {
      // Tenant context already set by middleware via ctx.user.tenant_id
      const session = await ctx.db.query(
        `INSERT INTO sessions (tenant_id, category, started_at, notes) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, tenant_id, category, started_at, notes, created_at`,
        [
          ctx.user.tenant_id,
          input.category,
          input.startedAt || new Date(),
          input.notes || null,
        ]
      );
      
      // Map snake_case to camelCase for client
      const result = mapSessionToClient(session.rows[0]);
      
      ctx.logger.info({ 
        sessionId: result.id, 
        tenantId: ctx.user.tenant_id,
        category: input.category 
      }, 'Session created');
      
      return result;
      
    } catch (error) {
      ctx.logger.error({ err: error, input }, 'Failed to create session');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create session',
      });
    }
  });
```

---

## Testing Templates (RYTHM)

### Unit Test Template (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { pace, oneRmEpley } from '../lib/calc';

describe('pace calculator', () => {
  describe('happy path', () => {
    it('computes m/s when distance and duration valid', () => {
      // 2000m in 6.67 minutes = 2000 / (6.67 * 60) = 5 m/s
      expect(pace(2000, 6.67)).toBeCloseTo(5, 1);
    });
  });

  describe('error cases', () => {
    it('throws on zero duration', () => {
      expect(() => pace(1000, 0)).toThrow('invalid');
    });
    
    it('throws on negative distance', () => {
      expect(() => pace(-500, 10)).toThrow('invalid');
    });
  });
});

describe('oneRmEpley', () => {
  it('calculates 1RM correctly', () => {
    // 100kg * (1 + 5/30) = 116.67kg
    expect(oneRmEpley(100, 5)).toBeCloseTo(116.67, 2);
  });
  
  it('throws on invalid weight', () => {
    expect(() => oneRmEpley(0, 5)).toThrow('invalid');
  });
```

### Integration Test Template (RLS)

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db, setTenantContext } from '@rythm/db';

describe('Sessions API with RLS', () => {
  const tenant1Id = 'tenant-1-uuid';
  const tenant2Id = 'tenant-2-uuid';
  
  beforeAll(async () => {
    // Setup test database
    await db.query('BEGIN');
  });

  afterAll(async () => {
    // Rollback test data
    await db.query('ROLLBACK');
  });

  it('creates session with correct tenant isolation', async () => {
    await setTenantContext(tenant1Id);
    
    const result = await db.query(
      `INSERT INTO sessions (tenant_id, category) 
       VALUES ($1, 'strength') 
       RETURNING id, tenant_id`,
      [tenant1Id]
    );

    expect(result.rows[0].tenant_id).toBe(tenant1Id);
  });

  it('prevents cross-tenant reads via RLS', async () => {
    // Create session for tenant 1
    await setTenantContext(tenant1Id);
    const session = await db.query(
      `INSERT INTO sessions (tenant_id, category) VALUES ($1, 'cardio') RETURNING id`,
      [tenant1Id]
    );
    
    // Switch to tenant 2 - should not see tenant 1's data
    await setTenantContext(tenant2Id);
    const result = await db.query(
      `SELECT * FROM sessions WHERE id = $1`,
      [session.rows[0].id]
    );

    expect(result.rows).toHaveLength(0); // RLS blocks access
  });
});
```

---

## Troubleshooting Guide (RYTHM)

### Common Issues

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| tRPC 400 error | Payload wrapper mismatch | Use union+transform pattern (see TRPC_CODING_STANDARDS.md) |
| RLS policy violation | Missing tenant context | Verify JWT contains tenant_id, check setTenantContext |
| Container build fails | Layer caching or dependency issue | Clear Docker cache, check Dockerfile.dev vs Dockerfile |
| Health check fails | Database not ready | Verify DB_HOST, check PostgreSQL container health |
| Cross-tenant data leak | RLS not enabled | Enable RLS on table, add tenant_id policies |
| Null in form select | Nullable field not sanitized | Coalesce null to empty string in initial values |
| Slow analytics query | Missing indexes on tenant_id | Add composite index (tenant_id, created_at) |
| Email not logged | Using Azure SDK directly | Use EmailService instead (see EMAIL_SERVICE_USAGE.md) |

### Debug Checklist (RYTHM)

- [ ] Check Azure Container App logs (`az containerapp logs`)
- [ ] Verify environment variables in azure.yaml
- [ ] Test PostgreSQL connectivity (RLS policies enabled?)
- [ ] Review recent migrations (idempotent? RLS preserved?)
- [ ] Check for tRPC payload wrapper issues
- [ ] Validate tenant_id in JWT claims
- [ ] Test RLS policies in isolation
- [ ] Review error stack traces with correlation IDs
- [ ] Verify Docker health check endpoint (/health)
- [ ] Check EmailService logs in email_logs table

---

## Summary

This document provides a comprehensive framework for AI coding agents working on the **RYTHM hybrid training platform**. All guidance is tailored to RYTHM's specific architecture: multi-tenant SaaS with Row Level Security, tRPC API, Next.js PWA/admin, and Azure Container Apps deployment.

**RYTHM Key Takeaways:**

1. **Always read `.github/copilot-instructions.md` first** — primary source of truth
2. **RLS is mandatory** — all tenant tables must have RLS enabled with tenant_id policies
3. **tRPC payload normalization** — use union+transform for admin web compatibility
4. **Azure-ready containers** — stateless, health checks, multi-stage Dockerfiles
5. **Domain knowledge** — sessions have categories, sets have two value types, 98 exercise templates
6. **Email logging** — always use EmailService (never Azure SDK directly)
7. **Test RLS policies** — integration tests must verify tenant isolation
8. **Idempotent migrations** — SQL migrations must be transactional and rollback-safe

**Critical RYTHM Patterns:**

- **tRPC input**: `z.union([z.object({ json: schema }), schema]).transform(...)`
- **RLS context**: `SELECT set_config('app.current_tenant_id', $1, false)`
- **Health checks**: `/health` endpoint required for Azure Container Apps
- **Logging**: Structured JSON with correlation IDs for Azure Monitor
- **Commits**: Conventional commits with package scope (`feat(api):`, `fix(mobile):`)

**Reference Documents:**

- `.github/copilot-instructions.md` — Core development principles
- `docs/TRPC_CODING_STANDARDS.md` — tRPC best practices and gotchas
- `docs/EMAIL_SERVICE_USAGE.md` — Email logging requirements
- `docs/AZURE_SETUP.md` — Deployment and infrastructure
- `.github/instructions/ui.instructions.md` — UI/UX standards

---

**Last Updated**: January 13, 2026  
**Maintained by**: RYTHM Development Team  
**Tech Stack**: Next.js 14, Node 20, TypeScript 5, PostgreSQL 15+, tRPC, Azure Container Apps

