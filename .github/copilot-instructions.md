# GitHub Copilot Instructions — RYTHM Hybrid Training Platform# GitHub Copilot Instructions — RYTHM Hybrid Training Platform



> Goal: Make Copilot an effective co‑developer for the RYTHM multi‑tenant hybrid training app (mobile PWA + admin web + API), optimized for Azure Container Apps deployment with PostgreSQL and Row Level Security. Maximize developer productivity, Azure deployment readiness, and production quality.> Goal: Make Copilot an effective co‑developer for the RYTHM multi‑tenant hybrid training app (mobile PWA + admin web + API), optimized for Azure Container Apps deployment with PostgreSQL and Row Level Security. Maximize developer productivity, Azure deployment readiness, and production quality.



------



## TL;DR for Copilot## TL;DR for Copilot

- **Stack**: Next.js PWA (mobile) + Next.js admin, Node/TypeScript tRPC API, PostgreSQL 15+ with **Row Level Security** on Azure Container Apps.- **Stack**: Next.js PWA (mobile) + Next.js admin, Node/TypeScript tRPC API, PostgreSQL 15+ with **Row Level Security** on Azure Container Apps.

- **Azure Deployment**: Automated via GitHub Actions → Azure Container Registry → Container Apps with PostgreSQL Flexible Server.- **Azure Deployment**: Automated via GitHub Actions → Azure Container Registry → Container Apps with PostgreSQL Flexible Server.

- **Key domain rules**:- **Key domain rules**:

  - `sessions.category ∈ {strength, cardio, hybrid}` (required).  - `sessions.category ∈ {strength, cardio, hybrid}` (required).

  - Each **set** has **two configurable variables** from `{weight_kg, distance_m, duration_m, calories}` with independent selection.  - Each **set** has **two configurable variables** from `{weight_kg, distance_m, duration_m, calories}` with independent selection.

  - **98 exercise templates** (68 strength, 30 cardio) included in fresh deployments.  - **98 exercise templates** (68 strength, 30 cardio) included in fresh deployments.

- **Principles**: Azure-ready containers, strict types, Zod validation, pure functions, idempotent migrations, production-ready logging.- **Principles**: Azure-ready containers, strict types, Zod validation, pure functions, idempotent migrations, production-ready logging.

- **Local dev**: Docker Compose with scripts. **Production**: Azure Container Apps with automated CI/CD.- **Local dev**: Docker Compose with scripts. **Production**: Azure Container Apps with automated CI/CD.



------



## 1) Repository Shape (RYTHM Project)## 1) Repository Shape (RYTHM Project)

``````

apps/apps/

  api/               # Node/TS tRPC API (Express-based, Zod schemas)  api/               # Node/TS tRPC API (Express-based, Zod schemas)

    Dockerfile       # Production container for Azure Container Apps    Dockerfile       # Production container for Azure Container Apps

    Dockerfile.dev   # Development container    Dockerfile.dev   # Development container

    src/    src/

      routes/        # tRPC routes (auth, sessions, sets, analytics)      routes/        # tRPC routes (auth, sessions, sets, analytics)

      index.ts       # Server entry point      index.ts       # Server entry point

      trpc.ts        # tRPC configuration      trpc.ts        # tRPC configuration

  mobile/            # Next.js PWA (mobile-first, offline-capable)  mobile/            # Next.js PWA (mobile-first, offline-capable)

    Dockerfile       # Production container for Azure Container Apps    Dockerfile       # Production container for Azure Container Apps

    Dockerfile.dev   # Development container    Dockerfile.dev   # Development container

    src/    src/

      app/           # Next.js app router      app/           # Next.js app router

      components/    # Shared UI components      components/    # Shared UI components

      contexts/      # React contexts (auth, etc.)      contexts/      # React contexts (auth, etc.)

  admin/             # Next.js admin dashboard (web interface)  admin/             # Next.js admin dashboard (web interface)

    (similar structure to mobile)    (similar structure to mobile)

packages/packages/

  db/                # Database migrations, schemas, RLS helpers  db/                # Database migrations, schemas, RLS helpers

    migrations/      # SQL migration files    migrations/      # SQL migration files

    src/             # Database utilities and types    src/             # Database utilities and types

  shared/            # Shared types and schemas (Zod)  shared/            # Shared types and schemas (Zod)

    src/    src/

      schemas.ts     # Zod schemas shared between API and frontend      schemas.ts     # Zod schemas shared between API and frontend

      utils.ts       # Shared utility functions      utils.ts       # Shared utility functions

scripts/scripts/

  start.sh           # Local development bootstrap  start.sh           # Local development bootstrap

  stop.sh            # Local environment teardown  stop.sh            # Local environment teardown

  run-migrations.sh  # Database migration runner  run-migrations.sh  # Database migration runner

  health-check.sh    # Service health verification  health-check.sh    # Service health verification

infra/               # Azure Bicep infrastructure as codeinfra/               # Azure Bicep infrastructure as code

  main.bicep         # Main infrastructure template  main.bicep         # Main infrastructure template

  core/              # Core infrastructure modules  core/              # Core infrastructure modules

azure.yaml           # Azure Developer CLI configurationazure.yaml           # Azure Developer CLI configuration

docker-compose.yml   # Local development environmentdocker-compose.yml   # Local development environment

``````



**Copilot hint**: Always consider Azure deployment when generating code. Use the actual project structure above.**Copilot hint**: Always consider Azure deployment when generating code. Use the actual project structure above.



------



## 2) Azure-Ready Coding Conventions## 2) Azure-Ready Coding Conventions

- **TypeScript**: `"strict": true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.- **TypeScript**: `"strict": true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.

- **Validation**: Zod schemas mirror DB constraints. Parse at the edge (request/response).- **Validation**: Zod schemas mirror DB constraints. Parse at the edge (request/response).

- **Errors**: Never throw raw; wrap in typed error objects and map to HTTP problem details.- **Errors**: Never throw raw; wrap in typed error objects and map to HTTP problem details.

- **Auth**: JWT (short‑lived access + rotating refresh). User → Tenant scoping via `tenant_id` in claims; verify against DB on each request for write operations.- **Auth**: JWT (short‑lived access + rotating refresh). User → Tenant scoping via `tenant_id` in claims; verify against DB on each request for write operations.

- **Database**: PostgreSQL 15+. **RLS enabled** on all tenant tables; use policies by `tenant_id`. Prefer SQL migrations for RLS (clear diffing). ORM is acceptable for models.- **Database**: PostgreSQL 15+. **RLS enabled** on all tenant tables; use policies by `tenant_id`. Prefer SQL migrations for RLS (clear diffing). ORM is acceptable for models.

- **Time**: Store in UTC (TIMESTAMPTZ). Client displays local time.- **Time**: Store in UTC (TIMESTAMPTZ). Client displays local time.

- **Units**: Metric by default. Enforce set variable **types** via enum: `set_value_type`.- **Units**: Metric by default. Enforce set variable **types** via enum: `set_value_type`.

- **Logging**: Structured JSON logs (pino or similar) with correlation IDs; OpenTelemetry traces optional.- **Logging**: Structured JSON logs (pino or similar) with correlation IDs; OpenTelemetry traces optional.

- **Security**: Parameterized queries; never string‑concatenate SQL. Deny‑by‑default CORS; rate‑limit auth routes.- **Security**: Parameterized queries; never string‑concatenate SQL. Deny‑by‑default CORS; rate‑limit auth routes.

- **Email Logging**: **CRITICAL** - ALL emails MUST be logged to the database. Always use `EmailService` from `apps/api/src/services/EmailService.ts`. Never send emails directly via Azure SDK. Every email send must include:
  - `emailType`: One of 'backup_notification', 'password_reset', 'workout_reminder', 'admin_alert', 'generic'
  - `tenantId`: The tenant context (if applicable)
  - `userId`: The user context (if applicable)
  - `metadata`: Relevant context data (e.g., backupId, resetToken, alertType)
  - Example: `await emailService.sendBackupNotification({ to, tenantId, tenantName, backupId, status, size, duration })`
  - The service automatically creates email_logs entries with status tracking (pending → sent/failed)

- **Azure Deployment**: Every function must be containerizable and stateless for Azure Container Apps.- **Azure Deployment**: Every function must be containerizable and stateless for Azure Container Apps.

- **Environment Variables**: Use Azure Key Vault for secrets, Container App environment variables for configuration.- **Environment Variables**: Use Azure Key Vault for secrets, Container App environment variables for configuration.

- **Health Checks**: All services must expose `/health` endpoint for Azure health monitoring.- **Health Checks**: All services must expose `/health` endpoint for Azure health monitoring.

- **Container Optimization**: Multi-stage Dockerfiles, minimal base images (Alpine), proper layer caching.- **Container Optimization**: Multi-stage Dockerfiles, minimal base images (Alpine), proper layer caching.



------



## 3) Domain Rules (for Copilot)## 3) Domain Rules (for Copilot)

**Sessions****Sessions**

- `category: 'strength' | 'cardio' | 'hybrid'` (required).- `category: 'strength' | 'cardio' | 'hybrid'` (required).



**Sets****Sets**

- Fields: `reps? number`, `value_1_type?`, `value_1_numeric?`, `value_2_type?`, `value_2_numeric?`, `rpe?`.- Fields: `reps? number`, `value_1_type?`, `value_1_numeric?`, `value_2_type?`, `value_2_numeric?`, `rpe?`.

- `value_*_type ∈ {'weight_kg','distance_m','duration_m','calories'}`. Either/both can be null; if both present and are `distance_m` + `duration_m`, derive **pace** on the API.- `value_*_type ∈ {'weight_kg','distance_m','duration_m','calories'}`. Either/both can be null; if both present and are `distance_m` + `duration_m`, derive **pace** on the API.

- Reject negatives. Large bounds sanity‑checked in API layer.- Reject negatives. Large bounds sanity‑checked in API layer.



**Exercise Templates****Exercise Templates**

- **98 comprehensive exercise templates** (68 strength, 30 cardio) included in fresh deployments.- **98 comprehensive exercise templates** (68 strength, 30 cardio) included in fresh deployments.

- Templates support hybrid training with configurable value types.- Templates support hybrid training with configurable value types.

- Equipment integration with structured equipment catalog.- Equipment integration with structured equipment catalog.



**Analytics****Analytics**

- Strength **volume** = Σ(weight_kg × reps) for strength + hybrid sessions (where applicable).- Strength **volume** = Σ(weight_kg × reps) for strength + hybrid sessions (where applicable).

- **Pace** = distance_m / (duration_m * 60) when both exist (convert minutes to seconds for calculation).- **Pace** = distance_m / (duration_m * 60) when both exist (convert minutes to seconds for calculation).

- **PRs**: 1RM estimators (Epley/Brzycki) for lifts when reps+weight present.- **PRs**: 1RM estimators (Epley/Brzycki) for lifts when reps+weight present.



**Duration Handling**## 4) Prompt Patterns That Work

- All durations stored in **minutes** (not seconds) throughout the system.> Add to file headers or Copilot Chat to steer suggestions.

- Pace calculations convert duration_m to seconds internally: `pace = distance_m / (duration_m * 60)`.

- UI displays duration in minutes with proper formatting.### Implement a feature (Azure-ready)

```

---/* Goal: Add POST /sessions

   Constraints:

## 4) Prompt Patterns That Work   - Validate body with Zod: { startedAt?, category: enum, notes? }

> Add to file headers or Copilot Chat to steer suggestions.   - Attach tenant_id from auth claims

   - Insert with RLS active (no bypass)

### Implement a feature (Azure-ready)   - Return 201 with created entity (camelCase), problem+json on error

```   - Must be stateless for Azure Container Apps

/* Goal: Add POST /sessions   - Include health check endpoint updates if needed

   Constraints:   Tests:

   - Validate body with Zod: { startedAt?, category: enum, notes? }   - happy path

   - Attach tenant_id from auth claims   - missing/invalid category

   - Insert with RLS active (no bypass)   - forbidden cross-tenant insert (RLS)

   - Return 201 with created entity (camelCase), problem+json on error   - container health scenarios */

   - Must be stateless for Azure Container Apps```

   - Include health check endpoint updates if needed

   Tests:### Generate Azure-ready containers

   - happy path```

   - missing/invalid category/* Create Dockerfile for [service]

   - forbidden cross-tenant insert (RLS)   - Multi-stage build (dev dependencies separate)

   - container health scenarios */   - Alpine base image for minimal size

```   - Health check endpoint on port [PORT]

   - Environment variable validation

### Generate Azure-ready containers   - Non-root user for security

```   - Proper layer caching for Azure Container Registry */

/* Create Dockerfile for [service]```

   - Multi-stage build (dev dependencies separate)

   - Alpine base image for minimal size### Write database migrations

   - Health check endpoint on port [PORT]```

   - Environment variable validation-- Create sets value enums, add columns

   - Non-root user for security-- Idempotent, transactional, rollback comment

   - Proper layer caching for Azure Container Registry */-- Compatible with Azure PostgreSQL Flexible Server

```-- Include RLS policies for multi-tenancy

```

### Write database migrations

```### Generate Azure deployment configs

-- Create sets value enums, add columns```

-- Idempotent, transactional, rollback comment/* Create/update azure.yaml service definition

-- Compatible with Azure PostgreSQL Flexible Server   - Container app configuration

-- Include RLS policies for multi-tenancy   - Environment variables (non-secret)

```   - Resource requirements for Azure Container Apps

   - Health check configuration

### Generate Azure deployment configs   - Scaling rules if applicable */

``````

/* Create/update azure.yaml service definition

   - Container app configuration---

   - Environment variables (non-secret)

   - Resource requirements for Azure Container Apps## 5) File & Comment Cues for Copilot

   - Health check configuration- Start files with a **purpose comment** and list of **acceptance criteria**.

   - Scaling rules if applicable */- In tests, preface with `// Scenarios:` and bullet points.

```- For SQL, include `-- up` and `-- down` sections or clear comments for idempotency.

- Provide brief examples of expected inputs/outputs for validators.

---- **Azure-specific**: Include container health, environment variables, and scaling considerations.



## 5) File & Comment Cues for Copilot**Example file header (API route):**

- Start files with a **purpose comment** and list of **acceptance criteria**.```ts

- In tests, preface with `// Scenarios:` and bullet points./** POST /sessions

- For SQL, include `-- up` and `-- down` sections or clear comments for idempotency. * Accepts: { category: 'strength'|'cardio'|'hybrid', startedAt?: string, notes?: string }

- Provide brief examples of expected inputs/outputs for validators. * Behavior: attaches tenant_id from JWT; RLS enforced

- **Azure-specific**: Include container health, environment variables, and scaling considerations. * Returns: 201 {session} | 400 | 401 | 403 | 500

 * Azure: Stateless, uses env vars, includes health metrics

**Example file header (API route):** * Tests: unit (zod), integration (supertest), e2e (playwright) */

```ts```

/** POST /sessions

 * Accepts: { category: 'strength'|'cardio'|'hybrid', startedAt?: string, notes?: string }**Example Dockerfile header:**

 * Behavior: attaches tenant_id from JWT; RLS enforced```dockerfile

 * Returns: 201 {session} | 400 | 401 | 403 | 500# Multi-stage Dockerfile for Azure Container Apps

 * Azure: Stateless, uses env vars, includes health metrics# Stage 1: Build dependencies and compile TypeScript

 * Tests: unit (zod), integration (supertest), e2e (playwright) */# Stage 2: Production runtime with minimal Alpine base

```# Health check: GET /health

# Environment: See azure.yaml for required variables

**Example Dockerfile header:**```

```dockerfile

# Multi-stage Dockerfile for Azure Container Apps---

# Stage 1: Build dependencies and compile TypeScript

# Stage 2: Production runtime with minimal Alpine base## 6) Local Containers (Start/Stop)

# Health check: GET /health> Use these as templates. Place in `scripts/` and make them executable (`chmod +x`).

# Environment: See azure.yaml for required variables

```**scripts/start.sh**

```sh

---#!/usr/bin/env bash

set -euo pipefail

## 6) Local Containers (Start/Stop)

> Use these as templates. Place in `scripts/` and make them executable (`chmod +x`).ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

**scripts/start.sh**

```bashexport COMPOSE_PROJECT_NAME=rythm

#!/usr/bin/env bashexport POSTGRES_PASSWORD=password

set -euo pipefailexport POSTGRES_USER=rythm_api

export POSTGRES_DB=rythm

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"echo "▶ Building and starting containers..."

docker-compose up -d --build

export COMPOSE_PROJECT_NAME=rythm

export POSTGRES_PASSWORD=passwordecho "▶ Waiting for Postgres..."

export POSTGRES_USER=rythm_apiuntil docker exec rythm-db-1 pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do

export POSTGRES_DB=rythm  sleep 1

done

echo "▶ Building and starting containers..."

docker-compose up -d --buildecho "▶ Database ready with consolidated schema..."

echo "✅ Environment ready:"

echo "▶ Waiting for Postgres..."echo "📱 Mobile PWA: http://localhost:3000"

until docker exec rythm-db-1 pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; doecho "🔧 Admin Web:  http://localhost:3002"  

  sleep 1echo "🚀 API Server: http://localhost:3001"

doneecho "🗄️ Database:   localhost:5432"

```

echo "▶ Database ready with consolidated schema..."

echo "✅ Environment ready:"**scripts/stop.sh**

echo "📱 Mobile PWA: http://localhost:3000"```sh

echo "🔧 Admin Web:  http://localhost:3002"  #!/usr/bin/env bash

echo "🚀 API Server: http://localhost:3001"set -euo pipefail

echo "🗄️ Database:   localhost:5432"

```cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"



**scripts/stop.sh**export COMPOSE_PROJECT_NAME=rythm

```bash

#!/usr/bin/env bashecho "⏹ Stopping containers..."

set -euo pipefaildocker-compose down



cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"read -r -p "Also remove volumes? This deletes local DB data. (y/N) " yn

case "$yn" in

export COMPOSE_PROJECT_NAME=rythm  [Yy]* ) docker-compose down -v && docker system prune -f ;;

  * ) echo "Keeping volumes." ;;

echo "⏹ Stopping containers..."esac

docker-compose down

echo "🧹 Done."

read -r -p "Also remove volumes? This deletes local DB data. (y/N) " yn```

case "$yn" in

  [Yy]* ) docker-compose down -v && docker system prune -f ;;---

  * ) echo "Keeping volumes." ;;

esac## 7) Testing Guidance (for Copilot)

- **Unit**: calculators (pace, 1RM), mappers, guards. 100% branch coverage aimed here.

echo "🧹 Done."- **Integration**: API + DB with a **test schema**. Wrap each test in a transaction and roll back.

```- **RLS tests**: prove cross‑tenant queries fail; same‑tenant succeed.

- **e2e**: Offline log → reconnect → conflict resolution (server wins with deterministic merge).

---

**Example Vitest sketch**

## 7) Testing Guidance (for Copilot)```ts

- **Unit**: calculators (pace, 1RM), mappers, guards. 100% branch coverage aimed here.import { describe, it, expect } from 'vitest';

- **Integration**: API + DB with a **test schema**. Wrap each test in a transaction and roll back.import { pace } from '../lib/calc';

- **RLS tests**: prove cross‑tenant queries fail; same‑tenant succeed.

- **e2e**: Offline log → reconnect → conflict resolution (server wins with deterministic merge).describe('pace', () => {

  it('computes m/s when both inputs valid', () => {

**Example Vitest sketch**    // Note: duration_m is in minutes, so convert to seconds for pace calculation

```ts    expect(pace(2000, 6.67)).toBeCloseTo(5, 1); // 2000m / (6.67min * 60s/min) = 5 m/s

import { describe, it, expect } from 'vitest';  });

import { pace } from '../lib/calc';  it('throws on zero/negative duration', () => {

    expect(() => pace(1000, 0)).toThrow();

describe('pace', () => {  });

  it('computes m/s when both inputs valid', () => {});

    // Note: duration_m is in minutes, so convert to seconds for pace calculation```

    expect(pace(2000, 6.67)).toBeCloseTo(5, 1); // 2000m / (6.67min * 60s/min) = 5 m/s

  });---

  it('throws on zero/negative duration', () => {

    expect(() => pace(1000, 0)).toThrow();## 8) Copilot Chat: Handy Prompts

  });- "Generate a Zod schema and TS type for a set with two variable fields; enforce enums."

});- "Create SQL for an `enum set_value_type` and alter `sets` to add `value_1_*` and `value_2_*` columns idempotently."

```- "Write Playwright tests for offline logging then sync."

- "Refactor controller to pure functions + dependency injection; create test doubles."

---- "Draft RLS policies for tenant isolation on `sessions` and `sets` using `tenant_id` and `auth.jwt()`. Add tests."

- "Create Azure Container Apps Dockerfile for [service] with health checks and environment validation."

## 8) Copilot Chat: Handy Prompts- "Generate azure.yaml service definition for deployment to Container Apps."

- "Generate a Zod schema and TS type for a set with two variable fields; enforce enums."- "Add GitHub Actions workflow step for building and deploying to Azure Container Registry."

- "Create SQL for an `enum set_value_type` and alter `sets` to add `value_1_*` and `value_2_*` columns idempotently."

- "Write Playwright tests for offline logging then sync."---

- "Refactor controller to pure functions + dependency injection; create test doubles."

- "Draft RLS policies for tenant isolation on `sessions` and `sets` using `tenant_id` and `auth.jwt()`. Add tests."## 9) Azure Deployment Best Practices

- "Create Azure Container Apps Dockerfile for [service] with health checks and environment validation."

- "Generate azure.yaml service definition for deployment to Container Apps."### Container Optimization

- "Add GitHub Actions workflow step for building and deploying to Azure Container Registry."- **Multi-stage builds**: Separate build and runtime stages for smaller images

- **Base images**: Use Alpine Linux for minimal attack surface

---- **Layer caching**: Order Dockerfile commands to maximize cache hits

- **Security**: Run as non-root user, scan for vulnerabilities

## 9) Azure Deployment Best Practices

### Environment Configuration

### Container Optimization- **Secrets**: Store in Azure Key Vault, reference in Container Apps

- **Multi-stage builds**: Separate build and runtime stages for smaller images- **Configuration**: Use Container App environment variables

- **Base images**: Use Alpine Linux for minimal attack surface- **Database**: Azure PostgreSQL Flexible Server with SSL

- **Layer caching**: Order Dockerfile commands to maximize cache hits- **Monitoring**: Application Insights integration

- **Security**: Run as non-root user, scan for vulnerabilities

### Health and Scaling

### Environment Configuration- **Health checks**: Required `/health` endpoint for each service

- **Secrets**: Store in Azure Key Vault, reference in Container Apps- **Readiness**: Verify dependencies (database, external services)

- **Configuration**: Use Container App environment variables- **Scaling**: Configure auto-scaling rules based on HTTP requests or CPU

- **Database**: Azure PostgreSQL Flexible Server with SSL- **Logging**: Structured JSON logs for Azure Monitor integration

- **Monitoring**: Application Insights integration

### CI/CD Pipeline

### Health and Scaling- **GitHub Actions**: Automated deployment on main branch push

- **Health checks**: Required `/health` endpoint for each service- **Container Registry**: Azure Container Registry for image storage

- **Readiness**: Verify dependencies (database, external services)- **Blue-green deployment**: Zero-downtime updates via Container Apps revisions

- **Scaling**: Configure auto-scaling rules based on HTTP requests or CPU- **Rollback**: Quick rollback capability through revision management

- **Logging**: Structured JSON logs for Azure Monitor integration

---

### CI/CD Pipeline

- **GitHub Actions**: Automated deployment on main branch push## 10) Editor/Tooling Settings

- **Container Registry**: Azure Container Registry for image storage- `.editorconfig` for spaces, LF, utf‑8.

- **Blue-green deployment**: Zero-downtime updates via Container Apps revisions- ESLint + Prettier configured; pre‑commit hook with `lint-staged`.

- **Rollback**: Quick rollback capability through revision management- VS Code: enable Copilot + Copilot Chat, TypeScript SDK workspace version, "Format on Save".

- `.copilotignore` to omit large datasets or generated clients from context if needed.

---

---

## 10) Editor/Tooling Settings

- `.editorconfig` for spaces, LF, utf‑8.## 11) PRs & Commits

- ESLint + Prettier configured; pre‑commit hook with `lint-staged`.- Conventional commits (`feat:`, `fix:`, `chore:`…). Scope by package when possible.

- VS Code: enable Copilot + Copilot Chat, TypeScript SDK workspace version, "Format on Save".- PR template: problem, approach, screenshots, **tests** added, risk & rollback.

- `.copilotignore` to omit large datasets or generated clients from context if needed.- Require green unit/integration CI and at least one RLS test for data‑layer changes.



------



## 11) PRs & Commits## 12) Common Anti‑patterns (Ask Copilot to avoid)

- Conventional commits (`feat:`, `fix:`, `chore:`…). Scope by package when possible.- Disabling RLS or using `SECURITY DEFINER` without review.

- PR template: problem, approach, screenshots, **tests** added, risk & rollback.- Mixing validation, business logic, and IO in the same function.

- Require green unit/integration CI and at least one RLS test for data‑layer changes.- Returning DB shapes directly to clients (no DTO mapping).

- Missing health check endpoints in Azure Container Apps.

---- Hardcoding secrets in environment variables instead of Key Vault.

- Ignoring container security best practices (running as root, large images).

## 12) Common Anti‑patterns (Ask Copilot to avoid)

- Disabling RLS or using `SECURITY DEFINER` without review.
- Mixing validation, business logic, and IO in the same function.
- Returning DB shapes directly to clients (no DTO mapping).
- Missing health check endpoints in Azure Container Apps.
- Hardcoding secrets in environment variables instead of Key Vault.
- Ignoring container security best practices (running as root, large images).
- **Sending emails directly via Azure SDK** - Always use EmailService to ensure database logging.
- **Skipping email metadata** - Every email must include emailType, tenantId (if applicable), userId (if applicable), and relevant metadata.

---

export const SessionCreate = z.object({

---  category: z.enum(['strength','cardio','hybrid']),

  startedAt: z.coerce.date().optional(),

## 13) Quick Stubs (Copilot seeds)  notes: z.string().max(2000).optional(),

});

**Zod session schema**```

```ts

export const SessionCreate = z.object({**Pace calculator**

  category: z.enum(['strength','cardio','hybrid']),```ts

  startedAt: z.coerce.date().optional(),export function pace(distance_m: number, duration_s: number) {

  notes: z.string().max(2000).optional(),  if (duration_s <= 0 || distance_m < 0) throw new Error('invalid');

});  return distance_m / duration_s; // m/s

```}

```

**Pace calculator (duration in minutes)**

```ts**1RM (Epley)**

export function pace(distance_m: number, duration_m: number) {```ts

  if (duration_m <= 0 || distance_m < 0) throw new Error('invalid');export function oneRmEpley(weight_kg: number, reps: number) {

  // Convert duration from minutes to seconds for pace calculation  if (weight_kg <= 0 || reps <= 0) throw new Error('invalid');

  const duration_s = duration_m * 60;  return weight_kg * (1 + reps / 30);

  return distance_m / duration_s; // m/s}

}```

```

**Azure Health Check Endpoint**

**1RM (Epley)**```ts

```tsexport const healthCheck = async (req: Request, res: Response) => {

export function oneRmEpley(weight_kg: number, reps: number) {  try {

  if (weight_kg <= 0 || reps <= 0) throw new Error('invalid');    // Check database connection

  return weight_kg * (1 + reps / 30);    await db.query('SELECT 1');

}    

```    res.status(200).json({

      status: 'healthy',

**Azure Health Check Endpoint**      timestamp: new Date().toISOString(),

```ts      version: process.env.npm_package_version || '1.0.0',

export const healthCheck = async (req: Request, res: Response) => {      environment: process.env.NODE_ENV

  try {    });

    // Check database connection  } catch (error) {

    await db.query('SELECT 1');    res.status(503).json({

          status: 'unhealthy',

    res.status(200).json({      timestamp: new Date().toISOString(),

      status: 'healthy',      error: 'Database connection failed'

      timestamp: new Date().toISOString(),    });

      version: process.env.npm_package_version || '1.0.0',  }

      environment: process.env.NODE_ENV};

    });```

  } catch (error) {

    res.status(503).json({---

      status: 'unhealthy',

      timestamp: new Date().toISOString(),## 14) Final Notes

      error: 'Database connection failed'- Keep comments crisp and action‑oriented so Copilot has the right guardrails.

    });- Prefer test‑first on calculators and RLS policies; Copilot then fills in safe scaffolding.

  }- When in doubt, ask Copilot Chat to **explain its suggestion** and request safer alternatives.

};- Always consider Azure deployment constraints when generating code.

```- Ensure every service is containerized and follows Azure Container Apps best practices.schema and TS type for a set with two variable fields; enforce enums."

- "Create SQL for an `enum set_value_type` and alter `sets` to add `value_1_*` and `value_2_*` columns idempotently."

---- "Write Playwright tests for offline logging then sync."

- "Refactor controller to pure functions + dependency injection; create test doubles."

## 14) Final Notes- "Draft RLS policies for tenant isolation on `sessions` and `sets` using `tenant_id` and `auth.jwt()`. Add tests."

- Keep comments crisp and action‑oriented so Copilot has the right guardrails.- "Create Azure Container Apps Dockerfile for [service] with health checks and environment validation."

- Prefer test‑first on calculators and RLS policies; Copilot then fills in safe scaffolding.- "Generate azure.yaml service definition for deployment to Container Apps."

- When in doubt, ask Copilot Chat to **explain its suggestion** and request safer alternatives.- "Add GitHub Actions workflow step for building and deploying to Azure Container Registry."

- Always consider Azure deployment constraints when generating code.

- Ensure every service is containerized and follows Azure Container Apps best practices.---

## 9) Azure Deployment Best Practices

### Container Optimization
- **Multi-stage builds**: Separate build and runtime stages for smaller images
- **Base images**: Use Alpine Linux for minimal attack surface
- **Layer caching**: Order Dockerfile commands to maximize cache hits
- **Security**: Run as non-root user, scan for vulnerabilities

### Environment Configuration
- **Secrets**: Store in Azure Key Vault, reference in Container Apps
- **Configuration**: Use Container App environment variables
- **Database**: Azure PostgreSQL Flexible Server with SSL
- **Monitoring**: Application Insights integration

### Health and Scaling
- **Health checks**: Required `/health` endpoint for each service
- **Readiness**: Verify dependencies (database, external services)
- **Scaling**: Configure auto-scaling rules based on HTTP requests or CPU
- **Logging**: Structured JSON logs for Azure Monitor integration

### CI/CD Pipeline
- **GitHub Actions**: Automated deployment on main branch push
- **Container Registry**: Azure Container Registry for image storage
- **Blue-green deployment**: Zero-downtime updates via Container Apps revisions
- **Rollback**: Quick rollback capability through revision managementver entry point
      trpc.ts        # tRPC configuration
  mobile/            # Next.js PWA (mobile-first, offline-capable)
    Dockerfile       # Production container for Azure Container Apps
    Dockerfile.dev   # Development container
    src/
      app/           # Next.js app router
      components/    # Shared UI components
      contexts/      # React contexts (auth, etc.)
  admin/             # Next.js admin dashboard (web interface)
    (similar structure to mobile)
packages/
  db/                # Database migrations, schemas, RLS helpers
    migrations/      # SQL migration files
    src/             # Database utilities and types
  shared/            # Shared types and schemas (Zod)
    src/
      schemas.ts     # Zod schemas shared between API and frontend
      utils.ts       # Shared utility functions
scripts/
  start.sh           # Local development bootstrap
  stop.sh            # Local environment teardown
  run-migrations.sh  # Database migration runner
  health-check.sh    # Service health verification
infra/               # Azure Bicep infrastructure as code
  main.bicep         # Main infrastructure template
  core/              # Core infrastructure modules
azure.yaml           # Azure Developer CLI configuration
docker-compose.yml   # Local development environment
```

**Copilot hint**: Always consider Azure deployment when generating code. Use the actual project structure above. Hybrid Training Platform

> Goal: Make Copilot an effective co‑developer for the RYTHM multi‑tenant hybrid training app (mobile PWA + admin web + API), optimized for Azure Container Apps deployment with PostgreSQL and Row Level Security. Maximize developer productivity, Azure deployment readiness, and production quality.

---

## TL;DR for Copilot
- **Stack**: Next.js PWA (mobile) + Next.js admin, Node/TypeScript tRPC API, PostgreSQL 15+ with **Row Level Security** on Azure Container Apps.
- **Azure Deployment**: Automated via GitHub Actions → Azure Container Registry → Container Apps with PostgreSQL Flexible Server.
- **Key domain rules**:
  - `sessions.category ∈ {strength, cardio, hybrid}` (required).
  - Each **set** has **two configurable variables** from `{weight_kg, distance_m, duration_s, calories}` with independent selection.
  - **98 exercise templates** (68 strength, 30 cardio) included in fresh deployments.
- **Principles**: Azure-ready containers, strict types, Zod validation, pure functions, idempotent migrations, production-ready logging.
- **Local dev**: Docker Compose with scripts. **Production**: Azure Container Apps with automated CI/CD.

---

## 1) Repository Shape (suggested)
```
apps/
  web/               # Next.js PWA (app router, service worker, offline cache)
  api/               # Node/TS API (Express/tRPC/Fastify), Zod schemas
packages/
  db/                # SQL migrations, drizzle/prisma client, RLS helpers
  ui/                # Shared UI libs/components (shadcn/ui, charts)
  config/            # ESLint, Prettier, TS config, env schema, logger
scripts/
  start.sh           # container bootstrap (compose up, migrate, seed)
  stop.sh            # container teardown (compose down, prune opt-in)
docker/
  docker-compose.yml # web, api, db (postgres), worker, mailhog
  Dockerfile.api
  Dockerfile.web
```

**Copilot hint**: Prefer generating files into these paths. If unsure, ask in Copilot Chat: *“Where should I place X?”*

---

## 2) Azure-Ready Coding Conventions
- **TypeScript**: `"strict": true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **Validation**: Zod schemas mirror DB constraints. Parse at the edge (request/response).
- **Errors**: Never throw raw; wrap in typed error objects and map to HTTP problem details.
- **Auth**: JWT (short‑lived access + rotating refresh). User → Tenant scoping via `tenant_id` in claims; verify against DB on each request for write operations.
- **Database**: PostgreSQL 15+. **RLS enabled** on all tenant tables; use policies by `tenant_id`. Prefer SQL migrations for RLS (clear diffing). ORM is acceptable for models.
- **Time**: Store in UTC (TIMESTAMPTZ). Client displays local time.
- **Units**: Metric by default. Enforce set variable **types** via enum: `set_value_type`.
- **Logging**: Structured JSON logs (pino or similar) with correlation IDs; OpenTelemetry traces optional.
- **Security**: Parameterized queries; never string‑concatenate SQL. Deny‑by‑default CORS; rate‑limit auth routes.
- **Azure Deployment**: Every function must be containerizable and stateless for Azure Container Apps.
- **Environment Variables**: Use Azure Key Vault for secrets, Container App environment variables for configuration.
- **Health Checks**: All services must expose `/health` endpoint for Azure health monitoring.
- **Container Optimization**: Multi-stage Dockerfiles, minimal base images (Alpine), proper layer caching.

---

## 3) Domain Rules (for Copilot)
**Sessions**
- `category: 'strength' | 'cardio' | 'hybrid'` (required).

**Sets**
- Fields: `reps? number`, `value_1_type?`, `value_1_numeric?`, `value_2_type?`, `value_2_numeric?`, `rpe?`.
- `value_*_type ∈ {'weight_kg','distance_m','duration_m','calories'}`. Either/both can be null; if both present and are `distance_m` + `duration_s`, derive **pace** on the API.
- Reject negatives. Large bounds sanity‑checked in API layer.

**Exercise Templates**
- **98 comprehensive exercise templates** (68 strength, 30 cardio) included in fresh deployments.
- Templates support hybrid training with configurable value types.
- Equipment integration with structured equipment catalog.

**Analytics**
- Strength **volume** = Σ(weight_kg × reps) for strength + hybrid sessions (where applicable).
- **Pace** = distance_m / duration_s when both exist.
- **PRs**: 1RM estimators (Epley/Brzycki) for lifts when reps+weight present.

**Duration Handling**
- All durations stored in **minutes** (not seconds) throughout the system.
- Conversion handled at API boundaries for client compatibility.

---

## 4) Prompt Patterns That Work
> Add to file headers or Copilot Chat to steer suggestions.

### Implement a feature (Azure-ready)
```
/* Goal: Add POST /sessions
   Constraints:
   - Validate body with Zod: { startedAt?, category: enum, notes? }
   - Attach tenant_id from auth claims
   - Insert with RLS active (no bypass)
   - Return 201 with created entity (camelCase), problem+json on error
   - Must be stateless for Azure Container Apps
   - Include health check endpoint updates if needed
   Tests:
   - happy path
   - missing/invalid category
   - forbidden cross-tenant insert (RLS)
   - container health scenarios */
```

### Generate Azure-ready containers
```
/* Create Dockerfile for [service]
   - Multi-stage build (dev dependencies separate)
   - Alpine base image for minimal size
   - Health check endpoint on port [PORT]
   - Environment variable validation
   - Non-root user for security
   - Proper layer caching for Azure Container Registry */
```

### Write database migrations
```
-- Create sets value enums, add columns
-- Idempotent, transactional, rollback comment
-- Compatible with Azure PostgreSQL Flexible Server
-- Include RLS policies for multi-tenancy
```

### Generate Azure deployment configs
```
/* Create/update azure.yaml service definition
   - Container app configuration
   - Environment variables (non-secret)
   - Resource requirements for Azure Container Apps
   - Health check configuration
   - Scaling rules if applicable */
```

---

## 5) File & Comment Cues for Copilot
- Start files with a **purpose comment** and list of **acceptance criteria**.
- In tests, preface with `// Scenarios:` and bullet points.
- For SQL, include `-- up` and `-- down` sections or clear comments for idempotency.
- Provide brief examples of expected inputs/outputs for validators.
- **Azure-specific**: Include container health, environment variables, and scaling considerations.

**Example file header (API route):**
```ts
/** POST /sessions
 * Accepts: { category: 'strength'|'cardio'|'hybrid', startedAt?: string, notes?: string }
 * Behavior: attaches tenant_id from JWT; RLS enforced
 * Returns: 201 {session} | 400 | 401 | 403 | 500
 * Azure: Stateless, uses env vars, includes health metrics
 * Tests: unit (zod), integration (supertest), e2e (playwright) */
```

**Example Dockerfile header:**
```dockerfile
# Multi-stage Dockerfile for Azure Container Apps
# Stage 1: Build dependencies and compile TypeScript
# Stage 2: Production runtime with minimal Alpine base
# Health check: GET /health
# Environment: See azure.yaml for required variables
```

---

## 6) Local Containers (Start/Stop)
> Use these as templates. Place in `scripts/` and make them executable (`chmod +x`).

**scripts/start.sh**
```sh
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export COMPOSE_PROJECT_NAME=rythm
export POSTGRES_PASSWORD=password
export POSTGRES_USER=rythm_api
export POSTGRES_DB=rythm

echo "▶ Building and starting containers..."
docker-compose up -d --build

echo "▶ Waiting for Postgres..."
until docker exec rythm-db-1 pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
  sleep 1
done

echo "▶ Database ready with consolidated schema..."
echo "✅ Environment ready:"
echo "📱 Mobile PWA: http://localhost:3000"
echo "🔧 Admin Web:  http://localhost:3002"  
echo "🚀 API Server: http://localhost:3001"
echo "🗄️ Database:   localhost:5432"
```

**scripts/stop.sh**
```sh
#!/usr/bin/env bash
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export COMPOSE_PROJECT_NAME=rythm

echo "⏹ Stopping containers..."
docker-compose down

read -r -p "Also remove volumes? This deletes local DB data. (y/N) " yn
case "$yn" in
  [Yy]* ) docker-compose down -v && docker system prune -f ;;
  * ) echo "Keeping volumes." ;;
esac

echo "🧹 Done."
```

**docker-compose.yml (actual RYTHM project)**
```yaml
services:
  # PostgreSQL Database with consolidated schema
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: rythm
      POSTGRES_USER: rythm_api
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./packages/db/migrations:/docker-entrypoint-initdb.d
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rythm_api -d rythm"]
      interval: 30s
      timeout: 10s
      retries: 3

  # tRPC API Server
  api:
    build:
      context: .
      dockerfile: ./apps/api/Dockerfile.dev
    environment:
      - NODE_ENV=development
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=rythm
      - DB_USER=rythm_api
      - DB_PASSWORD=password
      - JWT_SECRET=your-development-secret-key
      - PORT=3001
    ports: ["3001:3001"]
    depends_on:
      db: { condition: service_healthy }

  # Mobile PWA (Next.js)
  mobile:
    build:
      context: .
      dockerfile: ./apps/mobile/Dockerfile.dev
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    ports: ["3000:3000"]
    depends_on:
      api: { condition: service_healthy }

  # Admin Dashboard (Next.js)
  admin:
    build:
      context: .
      dockerfile: ./apps/admin/Dockerfile.dev
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    ports: ["3002:3002"]
    depends_on:
      api: { condition: service_healthy }

volumes:
  postgres_data:

networks:
  default:
    name: rythm-network
```

---

## 7) Testing Guidance (for Copilot)
- **Unit**: calculators (pace, 1RM), mappers, guards. 100% branch coverage aimed here.
- **Integration**: API + DB with a **test schema**. Wrap each test in a transaction and roll back.
- **RLS tests**: prove cross‑tenant queries fail; same‑tenant succeed.
- **e2e**: Offline log → reconnect → conflict resolution (server wins with deterministic merge).

**Example Vitest sketch**
```ts
import { describe, it, expect } from 'vitest';
import { pace } from '../lib/calc';

describe('pace', () => {
  it('computes m/s when both inputs valid', () => {
    expect(pace(2000, 400)).toBeCloseTo(5, 5);
  });
  it('throws on zero/negative duration', () => {
    expect(() => pace(1000, 0)).toThrow();
  });
});
```

---

## 8) Copilot Chat: Handy Prompts
- “Generate a Zod schema and TS type for a set with two variable fields; enforce enums.”
- “Create SQL for an `enum set_value_type` and alter `sets` to add `value_1_*` and `value_2_*` columns idempotently.”
- “Write Playwright tests for offline logging then sync.”
- “Refactor controller to pure functions + dependency injection; create test doubles.”
- “Draft RLS policies for tenant isolation on `sessions` and `sets` using `tenant_id` and `auth.jwt()`. Add tests.”

---

## 9) Editor/Tooling Settings
- `.editorconfig` for spaces, LF, utf‑8.
- ESLint + Prettier configured; pre‑commit hook with `lint-staged`.
- VS Code: enable Copilot + Copilot Chat, TypeScript SDK workspace version, “Format on Save”.
- `.copilotignore` to omit large datasets or generated clients from context if needed.

---

## 10) PRs & Commits
- Conventional commits (`feat:`, `fix:`, `chore:`…). Scope by package when possible.
- PR template: problem, approach, screenshots, **tests** added, risk & rollback.
- Require green unit/integration CI and at least one RLS test for data‑layer changes.

---

## 11) Common Anti‑patterns (Ask Copilot to avoid)
- Disabling RLS or using `SECURITY DEFINER` without review.
- Mixing validation, business logic, and IO in the same function.
- Returning DB shapes directly to clients (no DTO mapping).

---

## 12) Quick Stubs (Copilot seeds)

**Zod session schema**
```ts
export const SessionCreate = z.object({
  category: z.enum(['strength','cardio','hybrid']),
  startedAt: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});
```

**Pace calculator**
```ts
export function pace(distance_m: number, duration_s: number) {
  if (duration_s <= 0 || distance_m < 0) throw new Error('invalid');
  return distance_m / duration_s; // m/s
}
```

**1RM (Epley)**
```ts
export function oneRmEpley(weight_kg: number, reps: number) {
  if (weight_kg <= 0 || reps <= 0) throw new Error('invalid');
  return weight_kg * (1 + reps / 30);
}
```

---

## 13) Final Notes
- Keep comments crisp and action‑oriented so Copilot has the right guardrails.
- Prefer test‑first on calculators and RLS policies; Copilot then fills in safe scaffolding.
- When in doubt, ask Copilot Chat to **explain its suggestion** and request safer alternatives.
