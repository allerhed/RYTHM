# Database Migration Strategy

This document explains the consolidated database migration approach for the RYTHM fitness platform.

## Overview

The database migration system has been redesigned to support both fresh deployments and incremental updates:

1. **Fresh Deployments**: Use a single consolidated schema file
2. **Existing Databases**: Continue using individual migration files

## Files

### Consolidated Schema
- `000_consolidated_schema.sql` - Complete database schema for fresh deployments
- Contains all tables, indexes, views, functions, RLS policies, and initial data
- Includes all changes from individual migration files consolidated into one

### Individual Migration Files
- `001_complete_initial_schema.sql` - Original complete schema
- `004_workout_templates.sql` - Workout templates feature
- `005_duration_seconds_to_minutes_fixed.sql` - Duration conversion (seconds → minutes)
- `005_equipment_table.sql` - Equipment management system

## How It Works

### Fresh Database Deployment
1. Migration runner detects empty database
2. Applies `000_consolidated_schema.sql` directly
3. Marks all individual migrations as "executed" to prevent conflicts
4. Database is ready immediately without running individual migrations

### Existing Database Updates
1. Migration runner detects existing tables
2. Runs only pending individual migration files
3. Maintains backward compatibility with existing deployments

## Benefits

### For Fresh Deployments
- ✅ **Single transaction**: Entire schema created atomically
- ✅ **No migration conflicts**: Eliminates enum transaction issues
- ✅ **Faster deployment**: One SQL file instead of multiple migrations
- ✅ **Simplified testing**: Fresh test environments setup instantly

### For Existing Deployments
- ✅ **Zero disruption**: Existing databases continue normal migration flow
- ✅ **Incremental updates**: New migrations still work as expected
- ✅ **Rollback capability**: Individual migrations can be reverted if needed

## Usage

### Automatic (Recommended)
The migration runner automatically detects database state:

```bash
npm run db:migrate
```

### Manual Fresh Schema (Advanced)
To force consolidated schema on empty database:

```sql
-- Run 000_consolidated_schema.sql directly
\i packages/db/migrations/000_consolidated_schema.sql
```

## Development Workflow

### Adding New Features
1. Create new migration file: `006_new_feature.sql`
2. Update `000_consolidated_schema.sql` to include the changes
3. Test both paths:
   - Fresh deployment (consolidated schema)
   - Incremental update (individual migration)

### Schema Updates
When updating the consolidated schema:
1. Include all current table structures
2. Include all current data (initial seeds)
3. Include all indexes, views, and policies
4. Test on fresh database to ensure completeness

## Current Schema Features

The consolidated schema includes:

- **Multi-tenancy**: Full tenant isolation with RLS policies
- **User management**: Roles, authentication, profiles
- **Exercise library**: Global exercise database with equipment
- **Exercise templates**: 98 comprehensive exercise templates (68 strength, 30 cardio)
- **Workout templates**: Reusable workout structures
- **Training sessions**: Session tracking with flexible value types
- **Analytics**: Materialized views for performance metrics
- **Duration handling**: All durations in minutes (not seconds)
- **Equipment management**: Structured equipment catalog

### Exercise Templates Library

The consolidated schema includes 98 exercise templates optimized for hybrid training:

**Strength Templates (68):**
- Compound movements (squats, deadlifts, bench press)
- Olympic lifting (cleans, snatches, jerks)
- Functional movements (thrusters, Turkish get-ups)
- Plyometric exercises (box jumps, medicine ball slams)
- Unilateral training (Bulgarian split squats, single-leg deadlifts)
- Upper body push/pull variations
- Core strengthening exercises
- CrossFit-style functional movements

**Cardio Templates (30):**
- Running variations (easy runs, intervals, hill sprints)
- Cycling workouts (zone 2, HIIT, hill climbing)
- Swimming exercises
- Machine cardio (echo bike, ski erg, rowing)
- High-intensity movements (mountain climbers, battle ropes)
- Jump rope variations
- Recovery cardio (walking, easy cycling)

## Environment Variables

No additional configuration needed. The migration runner uses existing database connection settings.

## Troubleshooting

### Fresh Deployment Issues
- Verify `000_consolidated_schema.sql` includes all recent changes
- Check database permissions for schema creation
- Ensure database is completely empty before deployment

### Migration Conflicts
- Run migrations manually to identify specific conflicts
- Check `migrations` table for execution history
- Verify enum types and constraints

### Recovery
If consolidated schema fails, the system falls back to individual migrations automatically.