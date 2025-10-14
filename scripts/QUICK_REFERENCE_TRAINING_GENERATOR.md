# 🏋️ Training Data Generator - Quick Reference

## One-Line Run
```bash
npm run generate-training-data
```

## What It Does
✅ Generates realistic training data based on your 7-day training week  
✅ Creates sessions, exercises, and sets with proper relationships  
✅ Randomizes loads (35-155), RPE (1-10), weights, reps, and durations  
✅ Simulates progressive overload (weights increase over time)  
✅ Includes missed workouts (configurable skip rate)  
✅ Applies set fatigue (later sets slightly harder)  

## Quick Inputs
| Prompt | Default | Recommendation |
|--------|---------|----------------|
| **Weeks to generate** | 12 | 12-24 for good history |
| **Include variance** | Yes | Yes for realistic data |
| **Skip probability** | 0.08 (8%) | 0.05-0.15 range |
| **Progression rate** | 0.02 (2%/week) | 0.01-0.03 range |

## Expected Output (12 weeks)
- **Sessions:** ~66 workouts
- **Exercises:** ~40 unique
- **Sets:** ~1,980 total
- **Time range:** 3 months back

## Training Week Template
| Day | Workout | Type | Load | Duration |
|-----|---------|------|------|----------|
| Mon | Leg Day | Strength | 100-155 | 90-120 min |
| Tue | Easy Run 7k | Cardio | 35-65 | 35-45 min |
| Wed | Push Day | Strength | 90-145 | 90-120 min |
| Thu | Interval Run | Cardio | 80-120 | 50-65 min |
| Fri | Pull Day | Strength | 85-140 | 90-120 min |
| Sat | Long Run 10k | Cardio | 50-85 | 50-65 min |
| Sun | Rest | - | - | - |

## Sample Exercises

### Leg Day
- Back Squat: 5×5 @ 100-140kg
- Deadlift: 4×6 @ 120-160kg
- Bulgarian Split Squat: 3×10 @ 20-35kg
- Sled Push: 4×20m @ 60-100kg

### Push Day
- Bench Press: 4×6 @ 80-110kg
- Incline DB Press: 3×10 @ 25-40kg
- Overhead Press: 3×10 @ 45-65kg

### Pull Day
- Pull-ups: 5×5 @ 0-20kg
- Lat Pulldown: 3×10 @ 50-75kg
- Seated Row: 3×10 @ 60-85kg

### Cardio
- Easy Run: 6.5-7.5km in 35-45 min
- Long Run: 9.5-10.5km in 50-65 min
- Intervals: 4×(800-1000m in 4-4.5 min)

## Files
- **Script:** `scripts/generate-training-data.ts`
- **Docs:** `scripts/TRAINING_DATA_GENERATOR.md`
- **Your template:** `x-bugs/Training_week.md`

## Safety
✅ Transaction-wrapped (rollback on error)  
✅ User verification before execution  
✅ Confirmation prompt with summary  
✅ Full statistics report on completion  

## Environment
Uses `.env` or defaults:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rythm
DB_USER=rythm_api
DB_PASSWORD=password
```

## Pro Tips
💡 Use 12 weeks for initial testing  
💡 Use 24+ weeks for comprehensive analytics  
💡 Set skip to 0.05 for consistent athlete data  
💡 Set skip to 0.15 for inconsistent patterns  
💡 Higher progression rate = faster strength gains  
💡 Run on dev database first, then production  

## Common Issues
| Issue | Solution |
|-------|----------|
| User not found | Check email spelling |
| Connection refused | Run `npm run dev` first |
| Permission denied | Check DB user permissions |
| Duplicate data | Script is idempotent, will create new data |

---
**Need help?** See `scripts/TRAINING_DATA_GENERATOR.md` for full documentation
