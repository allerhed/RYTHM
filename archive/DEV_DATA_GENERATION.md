# RYTHM Test Data Population

This script populates the RYTHM development environment with comprehensive test data for development and testing purposes.

## What it Creates

### 👥 Users
- **System Administrator**: `orchestrator@rythm.training` / `Password123`
  - Role: tenant_admin
  - Full system access for administration

- **Test User**: `lars-olof@allerhed.com` / `Password123`
  - Role: athlete
  - Name: Lars-Olof Allerhed
  - Organization: allerhed.com
  - Has 100 generated workouts over the past 6 months

### 💪 Workout Templates (System Scope)

1. **Hybrid Strength Lower Body** - 13 exercises
   - 4-min Row, 4-min Ski-erg
   - Box jumps (3×5), Back squat (5×10), Deadlift (4×10)
   - Bulgarian split squat, Leg Extensions, Leg Curl (3×10 each)
   - GHD Back, Pallof press, GHD Situps (3×15 each)
   - Sled Push (4×20m), Sled Pull (4×30m)

2. **Hybrid Strength Upper Body** - 18 exercises
   - 4-min Ski-erg, 4-min Row
   - Med-ball chest pass (3×5), 1000m Row
   - Bandet Y,T,W (3×10), Incline Dumbbell Press (3×15)
   - Bench press (4×15), Push-ups (3×15)
   - Standing overhead press (3×15), Seated Trap Pull (3×10)
   - Ring Rows, Lat Pull Down Wide/Narrow, Seated row (3×10 each)
   - Dumbbell Biceps Curl, Cable Triceps Push (3×10 each)
   - Farmers carry (4×40m), Wall-balls (3×15)

3. **Run** - Simple running workout
4. **Echo Bike** - Echo bike cardio workout
5. **Hyrox Simulation** - 16 exercises
   - Alternating 200m runs with functional movements
   - 2-min stations: Skierg, Sled Push, Sled Pull, Burpee Broadjumps, Rowing, Farmers Carry, Wallballs
   - Includes Sandbag Lunges

### 🏋️ Generated Workouts (Past 6 Months)
- **100 total workouts** for lars-olof@allerhed.com
- Randomly distributed across **78 unique days**
- **1,110 total sets** with realistic data
- Random variations in:
  - Workout timing (30-120 minutes)
  - Reps (±2 from template values)
  - Weights (20-150kg for strength exercises)
  - RPE (6-9 range)

## Usage

### Prerequisites
- RYTHM development environment running (`npm run dev`)
- PostgreSQL database accessible at localhost:5432

### Run the Script
```bash
# From the root directory
npm run populate-test-data

# Or directly
node scripts/populate-test-data.js
```

### Verify the Data
```bash
# Check users
docker-compose exec db psql -U rythm_api -d rythm -c "SELECT email, first_name, last_name, role FROM users;"

# Check workout templates
docker-compose exec db psql -U rythm_api -d rythm -c "SELECT name, scope FROM workout_templates;"

# Check generated workouts
docker-compose exec db psql -U rythm_api -d rythm -c "SELECT COUNT(*) FROM sessions;"
```

## Safety Features

- **Idempotent**: Safe to run multiple times - checks for existing data
- **Non-destructive**: Only creates new data, doesn't modify existing
- **Transactional**: Database operations wrapped in transactions
- **Validation**: Includes data validation and error handling

## Access the Applications

After running the script, you can access:

- **Mobile PWA**: http://localhost:3000
- **Admin Web**: http://localhost:3002  
- **API Server**: http://localhost:3001

### Test Login Credentials
- **Admin**: `orchestrator@rythm.training` / `Password123`
- **User**: `lars-olof@allerhed.com` / `Password123`

## Database Schema Compliance

The script is designed to work with the current RYTHM database schema:
- Uses proper UUID primary keys
- Respects foreign key constraints
- Implements tenant isolation
- Follows the sets value type system (`weight_kg`, `distance_m`, `duration_m`, `calories`)

## Troubleshooting

If the script fails:
1. Ensure the database is running and accessible
2. Check that all containers are healthy: `docker-compose ps`
3. Review database logs: `docker-compose logs db`
4. Clear partial data if needed:
   ```sql
   DELETE FROM sessions WHERE user_id = (SELECT user_id FROM users WHERE email = 'lars-olof@allerhed.com');
   ```