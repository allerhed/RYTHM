# Test Data Generation for RYTHM Workout App

This directory contains scripts to generate realistic test data for the RYTHM workout application.

## Quick Start

```bash
# Generate test data with 2 users and 200 workout sessions
npm run generate-test-data
```

## What Gets Created

The test data generation script creates:

### Test Users
- **lars-olof@allerhed.com** / Password123
- **caroline@allerhed.com** / Password123

Both users are created with the role `athlete`.

### Workout Data
- **100 workouts per user** (200 total)
- **6 months of historical data** (randomly distributed)
- **Mixed workout types**: Strength and Cardio sessions
- **Realistic exercise selection**: 1-3 exercises per workout
- **Varied training volumes**: 2-5 sets per exercise
- **Randomized metrics**:
  - Duration: 20-90 minutes
  - Training load: 50-150 (calculated based on category and duration)
  - RPE: 6.0-9.5

### Exercise Database
- **20 strength exercises** (squats, deadlifts, bench press, etc.)
- **10 cardio exercises** (running, cycling, rowing, etc.)
- **Proper muscle group mapping**
- **Equipment categorization**

### Set Data
**For Strength Training:**
- Weight (kg) + repetitions
- RPE (Rate of Perceived Exertion)

**For Cardio Training:**
- Duration (seconds)
- Distance (meters) - for some exercises
- Calories - for some exercises
- RPE

## Script Details

### Main Script
- **File**: `scripts/generate-test-data.js`
- **Language**: Node.js
- **Dependencies**: `pg`, `bcrypt`, `uuid`

### Runner Script
- **File**: `scripts/generate-test-data.sh`
- **Purpose**: Environment setup and execution wrapper

## Database Requirements

The script requires a running PostgreSQL database with the RYTHM schema. Ensure:

1. **Docker containers are running**:
   ```bash
   docker-compose up db -d
   ```

2. **Database is accessible** on localhost:5432

3. **Schema is migrated** (happens automatically with Docker setup)

## Configuration

The script uses these environment variables (with defaults):

```bash
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port  
DB_NAME=rythm             # Database name
DB_USER=rythm_api         # Database user
DB_PASSWORD=password      # Database password
```

## Data Quality Features

### Realistic Training Patterns
- **Progressive difficulty**: Varying RPE scores
- **Balanced programming**: Mix of strength and cardio
- **Temporal distribution**: Workouts spread over 6 months
- **Varied intensity**: Different training loads based on duration and type

### Exercise Variety
- **Compound movements**: Squats, deadlifts, bench press
- **Isolation exercises**: Leg curls, tricep dips
- **Cardio modalities**: Running, cycling, rowing, bodyweight
- **Equipment diversity**: Barbells, dumbbells, machines, bodyweight

### Realistic Metrics
- **Weight progression**: 20-150kg range for strength exercises
- **Cardio metrics**: Distance (1-10km), duration (5-30 min), calories (50-400)
- **Training load calculation**: Based on session type and duration
- **RPE distribution**: Realistic 6.0-9.5 range

## Re-running the Script

The script is designed to be **idempotent**:
- **Users**: Updates existing users rather than creating duplicates
- **Exercises**: Skips creation if exercise name already exists
- **Tenants**: Reuses existing tenant if found

To completely reset test data:

```bash
# Clear all data and regenerate
docker-compose down -v
docker-compose up -d
npm run generate-test-data
```

## Testing the Generated Data

After running the script, you can:

1. **Login to apps**:
   - User App: http://localhost:3000
   - Admin Panel: http://localhost:3002

2. **Verify data via API**:
   ```bash
   # Get user sessions
   curl "http://localhost:3001/api/trpc/sessions.getUserSessions"
   ```

3. **Check database directly**:
   ```bash
   docker-compose exec db psql -U rythm_api -d rythm
   ```

## Customization

To modify the test data:

1. **Edit user list** in `generate-test-data.js`:
   ```javascript
   const TEST_USERS = [
     { email: 'your-email@example.com', password: 'YourPassword', ... }
   ];
   ```

2. **Adjust workout count**:
   ```javascript
   for (let i = 0; i < 100; i++) { // Change 100 to desired count
   ```

3. **Modify date range**:
   ```javascript
   sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6); // Change -6 to desired months
   ```

4. **Add exercises**:
   ```javascript
   const EXERCISES = {
     strength: [
       { name: 'New Exercise', muscle_groups: ['chest'], equipment: 'barbell' }
     ]
   };
   ```

## Troubleshooting

### Common Issues

**"Database container is not running"**
```bash
docker-compose up db -d
```

**"Column does not exist" errors**
- Ensure database schema is up to date
- Check migration files in `packages/db/migrations/`

**"No space left on device"**
```bash
docker system prune -f
```

**Permission denied on scripts**
```bash
chmod +x scripts/generate-test-data.sh
```

### Verification Queries

```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- Check workout distribution
SELECT category, COUNT(*) FROM sessions GROUP BY category;

-- Check date range
SELECT MIN(started_at), MAX(started_at) FROM sessions;

-- Check exercise usage
SELECT e.name, COUNT(s.set_id) as sets 
FROM exercises e 
JOIN sets s ON e.exercise_id = s.exercise_id 
GROUP BY e.name 
ORDER BY sets DESC;
```