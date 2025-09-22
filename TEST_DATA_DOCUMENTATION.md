# RYTHM Test Data Population - Updated Version

## Overview
This document describes the comprehensive test data population system for the RYTHM platform development environment. The system creates realistic test data including users, workout templates, and historical workout sessions spanning 6 months.

## Script Location
- **Main Script**: `scripts/populate-test-data.js`
- **Package Script**: `npm run populate-test-data`

## Generated Data Summary

### User Accounts
1. **System Administrator**
   - Email: `orchestrator@rythm.training`
   - Password: `Password123`
   - Role: `system_admin`
   - Tenant: System Administration (rythm.training)

2. **Test User**
   - Email: `lars-olof@allerhed.com`
   - Password: `Password123`
   - Role: `athlete`
   - Name: Lars-Olof Allerhed
   - Organization: Allerhed Organization (allerhed.com)

### Workout Templates (System Scope)
The script creates 5 comprehensive workout templates with detailed exercise specifications:

1. **Hybrid Strength Lower Body** (Strength)
   - 13 exercises including Row, Ski-erg, Box jump, Back squat, Deadlift, Bulgarian split squat, Leg Extensions, Leg Curl, GHD Back, Pallof press, GHD Situps, Sled Push, Sled Pull
   - Training Load: Random 95-145
   - Perceived Exertion: Random 6-9

2. **Hybrid Strength Upper Body** (Strength)
   - 18 exercises including Ski-erg, Row, Med-ball chest pass, 1000m Row, Incline Dumbbell Press, Bench press, Push-ups, Standing overhead press, Ring Rows, Lat Pull Down variations, Seated row, Dumbbell Biceps Curl, Cable Triceps Push, Farmers carry, Wall-balls
   - Training Load: Random 75-135
   - Perceived Exertion: Random 4-8

3. **Run** (Cardio)
   - Single exercise: Run
   - Training Load: Random 60-90
   - Perceived Exertion: Random 4-9

4. **Echo Bike** (Cardio)
   - Single exercise: Echobike
   - Training Load: Random 35-70
   - Perceived Exertion: Random 3-9

5. **Hyrox Simulation** (Hybrid)
   - 16 exercises alternating between Run 200M and various functional movements (Skierg, Sled Push, Sled Pull, Burpee Broadjumps, Rowing, Farmers Carry, Sandbag Lunges, Wallballs)
   - Training Load: Random 95-145
   - Perceived Exertion: Random 6-9

### Generated Workouts
- **Quantity**: 100 complete workout sessions for the test user
- **Time Range**: 6 months back from today's date to present
- **Total Sets**: 1,926 sets generated across all workouts
- **Data Variety**: Randomized training loads, perceived exertion ratings, rep counts, weights, and durations
- **Exercise Matching**: Uses intelligent exercise name matching from the existing 44 active exercises in the database

## Database Schema Compliance
The script respects all database constraints and relationships:
- **Tenant Isolation**: Proper tenant_id assignment for all records
- **UUID Primary Keys**: All entities use UUID primary keys as per schema
- **Foreign Key Relationships**: Maintains proper relationships between users, tenants, sessions, and sets
- **Enum Constraints**: Uses correct enum values for user roles, session categories, and set value types
- **Check Constraints**: Ensures all numeric values meet database constraints (positive values, RPE ranges, etc.)

## Exercise Template Integration
- **Exercise Templates**: 98 exercise templates available (68 strength, 30 cardio)
- **Exercise Mapping**: Intelligent name matching between template exercises and actual database exercises
- **Value Generation**: Realistic weight, duration, distance, and repetition values based on exercise categories

## Usage Instructions

### Running the Script
```bash
cd /path/to/RYTHM
npm run populate-test-data
```

### Prerequisites
1. Docker environment running with PostgreSQL database
2. All database migrations applied
3. Exercise templates loaded (98 templates should be present)
4. Node.js dependencies installed

### Verification Commands
```sql
-- Check user accounts
SELECT email, first_name, last_name, role FROM users 
WHERE email IN ('orchestrator@rythm.training', 'lars-olof@allerhed.com');

-- Check workout templates
SELECT name, scope FROM workout_templates WHERE scope = 'system' ORDER BY name;

-- Check generated sessions
SELECT COUNT(*) FROM sessions WHERE user_id = (
  SELECT user_id FROM users WHERE email = 'lars-olof@allerhed.com' LIMIT 1
);

-- Check generated sets
SELECT COUNT(*) FROM sets s 
JOIN sessions sess ON s.session_id = sess.session_id 
WHERE sess.user_id = (
  SELECT user_id FROM users WHERE email = 'lars-olof@allerhed.com' LIMIT 1
);
```

## Data Characteristics

### Realistic Variation
- **Rep Counts**: Slight variations around template defaults (±2-3 reps)
- **Weights**: Random weights between 20-150kg for strength exercises
- **Durations**: Time-based exercises with realistic duration ranges
- **RPE Values**: Perceived exertion ratings between 6-9 for most exercises
- **Session Duration**: Workout durations between 30-120 minutes

### Exercise Categories
- **Strength Exercises**: Include weight and rep values
- **Cardio Exercises**: Include duration and sometimes distance values
- **Hybrid Exercises**: Combination of both strength and cardio elements

### Data Distribution
- **Template Usage**: Random selection from all 5 templates for workout generation
- **Temporal Distribution**: Even distribution across 6-month period
- **Training Load**: Varies according to template specifications
- **Perceived Exertion**: Realistic RPE values matching workout intensity

## Development Environment Ready
This test data provides a comprehensive foundation for:
- **Frontend Development**: Realistic data for UI components and dashboards
- **Analytics Testing**: Sufficient data volume for analytics calculations and charts
- **User Experience Testing**: Multiple workout types and exercise variations
- **Authentication Testing**: Both admin and user accounts for role-based testing
- **Multi-tenant Testing**: Separate organizations for tenant isolation verification

## Script Maintenance
The script is designed to be:
- **Idempotent**: Can be run multiple times safely (cleans up existing test templates)
- **Schema-Aware**: Automatically adapts to database schema constraints
- **Error-Resistant**: Includes proper error handling and transaction management
- **Configurable**: Easy to modify template specifications and data generation parameters

## Exercise Template Loading
The script verifies that exercise templates are loaded but does not load them itself. To load exercise templates:

```bash
# Primary exercise loading script
scripts/populate-hybrid-exercises.sh

# Alternative SQL file
exercise_templates_master.sql
```

Both scripts load the same 98 exercise templates (68 strength, 30 cardio) that are referenced by the test data generation.