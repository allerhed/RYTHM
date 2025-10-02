## Product Requirements Document (PRD)
### Project Title: RYTHM

## 1) Vision & Goals
Build a **hybrid training** mobile web app (PWA) with a **web admin** interface that consolidates strength, cardio, and mixed (hybrid) workouts. Emphasis on:
- **Frictionless logging** (fast set/session capture)
- **Clarity of trends** (training volume, muscle split, pace, PRs)
- **Multi‑tenant** operations (gyms/coaches/teams), secure data isolation
- **PostgreSQL** for auth & storage, with **Row Level Security (RLS)**

## 2) Target Users
- **Athletes** (hybrid, CrossFit, Hyrox, runners, lifters) who want simple logging + rich insights.
- **Coaches/Boxes/Teams (Tenants)** needing programs, roster management, and progress visibility.
- **Admins** managing exercises, programs, and tenant configuration.

## 3) Scope (v1)
- **Mobile Web App (PWA)**
  - Session creation with **category: strength | cardio | hybrid**
  - Set logging with **two configurable variables** (any of: weight kg, distance m, duration s, calories)
  - Exercise search & quick-add; program day view; PR notifications
  - Trend dashboards: training volume, muscle split, pace/speed, 1RM estimates
  - Offline-first logging with background sync
- **Web Admin**
  - Tenants, users, roles; exercise library CRUD; program builder; content assets
  - Program assignment; visibility rules; analytics overview by team/athlete
- **Data & Security**
  - PostgreSQL + JWT auth; multi-tenant via `tenant_id` + RLS policies
  - Metrics pipeline for trends (materialized views or jobs)

## 4) Success Metrics
- TTI < 2.5s on mid-range phones; p95 log-set < 500ms
- 7‑day retention ≥ 35% athletes; coach NPS ≥ 40
- ≥ 95% successful offline-to-online sync events
- < 0.1% RLS policy violations (blocked/not leaked), zero confirmed breaches

## 5) User Stories (abridged)
- As an **athlete**, I can start a session and **choose category** = strength/cardio/hybrid so analytics reflect modality.
- As an **athlete**, I can log a **set** with **two variables** chosen independently from (weight kg, distance m, duration s, calories), e.g.:
  - Strength set: weight kg + duration s (timed holds) or weight kg + calories (rare) or weight kg + —
  - Cardio set: distance m + duration s (pace derivable) or duration s + calories
  - Hybrid: any combination as above
- As a **coach**, I can build programs from a tenant exercise library, publish to teams, and monitor adherence.
- As a **tenant admin**, I can invite users and assign roles with scoped permissions.
- As an **athlete**, I can see **trends** for training volume, muscle split and PRs over custom ranges.

## 6) Feature Requirements
### 6.1 Session & Set Logging
- **Session.category** enum: `strength | cardio | hybrid` (required)
- **Set variables**: 2 fields; both selectable from the same options (weight_kg, distance_m, duration_s, calories). Either or both may be unused depending on exercise.
- **UX**: quick-add last weight/reps; swipe to save; voice/number pad entry; unit hints.
- **Derived metrics** (computed when possible):
  - **Strength volume**: Σ(weight_kg × reps) across sets marked strength or hybrid strength-leaning
  - **Pace**: distance_m / duration_s (if both present)
  - **Energy**: Σ calories (if present)
  - **1RM est.**: Epley/Brzycki when reps & weight available
- **Validation**: type-specific ranges; reject negative values; allow null where not logged.

### 6.2 Exercise Library
- Fields: name, category, muscle_groups[], equipment, standards, media (video/image), notes
- Tenant-scoped + global seeds; versioning when edited by tenant.

### 6.3 Programs & Workflows
- Program builder (weeks, sessions, exercises, targets) with %1RM or pace targets
- Assign to athlete(s)/team(s); calendars & adherence views
- Auto‑progression rules (optional v1.1)

### 6.4 Trends & Insights
- Training volume by week; muscle split by sets/volume; PR feed; pace charts (if cardio data)
- Filters by **session.category**, date range, program, muscle group
- Export CSV (tenant-scoped)

### 6.5 Admin (Web)
- Tenants: branding, domains, default units, locales
- Users/Roles: `athlete`, `coach`, `tenant_admin`, `org_admin`
- Programs & Exercises CRUD; bulk import; media upload
- Audit log for changes

## 7) Non‑Functional Requirements
- **Performance**: p95 API < 300ms for read, < 600ms for write under normal load
- **Availability**: 99.9% (cloud); graceful degradation offline for PWA
- **Security**: RLS enforced for *all* tables; least-privilege; encrypted at rest & TLS in transit
- **Privacy**: GDPR compliant; data processing records; per-tenant data portability
- **Accessibility**: WCAG 2.1 AA
- **Internationalisation**: Metric units primary; locales (en, sv) targeted first

## 8) Architecture Overview
- **Client**: PWA (React/Next or similar), Service Worker for offline caching/sync
- **API**: TypeScript Node (tRPC/REST), Zod validation, JWT auth
- **DB**: PostgreSQL 15+, **multi-tenant via `tenant_id`** columns + **RLS policies**
- **Background**: queue/cron for metrics rollups; materialized views for trends
- **Telemetry**: OpenTelemetry traces, application logs with PII scrubbing

## 9) Data Model (Simplified)
> Not exhaustive; names illustrative. All tables include `tenant_id`, `created_at`, `updated_at`, and RLS policies keyed on `tenant_id`.

```sql
-- Enumerations
CREATE TYPE session_category AS ENUM ('strength','cardio','hybrid');
CREATE TYPE set_value_type AS ENUM ('weight_kg','distance_m','duration_s','calories');

-- Users & Tenancy
users(user_id UUID PK, tenant_id UUID, email CITEXT UNIQUE, password_hash TEXT, role TEXT, ...);
tenants(tenant_id UUID PK, name TEXT, branding JSONB, ...);

-- Exercises
exercises(exercise_id UUID PK, tenant_id UUID, name TEXT, muscle_groups TEXT[], equipment TEXT, media JSONB, ...);

-- Programs & Workouts
programs(program_id UUID PK, tenant_id UUID, name TEXT, description TEXT, duration_weeks INT, ...);
workouts(workout_id UUID PK, program_id UUID FK, tenant_id UUID, name TEXT, day_index INT, ...);

-- Sessions
sessions(session_id UUID PK, tenant_id UUID, user_id UUID FK, program_id UUID NULL, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ NULL, category session_category NOT NULL, notes TEXT);

-- Sets (per session + exercise)
sets(
  set_id UUID PK,
  tenant_id UUID,
  session_id UUID FK,
  exercise_id UUID FK,
  set_index INT,          -- 1..N within exercise
  reps INT NULL,
  -- two configurable variables (each independently chosen from the same set of options)
  value_1_type set_value_type NULL,
  value_1_numeric NUMERIC(10,3) NULL,
  value_2_type set_value_type NULL,
  value_2_numeric NUMERIC(10,3) NULL,
  rpe NUMERIC(3,1) NULL,
  notes TEXT
);

-- Examples:
-- Strength back squat: reps=5, value_1_type='weight_kg', value_1_numeric=140.0; value_2_type=NULL
-- Cardio row: value_1_type='distance_m', value_1_numeric=2000; value_2_type='duration_s', value_2_numeric=420
-- Hybrid metcon: any combination depending on station targets
```

**Constraints & Validations**
- Allow either/both variable fields; both draw from identical option set (weight_kg, distance_m, duration_s, calories).
- `reps` required for traditional strength sets; optional otherwise.
- CHECKs: values >= 0; integer-like values validated at API (duration s, distance m) while stored as NUMERIC.
- Indexes on (`tenant_id`,`user_id`,`started_at`), (`tenant_id`,`exercise_id`), (`tenant_id`,`category`,`started_at`).

## 10) API (High‑Level)
- `POST /sessions` create (requires `category`), `GET /sessions?category=...`
- `POST /sessions/{id}/sets` add sets with variable fields
- `GET /analytics/volume?from=&to=&category=`
- `GET /programs`, `POST /programs`, `PUT /exercises/{id}` (admin scoped)
- Auth: `/auth/register`, `/auth/login`, `/auth/refresh`

## 11) Analytics & Formulas
- **Training volume (strength)**: Σ(weight_kg × reps) over strength/hybrid sessions
- **Pace**: distance_m / duration_s
- **Muscle split**: sum per muscle group by sets or volume
- **PRs**: per exercise best of derived 1RM or best weight×reps

## 12) Dev & Test
- **Local stack (containers)** via `docker compose`:
  - `api`, `web`, `db` (Postgres), `worker`, `mailhog` (optional)
- **Scripts**:
  - `./scripts/start.sh` → build (if needed), `docker compose up -d`, run migrations & seeds
  - `./scripts/stop.sh` → `docker compose down -v` (prompt before volume removal)
- **Testing**:
  - Unit tests (entity mappers, validators), integration (API + DB with test schema), e2e (Playwright)
  - Seeded fixtures per tenant; RLS tests to ensure isolation

## 13) Milestones (example)
- **M0 (Week 0–1)**: Design finalisation; data model & RLS policies
- **M1 (Week 2–4)**: Sessions & sets logging + PWA offline skeleton
- **M2 (Week 5–7)**: Trends MVP (volume, PRs) + Admin exercises/programs
- **M3 (Week 8–9)**: Multi-tenant polish, roles, exports, i18n
- **M4 (Week 10)**: Hardening, perf, accessibility, beta rollout

## 14) Acceptance Criteria (v1 key)
- Session creation requires `category`; filtering by category works in analytics
- Sets accept any combination in **both** variable fields from {weight_kg, distance_m, duration_s, calories}
- Trend pages reflect correct formulas (unit tested)
- RLS verified: cross-tenant access attempts fail in tests
- PWA fully functional offline for logging; sync resolves conflicts deterministically

## 15) Open Questions
- Should we enforce specific combos per exercise template (e.g., default variable types)?
- Do we add heart rate, elevation and cadence as optional telemetry in v1.1?
- Social features (feed/compare) v1 or v1.1?
