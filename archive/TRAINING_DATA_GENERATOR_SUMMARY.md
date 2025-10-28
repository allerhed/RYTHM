# Training Data Generator - Implementation Summary

**Created:** October 10, 2025  
**Purpose:** Generate realistic training data based on Lars' weekly training routine

---

## 📁 Files Created

### 1. Main Script
**File:** `scripts/generate-training-data.ts`
- Full TypeScript implementation
- Interactive CLI with user prompts
- Comprehensive data generation logic
- Error handling and transaction safety
- Progress reporting and statistics

### 2. Documentation
**File:** `scripts/TRAINING_DATA_GENERATOR.md`
- Complete usage guide
- Feature documentation
- Configuration options
- Troubleshooting section
- Examples and statistics

### 3. Package Configuration
**File:** `package.json` (updated)
- Added `generate-training-data` script
- Added required dependencies:
  - `@types/pg` for TypeScript types
  - `ts-node` for direct TypeScript execution

---

## 🎯 Key Features

### Training Week Template
Based on your `x-bugs/Training_week.md`:
- **Monday:** Leg Day - Back Squat, Deadlift, Bulgarian Split Squat, etc.
- **Tuesday:** Easy Run 7k Zone 2
- **Wednesday:** Push Day - Bench Press, Overhead Press, etc.
- **Thursday:** Interval Run with 4×4min @ 90-95% HRM
- **Friday:** Pull Day - Pull-ups, Lat Pulldown, Seated Row, etc.
- **Saturday:** Long Run 10k Zone 2
- **Sunday:** Rest Day

### Intelligent Randomization
1. **Training Load:** 35-155 range (varies by workout type)
2. **RPE Values:** 1.0-10.0 (realistic exertion levels)
3. **Weights:** Range-based with progression over time
4. **Reps:** Can be fixed or ranges (e.g., "8-10")
5. **Duration:** Workout-specific ranges
6. **Skip Probability:** Simulates missed workouts (configurable)

### Progressive Overload
- Earlier weeks have lower weights
- Progression rate configurable (default 2% per week)
- Applies to all weight-based exercises
- Simulates realistic strength gains over time

### Set Fatigue Simulation
- Later sets in a sequence are slightly harder (higher RPE)
- Maximum +0.5 RPE increase by final set
- Simulates accumulated fatigue within workout

---

## 🚀 Usage

### Quick Start
```bash
npm run generate-training-data
```

### User Prompts
1. **User email** - Who to generate data for
2. **Weeks count** - How many weeks back (default: 12)
3. **Include variance** - Random or average values (default: yes)
4. **Skip probability** - Chance of missing workouts (default: 8%)
5. **Progression rate** - Weekly strength increase (default: 2%)

### Example Output
```
📊 Statistics:
  - Total sessions created: 88
  - Total unique exercises: 45
  - Total sets logged: 2640
  - Workouts skipped: 8
  - Date range: 06/22/2025 to 10/10/2025
```

---

## 📊 Data Structure

### Sessions Table
Each workout session includes:
- `started_at` - Timestamp (morning for strength, evening for cardio)
- `completed_at` - Calculated from duration
- `category` - strength, cardio, or hybrid
- `name` - Workout name (e.g., "Leg Day")
- `training_load` - Integer 35-155
- `perceived_exertion` - Float 1.0-10.0 (RPE)
- `duration_seconds` - Total workout time

### Sets Table
Each set includes:
- `exercise_id` - Reference to exercise
- `set_index` - Set number
- `reps` - Repetitions performed
- `value_1_type` / `value_1_numeric` - Primary metric (weight, distance, duration, calories)
- `value_2_type` / `value_2_numeric` - Optional secondary metric
- `rpe` - Set-specific RPE (with fatigue adjustment)

---

## 🎨 Exercise Examples

### Strength Exercises
```typescript
Back Squat:
  - 5 sets × 5 reps
  - Weight: 100-140 kg (with progression)
  - RPE: 7.5-9.5

Bench Press:
  - 4 sets × 6 reps
  - Weight: 80-110 kg (with progression)
  - RPE: 7.5-9.0
```

### Cardio Exercises
```typescript
Running (Easy):
  - 1 set × 1 rep (continuous)
  - Distance: 6500-7500 m
  - Duration: 35-45 minutes
  - RPE: 5.0-6.5

Running (Intervals):
  - 4 sets × 1 rep
  - Distance: 800-1000 m per interval
  - Duration: 4-4.5 minutes per interval
  - RPE: 8.5-9.5
```

### Hybrid Exercises
```typescript
Wall Ball:
  - 2 sets × 20 reps
  - Weight: 9-14 kg
  - RPE: 7.0-9.0

Sled Push:
  - 4 sets × 20 reps
  - Weight: 60-100 kg
  - Distance: 20 m
  - RPE: 8.0-9.5
```

---

## ⚙️ Configuration Options

### Include Variance
- **Yes:** Random values within ranges (realistic variation)
- **No:** Average values (consistent performance)

### Skip Probability
- **0.05 (5%):** Very consistent athlete
- **0.08 (8%):** Realistic (default)
- **0.15 (15%):** Less consistent

### Progression Rate
- **0.01 (1%):** Slow/conservative gains
- **0.02 (2%):** Realistic (default)
- **0.03 (3%):** Aggressive/novice gains

---

## 📈 Expected Results

### 12 Weeks Generation
- **Sessions:** ~66 (with 8% skip rate)
- **Exercises:** ~40 unique
- **Sets:** ~1,980 total
- **Date Range:** ~3 months back from today

### 24 Weeks Generation
- **Sessions:** ~132 (with 8% skip rate)
- **Exercises:** ~40 unique
- **Sets:** ~3,960 total
- **Date Range:** ~6 months back from today

---

## 🔒 Safety Features

### Transaction Safety
- All database operations wrapped in transaction
- Automatic rollback on error
- Data integrity guaranteed

### User Verification
- Confirms user exists before generation
- Validates user/tenant relationship
- Prevents orphaned data

### Confirmation Step
- Shows full configuration before execution
- Requires explicit confirmation (y/n)
- Displays estimated impact

---

## 🛠️ Additional Suggestions Implemented

### 1. User Input Variables ✅
- User selection by email
- Number of weeks
- Variance toggle
- Skip probability
- Progression rate

### 2. Variance in Training ✅
- Random training loads (35-155 range)
- Random RPE values (1.0-10.0)
- Random weights within ranges
- Random rep counts (for ranges like "8-10")
- Random durations within ranges

### 3. Progressive Overload ✅
- Weights increase over time
- Configurable progression rate
- Multiplicative application (earlier = lighter)

### 4. Realistic Patterns ✅
- Workout-specific load ranges
- Time-of-day variation
- Set fatigue simulation
- Skip probability per workout type
- Category-appropriate metrics

---

## 🎯 What Makes This Realistic

1. **Varied Training Loads:** Different workouts have different intensities
2. **Progressive Overload:** Weights increase over time
3. **Fatigue Modeling:** Later sets are harder
4. **Missed Workouts:** Some sessions skipped (configurable)
5. **Time Patterns:** Strength in morning, cardio in evening
6. **RPE Variation:** Not every set is the same intensity
7. **Multiple Metrics:** Some exercises track weight+reps, others distance+time
8. **Weekly Structure:** Follows actual training program
9. **Rest Days:** Sunday always rest
10. **Workout Duration:** Realistic time ranges

---

## 🚀 Next Steps

### To Use the Script
```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the database
npm run dev

# 3. Run the generator
npm run generate-training-data
```

### To Customize Further
Edit `scripts/generate-training-data.ts`:
- Modify `TRAINING_WEEK` array for different routines
- Adjust weight ranges in `ExerciseSet` definitions
- Change default skip probabilities per workout
- Add more exercises or variations
- Modify duration ranges

---

## 📝 Notes

- All data is inserted into the actual database (not mock)
- Exercise names must match or will be created
- Supports all value types: weight_kg, distance_m, duration_m, calories
- Compatible with existing RLS policies (tenant-scoped)
- Works with both exercises and exercise_templates tables

---

**Status:** ✅ Complete and ready to use!
