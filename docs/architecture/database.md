# Database Architecture

This document describes the RYTHM database design, schema, and data management strategies.

## Overview

RYTHM uses PostgreSQL 15+ with Row Level Security (RLS) for multi-tenant data isolation. The database is designed for:

- **Multi-tenant architecture** - Data isolation by tenant_id
- **Security** - RLS policies prevent cross-tenant data access
- **Performance** - Optimized indexes and queries
- **Scalability** - Ready for horizontal scaling with read replicas

## Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Tenants   │    │     Users       │    │  Workout        │
│             │◄───┤                 ├───►│  Templates      │
│ tenant_id   │    │ user_id         │    │                 │
│ name        │    │ tenant_id (FK)  │    │ template_id     │
│ branding    │    │ email           │    │ user_id (FK)    │
└─────────────┘    │ role            │    │ tenant_id (FK)  │
                   │ first_name      │    │ name            │
                   │ last_name       │    │ scope           │
                   │ avatar_url      │    │ exercises       │
                   │ bio             │    └─────────────────┘
                   └─────────────────┘            │
                            │                     │
                            │                     ▼
                            │            ┌─────────────────┐
                            │            │   Exercise      │
                            │            │   Templates     │
                            │            │                 │
                            │            │ template_id     │
                            │            │ name            │
                            │            │ muscle_groups   │
                            │            │ equipment       │
                            │            │ exercise_type   │
                            │            └─────────────────┘
                            ▼
                   ┌─────────────────┐    ┌─────────────────┐
                   │    Sessions     │    │      Sets       │
                   │                 ├───►│                 │
                   │ session_id      │    │ set_id          │
                   │ user_id (FK)    │    │ session_id (FK) │
                   │ tenant_id (FK)  │    │ exercise_id (FK)│
                   │ name            │    │ reps            │
                   │ category        │    │ weight_kg       │
                   │ started_at      │    │ distance_m      │
                   │ completed_at    │    │ duration_m      │
                   │ training_load   │    │ calories        │
                   └─────────────────┘    │ rpe             │
                                          └─────────────────┘
```

## Core Tables

### Tenants

Represents fitness studios, gyms, or organizations.

```sql
CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  branding JSONB,
  settings JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_active ON tenants(is_active);
```

### Users

All platform users (athletes, coaches, admins).

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'athlete',
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_tenant_fk FOREIGN KEY (tenant_id) 
    REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON users
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR current_setting('app.user_role', true) = 'system_admin'
  );
```

**Roles**:
- `athlete` - Regular user, can log workouts
- `coach` - Can view athlete data, create templates
- `tenant_admin` - Tenant management capabilities
- `org_admin` - Organization-level administration
- `system_admin` - Full platform access

### Workout Templates

Pre-configured workout plans.

```sql
CREATE TABLE workout_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  user_id UUID REFERENCES users(user_id),
  created_by UUID REFERENCES users(user_id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scope VARCHAR(20) DEFAULT 'user' CHECK (scope IN ('user', 'tenant', 'system')),
  category VARCHAR(50) CHECK (category IN ('strength', 'cardio', 'hybrid')),
  exercises JSONB NOT NULL DEFAULT '[]',
  estimated_duration INTEGER, -- minutes
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workout_templates_tenant ON workout_templates(tenant_id);
CREATE INDEX idx_workout_templates_user ON workout_templates(user_id);
CREATE INDEX idx_workout_templates_scope ON workout_templates(scope);
CREATE INDEX idx_workout_templates_active ON workout_templates(is_active);
CREATE INDEX idx_workout_templates_category ON workout_templates(category);

-- Row Level Security
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY template_access ON workout_templates
  FOR SELECT USING (
    scope = 'system'
    OR (scope = 'tenant' AND tenant_id = current_setting('app.current_tenant_id', true)::UUID)
    OR (scope = 'user' AND user_id = current_setting('app.current_user_id', true)::UUID)
  );

CREATE POLICY template_modify ON workout_templates
  FOR ALL USING (
    user_id = current_setting('app.current_user_id', true)::UUID
    OR current_setting('app.user_role', true) IN ('system_admin', 'org_admin', 'tenant_admin')
  );
```

**Template Scopes**:
- `system` - Available to all tenants (default exercises, curated workouts)
- `tenant` - Shared within a gym/studio
- `user` - Personal templates, private to creator

### Exercise Templates

Global exercise library.

```sql
CREATE TABLE exercise_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  exercise_type VARCHAR(20) CHECK (exercise_type IN ('STRENGTH', 'CARDIO')),
  muscle_groups TEXT[],
  equipment TEXT[],
  instructions TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_exercise_templates_type ON exercise_templates(exercise_type);
CREATE INDEX idx_exercise_templates_name ON exercise_templates USING GIN(to_tsvector('english', name));
CREATE INDEX idx_exercise_templates_active ON exercise_templates(is_active);

-- No RLS - exercise templates are global
```

### Sessions

Individual workout sessions.

```sql
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(program_id),
  template_id UUID REFERENCES workout_templates(template_id),
  name VARCHAR(255),
  category VARCHAR(20) NOT NULL CHECK (category IN ('strength', 'cardio', 'hybrid')),
  notes TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  training_load INTEGER,
  perceived_exertion NUMERIC(3,1) CHECK (perceived_exertion BETWEEN 0 AND 10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX idx_sessions_category ON sessions(category);
CREATE INDEX idx_sessions_completed ON sessions(completed_at) WHERE completed_at IS NOT NULL;

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_isolation ON sessions
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    AND (
      user_id = current_setting('app.current_user_id', true)::UUID
      OR current_setting('app.user_role', true) IN ('coach', 'tenant_admin', 'org_admin', 'system_admin')
    )
  );
```

### Sets

Individual exercise sets within sessions.

```sql
CREATE TABLE sets (
  set_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(exercise_id),
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg NUMERIC(6,2),
  distance_m NUMERIC(10,2),
  duration_m NUMERIC(8,2), -- minutes (stored as decimal for precision)
  calories INTEGER,
  rpe NUMERIC(3,1) CHECK (rpe BETWEEN 0 AND 10),
  notes TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT sets_session_set_number_unique UNIQUE (session_id, set_number)
);

-- Indexes
CREATE INDEX idx_sets_session ON sets(session_id);
CREATE INDEX idx_sets_exercise ON sets(exercise_id);
CREATE INDEX idx_sets_completed ON sets(completed_at) WHERE completed_at IS NOT NULL;

-- Row Level Security (inherits from sessions)
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY set_isolation ON sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.session_id = sets.session_id
      AND s.tenant_id = current_setting('app.current_tenant_id', true)::UUID
    )
  );
```

## Row Level Security (RLS)

### Purpose

RLS provides database-level multi-tenancy enforcement:
- Prevents cross-tenant data access at the database layer
- Cannot be bypassed by application bugs
- Enforced even for direct database connections
- Complements application-level authorization

### Setting Context

The API sets PostgreSQL session variables before queries:

```typescript
// In API middleware
await db.query(`
  SET app.current_tenant_id = $1;
  SET app.current_user_id = $2;
  SET app.user_role = $3;
`, [user.tenantId, user.userId, user.role]);
```

### Policy Examples

**User Isolation** - Users see only their tenant's data:
```sql
CREATE POLICY user_isolation ON users
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
  );
```

**Template Scope Access** - Visibility based on template scope:
```sql
CREATE POLICY template_access ON workout_templates
  FOR SELECT USING (
    scope = 'system'  -- Everyone sees system templates
    OR (scope = 'tenant' AND tenant_id = current_setting('app.current_tenant_id', true)::UUID)
    OR (scope = 'user' AND user_id = current_setting('app.current_user_id', true)::UUID)
  );
```

**Role-Based Modification** - Admins can modify more:
```sql
CREATE POLICY template_modify ON workout_templates
  FOR INSERT, UPDATE, DELETE USING (
    user_id = current_setting('app.current_user_id', true)::UUID
    OR current_setting('app.user_role', true) IN ('system_admin', 'org_admin')
  );
```

## Indexes and Performance

### Query Patterns

**Common Queries**:
1. List user's recent sessions
2. Get workout templates by scope
3. Aggregate training volume by time period
4. Search exercises by name
5. Find personal records

### Index Strategy

**Tenant Isolation**:
```sql
-- Every tenant-scoped table needs tenant_id index
CREATE INDEX idx_table_tenant ON table(tenant_id);
```

**Time-Series Data**:
```sql
-- Sessions ordered by recency
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);
```

**Composite Indexes**:
```sql
-- Templates filtered by scope and tenant
CREATE INDEX idx_workout_templates_scope_tenant 
ON workout_templates(scope, tenant_id) 
WHERE is_active = true;
```

**Full-Text Search**:
```sql
-- Exercise search
CREATE INDEX idx_exercise_templates_search 
ON exercise_templates 
USING GIN(to_tsvector('english', name || ' ' || description));
```

## Migrations

### Strategy

- **Sequential numbering**: `001_initial.sql`, `002_add_column.sql`
- **Idempotent**: Safe to run multiple times
- **Transactional**: Wrapped in BEGIN/COMMIT
- **Rollback comments**: Document how to undo changes

### Example Migration

```sql
-- Migration: 004_add_training_load.sql
-- Description: Add training load calculation fields
-- Rollback: Remove training_load column from sessions

BEGIN;

-- Add training load to sessions
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS training_load INTEGER;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_sessions_training_load 
ON sessions(training_load) 
WHERE training_load IS NOT NULL;

-- Update existing sessions with calculated training load
UPDATE sessions SET training_load = (
  SELECT COALESCE(SUM(sets.weight_kg * sets.reps), 0)
  FROM sets
  WHERE sets.session_id = sessions.session_id
)
WHERE training_load IS NULL 
AND category IN ('strength', 'hybrid');

COMMIT;
```

### Running Migrations

```bash
# In development (Docker)
npm run db:migrate

# Or manually
docker-compose exec api npm run db:migrate

# Direct database access
docker-compose exec db psql -U rythm_api -d rythm -f /migrations/004_add_training_load.sql
```

## Data Types and Constraints

### Enums

Defined as CHECK constraints for flexibility:

```sql
-- Session category
CHECK (category IN ('strength', 'cardio', 'hybrid'))

-- Template scope
CHECK (scope IN ('user', 'tenant', 'system'))

-- Exercise type
CHECK (exercise_type IN ('STRENGTH', 'CARDIO'))

-- User role
CHECK (role IN ('athlete', 'coach', 'tenant_admin', 'org_admin', 'system_admin'))
```

### Numeric Precision

```sql
weight_kg NUMERIC(6,2)      -- Up to 9999.99 kg
distance_m NUMERIC(10,2)    -- Up to 99,999,999.99 m
duration_m NUMERIC(8,2)     -- Up to 999,999.99 minutes
rpe NUMERIC(3,1)            -- 0.0 to 10.0 (Rate of Perceived Exertion)
```

### UUID Generation

All primary keys use UUID v4:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

Benefits:
- Globally unique without coordination
- No sequential ID enumeration attacks
- Can generate client-side if needed

## Backup and Recovery

### Backup Strategy

**Development**:
```bash
# Backup
docker-compose exec db pg_dump -U rythm_api rythm > backup.sql

# Restore
docker-compose exec -T db psql -U rythm_api rythm < backup.sql
```

**Production**:
- Automated daily backups
- Point-in-time recovery enabled
- Backup retention: 30 days
- Test restores monthly

### Data Retention

- **User data**: Retained indefinitely (GDPR export available)
- **Session data**: Retained indefinitely
- **Logs**: 90 days
- **Deleted accounts**: Soft delete for 30 days, then hard delete

## Related Documentation

- **[System Overview](overview.md)** - Overall architecture
- **[API Design](api-design.md)** - How the API uses the database
- **[Security Architecture](security.md)** - Authentication and authorization

---

*For migration scripts, see `/packages/db/migrations/`*
