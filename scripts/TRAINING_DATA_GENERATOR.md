# Training Data Generator

Generates realistic training session data based on Lars' typical training week. Creates historical workout data with randomized training loads, RPE values, and performance metrics.

## Features

✅ **7-Day Training Schedule**
- Monday: Leg Day (strength)
- Tuesday: Easy Run - Zone 2 (cardio)
- Wednesday: Push Day (strength)
- Thursday: Interval Run (cardio)
- Friday: Pull Day (strength)
- Saturday: Long Run - Zone 2 (cardio)
- Sunday: Rest Day

✅ **Realistic Data Generation**
- Random training loads (35-155 range based on workout type)
- Random RPE values (1.0-10.0 scale)
- Progressive overload simulation (weights increase over time)
- Workout skip probability (simulates real-life missed sessions)
- Set-to-set fatigue simulation (later sets slightly harder)
- Time-of-day variation (morning for strength, evening for cardio)

✅ **Configurable Parameters**
- User selection by email
- Number of weeks to generate
- Variance on/off toggle
- Skip probability adjustment
- Progression rate customization

## Prerequisites

```bash
# Install dependencies
npm install

# Ensure database is running
npm run dev
```

## Usage

### Interactive Mode (Recommended)

```bash
npm run generate-training-data
```

The script will prompt you for:
1. **User email** - The user to generate data for
2. **Number of weeks** - How many weeks of history (default: 12)
3. **Include variance** - Add randomness to weights/reps (default: yes)
4. **Skip probability** - Chance of missing workouts (default: 0.08 = 8%)
5. **Progression rate** - Weekly strength gains (default: 0.02 = 2%)

### Example Session

```
🏋️  RYTHM Training Data Generator

This script generates realistic training session data based on Lars' training week.

Enter user email: lars@example.com
✅ Found user: Lars Allerhed (a1b2c3d4-...)

How many weeks of history to generate? (default: 12): 16
Include random variance in loads/reps? (y/n, default: y): y
Probability of skipping workouts? (0-1, default: 0.08): 0.1
Weekly progression rate? (0-1, default: 0.02 = 2% per week): 0.03

📋 Configuration:
  User: Lars Allerhed (lars@example.com)
  Weeks: 16
  Include variance: Yes
  Skip probability: 10.0%
  Progression rate: 3.0% per week
  Estimated sessions: ~86
  Estimated sets: ~2592

Generate this data? (y/n): y

🏋️  Starting training data generation...

📅 Generating week 1/16...
  ✅ Monday - Leg Day (Load: 145, RPE: 8.7)
  ✅ Tuesday - Easy Run - Zone 2 (Load: 55, RPE: 6.2)
  ✅ Wednesday - Push Day (Load: 132, RPE: 8.3)
  ⏭️  Skipped Thursday - Interval Run
  ✅ Friday - Pull Day (Load: 125, RPE: 8.5)
  ✅ Saturday - Long Run - Zone 2 (Load: 72, RPE: 6.8)
...

✅ Training data generation complete!

📊 Statistics:
  - Total sessions created: 88
  - Total unique exercises: 45
  - Total sets logged: 2640
  - Workouts skipped: 8
  - Date range: 06/22/2025 to 10/10/2025
```

## Training Week Details

### Monday - Leg Day (90-120 min)
- Warm-up: Rowing + Ski Erg (4 min each)
- Main lifts: Back Squat 5×5, Deadlift 4×6
- Accessories: Bulgarian Split Squat, Leg Extensions, Leg Curls, Strict Toes to Bar
- Finisher: Sled Push/Pull
- Training Load: 100-155
- RPE: 7.0-9.5

### Tuesday - Easy Run (35-45 min)
- Distance: 6.5-7.5 km
- Zone 2 (~75% HRM)
- Training Load: 35-65
- RPE: 5.0-6.5

### Wednesday - Push Day (90-120 min)
- Warm-up: Ski Erg + Rowing (4 min each)
- Main lifts: Bench Press 4×6, Incline DB Press 3×10
- Accessories: Push-ups, Overhead Press, various shoulder/tricep work
- Finisher: 2 sets of Ski Erg + Wall Balls
- Training Load: 90-145
- RPE: 7.0-9.0

### Thursday - Interval Run (50-65 min)
- 10 min warm-up
- 4× (4 min @ 90-95% HRM + 4 min recovery)
- 10 min cool-down
- Training Load: 80-120
- RPE: 7.5-9.5

### Friday - Pull Day (90-120 min)
- Warm-up: Ski Erg + Rowing (4 min each)
- Main lifts: Pull-ups 5×5, various Lat Pulldown variations
- Accessories: Seated Row, Dumbbell Curls, GHD work, core
- Finisher: 4 sets of Farmer Carry + Burpee Broad Jumps
- Training Load: 85-140
- RPE: 7.0-9.0

### Saturday - Long Run (50-65 min)
- Distance: 9.5-10.5 km
- Zone 2 (~75% HRM)
- Training Load: 50-85
- RPE: 5.5-7.0

### Sunday - Rest Day
- Complete rest or active recovery

## Data Generated

### Sessions
Each session includes:
- `started_at` - Workout start time (morning/evening based on type)
- `completed_at` - Calculated from duration
- `category` - strength, cardio, or hybrid
- `name` - e.g., "Leg Day", "Easy Run - Zone 2"
- `training_load` - Integer 35-155 (randomized within workout ranges)
- `perceived_exertion` - Float 1.0-10.0 (RPE scale)
- `duration_seconds` - Actual workout duration

### Sets
Each set includes:
- `exercise_id` - Linked to exercise
- `set_index` - Set number (1, 2, 3...)
- `reps` - Number of repetitions
- `value_1_type` - e.g., 'weight_kg', 'distance_m', 'duration_m'
- `value_1_numeric` - Actual value (randomized within ranges)
- `value_2_type` - Optional second metric (e.g., distance + duration)
- `value_2_numeric` - Optional second value
- `rpe` - Set-specific RPE (increases with fatigue)

## Advanced Configuration

### Variance Control
```typescript
includeVariance: true  // Random values within ranges
includeVariance: false // Use average values (more consistent)
```

### Skip Probability
```typescript
skipProbability: 0.05  // 5% chance per workout (very consistent)
skipProbability: 0.08  // 8% chance per workout (realistic)
skipProbability: 0.15  // 15% chance per workout (inconsistent)
```

### Progression Rate
```typescript
progressionRate: 0.01  // 1% per week (slow gains)
progressionRate: 0.02  // 2% per week (realistic)
progressionRate: 0.03  // 3% per week (aggressive)
```

The progression rate applies multiplicatively, so earlier weeks in history will have proportionally lower weights:
- Week 12 ago: weights × (1 - 12 × 0.02) = weights × 0.76 (76%)
- Week 6 ago: weights × (1 - 6 × 0.02) = weights × 0.88 (88%)
- Week 0 (current): weights × 1.0 = weights × 1.0 (100%)

## Environment Variables

The script uses the following environment variables (with defaults):

```bash
DB_HOST=localhost      # Database host
DB_PORT=5432          # Database port
DB_NAME=rythm         # Database name
DB_USER=rythm_api     # Database user
DB_PASSWORD=password  # Database password
```

## Troubleshooting

### User not found
```bash
❌ User not found with that email.
```
**Solution:** Verify the email address or create the user first in the database.

### Connection refused
```bash
❌ Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Ensure the database is running:
```bash
npm run dev
```

### Permission denied
```bash
❌ Error: permission denied for table sessions
```
**Solution:** Verify the database user has write permissions.

### Duplicate exercises
The script will reuse existing exercises if they already exist in the database. This is normal and expected behavior.

## Statistics

For a typical 12-week generation with default settings:
- **Sessions:** ~66 (assuming 8% skip rate)
- **Unique exercises:** ~40
- **Total sets:** ~1,980
- **Data range:** 3 months of history

## Database Impact

⚠️ **Warning:** This script inserts real data into your database. Use with caution in production environments.

**Recommendations:**
- Test on local/development databases first
- Back up your database before running on production
- Consider using a separate tenant for test data
- Use the verify-test-data script to check results

## Related Scripts

- `npm run populate-test-data` - Original test data generator
- `npm run verify-test-data` - Verify test data integrity
- `npm run db:migrate` - Run database migrations

## Support

For issues or questions, see:
- Database schema: `packages/db/migrations/000_consolidated_schema.sql`
- Training week template: `x-bugs/Training_week.md`
- Project README: `README.md`
