# Hyrox Tracker Implementation

## Overview
Complete implementation of a dedicated Hyrox race tracker, completely separate from the regular PR tracking system.

## Hyrox Exercises (9 Total)
1. **1km Run** (x8 multiplier for total time)
2. 1km Ski
3. 50m Sled Push
4. 50m Sled Pull
5. 80m Burpee Broad Jump
6. 1km Row
7. 200m Farmers Carry
8. 100m Sandbag Lunges
9. 100 Wall Balls

## Database Structure

### Tables Created
- **hyrox_records** - Main table for current best times per exercise per user
  - `hyrox_record_id` (UUID, primary key)
  - `user_id` (UUID, foreign key)
  - `tenant_id` (UUID, foreign key)
  - `exercise_type` (hyrox_exercise_type ENUM)
  - `current_time_seconds` (INTEGER)
  - `current_achieved_date` (DATE)
  - `notes` (TEXT, optional)
  - **UNIQUE constraint** on (user_id, exercise_type)

- **hyrox_history** - Historical tracking of all attempts
  - `history_id` (UUID, primary key)
  - `hyrox_record_id` (UUID, foreign key)
  - `time_seconds` (INTEGER)
  - `achieved_date` (DATE)
  - `notes` (TEXT, optional)
  - `heart_rate` (INTEGER, optional)

### Enum Type
```sql
CREATE TYPE hyrox_exercise_type AS ENUM (
  '1KM_RUN',
  '1KM_SKI',
  '50M_SLED_PUSH',
  '50M_SLED_PULL',
  '80M_BURPEE_BROAD_JUMP',
  '1KM_ROW',
  '200M_FARMERS_CARRY',
  '100M_SANDBAG_LUNGES',
  '100_WALL_BALLS'
);
```

### RLS Policies
- **Tenant isolation** - Users can only access records in their tenant
- **User isolation** - Users can only manage their own records
- **History isolation** - Users can only access history for their records

### Indexes
```sql
CREATE INDEX idx_hyrox_records_user ON hyrox_records(user_id);
CREATE INDEX idx_hyrox_records_tenant ON hyrox_records(tenant_id);
CREATE INDEX idx_hyrox_records_exercise ON hyrox_records(exercise_type);
CREATE INDEX idx_hyrox_history_record ON hyrox_history(hyrox_record_id);
CREATE INDEX idx_hyrox_history_date ON hyrox_history(achieved_date DESC);
CREATE INDEX idx_hyrox_history_time ON hyrox_history(time_seconds);
```

## API Endpoints (tRPC)

### `trpc.hyrox.list`
Returns all 9 Hyrox exercises with current best times for authenticated user.

**Response:**
```typescript
{
  hyroxRecordId: string
  exerciseType: string // '1KM_RUN', etc.
  exerciseName: string // '1km Run' (display name)
  distance: string // '1km', '50m', '100 reps'
  currentTimeSeconds: number
  currentAchievedDate: Date
  notes?: string
  historyCount: number
  multiplier: number // 8 for run, 1 for others
}[]
```

### `trpc.hyrox.getByExercise`
Get detailed record with full history for a specific exercise.

**Input:**
```typescript
{
  exerciseType: '1KM_RUN' | '1KM_SKI' | ... // enum value
}
```

**Response:**
```typescript
{
  hyroxRecordId: string
  exerciseType: string
  exerciseName: string
  distance: string
  currentTimeSeconds: number
  currentAchievedDate: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
  multiplier: number
  history: [{
    historyId: string
    timeSeconds: number
    achievedDate: Date
    notes?: string
    heartRate?: number
    createdAt: Date
  }]
}
```

### `trpc.hyrox.upsertRecord`
Create or update a Hyrox record. Creates new record if doesn't exist, updates if new time is better (lower).

**Input:**
```typescript
{
  exerciseType: string
  timeSeconds: number // Must be positive integer
  achievedDate: Date
  notes?: string
  heartRate?: number // Optional, 1-300 bpm
}
```

**Response:**
```typescript
{
  hyroxRecordId: string
  exerciseType: string
  exerciseName: string
}
```

### `trpc.hyrox.deleteHistory`
Delete a specific historical record.

**Input:**
```typescript
{
  historyId: string // UUID
}
```

**Response:**
```typescript
{
  success: boolean
}
```

### `trpc.hyrox.getStats`
Get overall statistics including total FOR TIME.

**Response:**
```typescript
{
  totalTimeSeconds: number // Includes 8x multiplier for run
  exerciseCount: number // How many exercises have records
  exercises: [{
    exerciseType: string
    exerciseName: string
    timeSeconds: number
    multiplier: number
    contributionTime: number // timeSeconds * multiplier
  }]
}
```

## Frontend Implementation

### Page: `/app/hyrox/page.tsx`
Main Hyrox tracker page with:

#### Top 10 Best Efforts Section
- Displays up to 3 best efforts in a grid
- Shows exercise name and time in mm:ss format
- Trophy icon for each effort

#### Summary Section
- Shows total FOR TIME calculation
- Includes 8x multiplier for 1km run
- Format: H:MM:SS

#### Exercise List
- All 9 exercises displayed in fixed order
- Shows current best time or "--:--" if no record
- Click exercise to view details (coming soon)
- Filter pills: "All exercises" + individual exercises

### Navigation
- Added "Hyrox Tracker" to hamburger menu
- Icon: Lightning bolt (BoltIcon)
- Positioned after "Personal Records - PR's"

### Utilities
```typescript
// Convert seconds to mm:ss format
formatTime(seconds: number): string

// Parse time string to seconds (supports H:MM:SS, MM:SS, SS)
parseTimeToSeconds(timeStr: string): number
```

## Files Created/Modified

### New Files
1. `packages/db/migrations/011_hyrox_tracking.sql` (135 lines)
   - Complete database schema for Hyrox tracking

2. `apps/api/src/routes/hyrox.ts` (408 lines)
   - tRPC router with all CRUD operations
   - Helper functions for display names and distances
   - Proper RLS context setting for all queries

3. `apps/mobile/src/app/hyrox/page.tsx` (323 lines)
   - Complete frontend implementation
   - Top 10 best efforts display
   - Summary with FOR TIME total
   - Exercise list with filters

4. `docs/HYROX_TRACKER_IMPLEMENTATION.md` (this file)
   - Complete documentation

### Modified Files
1. `apps/api/src/router.ts`
   - Added `hyroxRouter` import and registration

2. `apps/mobile/src/components/HamburgerMenu.tsx`
   - Added "Hyrox Tracker" menu item with BoltIcon

## Usage Flow

### Adding a New Record
```typescript
// Example: Add 1km run time
await trpc.hyrox.upsertRecord.mutate({
  exerciseType: '1KM_RUN',
  timeSeconds: 245, // 4:05
  achievedDate: new Date(),
  heartRate: 165,
  notes: 'Great pace, felt strong'
})
```

### Viewing Records
```typescript
// List all records
const records = await trpc.hyrox.list.useQuery()

// Get specific exercise details
const runDetails = await trpc.hyrox.getByExercise.useQuery({
  exerciseType: '1KM_RUN'
})

// Get overall stats
const stats = await trpc.hyrox.getStats.useQuery()
```

### Calculating Total Time
The API automatically calculates total FOR TIME with the 8x multiplier:
- 1km Run: 4:05 × 8 = 32:40
- 1km Ski: 4:30 × 1 = 4:30
- 50m Sled Push: 1:20 × 1 = 1:20
- ... (other exercises)
- **Total: 1:12:45**

## Security

### Row Level Security (RLS)
All queries are protected by RLS policies:
- Users can only access their own tenant's data
- Users can only view/modify their own records
- History is automatically filtered by record ownership

### Authentication
- All endpoints use `protectedProcedure`
- JWT tokens required
- User ID and Tenant ID extracted from auth context
- RLS context set for every database query

## Data Validation

### Zod Schemas
- `hyroxExerciseTypeSchema` - Enum of 9 exercises
- `upsertRecordSchema` - Time must be positive integer
- `addHistorySchema` - Same as upsert
- `getByExerciseSchema` - Exercise type enum
- `deleteHistorySchema` - UUID validation
- Heart rate: 1-300 bpm range

### Database Constraints
- UNIQUE(user_id, exercise_type) - One record per exercise per user
- Foreign key constraints for data integrity
- NOT NULL constraints on required fields
- CHECK constraints on time values

## Testing Checklist

### Database
- [x] Migration applied successfully
- [x] Tables created: hyrox_records, hyrox_history
- [x] Enum created: hyrox_exercise_type
- [x] Indexes created (6 total)
- [x] RLS policies enabled and tested

### API
- [x] Router registered in appRouter
- [x] List endpoint returns empty array for new users
- [ ] UpsertRecord creates new record
- [ ] UpsertRecord updates existing record if time is better
- [ ] UpsertRecord adds to history
- [ ] GetByExercise returns null for non-existent
- [ ] GetByExercise includes full history
- [ ] GetStats calculates total correctly (8x for run)
- [ ] DeleteHistory works with RLS
- [ ] Cross-tenant access blocked

### Frontend
- [x] Page accessible at /hyrox
- [x] Menu item shows in hamburger menu
- [x] Page loads without errors
- [ ] Shows empty state when no records
- [ ] Top 10 best efforts display correctly
- [ ] Total FOR TIME calculation correct (8x run)
- [ ] Time format: mm:ss for all displays
- [ ] Click exercise to view details (pending detail page)
- [ ] Pull-to-refresh works
- [ ] Loading states display
- [ ] Error states display

## Next Steps

### Immediate (Priority 1)
1. Create Hyrox detail pages
   - `/app/hyrox/[exercise]/page.tsx` - View history for one exercise
   - `/app/hyrox/[exercise]/add-record/page.tsx` - Add new record

2. Test end-to-end flow
   - Add records for all 9 exercises
   - Verify time calculations
   - Verify top 10 display
   - Test deletion

### Short Term (Priority 2)
3. Add record entry UI
   - Time input with mm:ss format
   - Heart rate input
   - Notes field
   - Date picker

4. Improve exercise detail view
   - Show full history in table
   - Chart of progress over time
   - Delete individual history entries

### Long Term (Priority 3)
5. Advanced features
   - Compare with other users (leaderboard)
   - Export Hyrox data
   - Link to actual race sessions
   - Estimated total race time calculator
   - Heart rate zones integration

6. Analytics
   - Progress charts per exercise
   - Trends over time
   - Best/worst exercises identification
   - Training recommendations

## Notes

### Design Decisions
- **Separate tables**: Hyrox tracking completely isolated from regular PRs for cleaner data model
- **Enum type**: Exercise types are fixed (9 exercises) so enum is appropriate
- **Time in seconds**: Stored as INTEGER for easy math, formatted on display
- **8x multiplier**: 1km run is done 8 times in a Hyrox race, so total time includes this
- **One record per exercise**: UNIQUE constraint ensures clean data
- **History preservation**: All attempts saved in hyrox_history for progress tracking

### Performance Considerations
- Indexes on frequently queried columns (user_id, tenant_id, exercise_type)
- RLS uses indexed columns (user_id, tenant_id)
- History queries include date index for sorting
- Time index for leaderboard-style queries

### Future Enhancements
- Consider adding `race_id` to link records to actual race sessions
- Add `weather_conditions`, `equipment_notes`, `location` fields
- Implement CSV export for analysis in Excel
- Add photo upload for proof of time
- Integrate with Strava or other fitness platforms

## Migration Rollback

If needed, rollback with:
```sql
DROP TRIGGER IF EXISTS update_hyrox_records_updated_at ON hyrox_records;
DROP TABLE IF EXISTS hyrox_history CASCADE;
DROP TABLE IF EXISTS hyrox_records CASCADE;
DROP TYPE IF EXISTS hyrox_exercise_type;
```

## Support

For issues or questions:
1. Check error logs in API console
2. Verify RLS policies are active
3. Confirm migration was applied
4. Check user has valid tenant_id
5. Verify JWT token is valid

## Version
- **Version**: 1.0.0
- **Date**: 2024-01-XX
- **Author**: GitHub Copilot + Lars-Olof Allerhed
- **Status**: Complete - Ready for testing
