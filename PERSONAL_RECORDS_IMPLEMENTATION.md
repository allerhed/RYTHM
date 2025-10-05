# Personal Records (PR) Feature Implementation

## Overview
Comprehensive Personal Records tracking feature for RYTHM mobile web app, allowing users to manually track their personal bests across all exercises with full historical progression.

## Implementation Date
2025-01-10

## Feature Requirements (User Specifications)
✅ Page similar to /history with "Personal Records - PR's" title  
✅ Filtering: all PRs, strength, cardio  
✅ Pick from exercise library and add PRs (e.g., "BackSquat 1RM 150 kg")  
✅ Track history of each record over time  
✅ List view shows PR, date, category  
✅ Detail page for edit/add/delete PR and history  
✅ Add link in navigation after calendar  

### Clarified Requirements
- Metrics tracked separately (1RM ≠ 3RM)
- No automated PR detection (manual entry only)
- Keep all historical records (no deletion of old records when new PR added)
- No validation (PRs can go up or down)
- Standalone records (not tied to workout sessions)

## Database Schema

### Migration: 010_personal_records.sql
Location: `/packages/db/migrations/010_personal_records.sql`

#### Tables Created

**personal_records**
- `pr_id` (UUID, PK): Unique identifier
- `user_id` (UUID, FK): Owner of the PR
- `tenant_id` (UUID, FK): Tenant isolation
- `exercise_template_id` (UUID, FK): Exercise reference
- `metric_name` (VARCHAR(100)): e.g., "1RM", "3RM", "5k time"
- `category` (VARCHAR(20)): 'strength' or 'cardio'
- `current_value_numeric` (NUMERIC): Current PR value
- `current_value_unit` (VARCHAR(20)): Unit (kg, lb, min, etc.)
- `current_date` (DATE): Date of current PR
- `notes` (TEXT): Optional notes about the PR
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

**pr_history**
- `history_id` (UUID, PK): Unique identifier
- `pr_id` (UUID, FK): Reference to personal_records
- `value_numeric` (NUMERIC): Historical value
- `value_unit` (VARCHAR(20)): Unit
- `achieved_date` (DATE): When this record was achieved
- `notes` (TEXT): Optional notes
- `session_id` (UUID, FK, nullable): Optional link to workout session
- `created_at` (TIMESTAMPTZ): Timestamp

#### Security
- **Row Level Security (RLS)** enabled on both tables
- Policies enforce tenant isolation and user ownership
- Users can only see/modify their own PRs

#### Indexes
- `idx_pr_user` on `personal_records(user_id, tenant_id)`
- `idx_pr_exercise` on `personal_records(exercise_template_id)`
- `idx_pr_category` on `personal_records(category)`
- `idx_pr_history_pr` on `pr_history(pr_id)`
- `idx_pr_history_date` on `pr_history(achieved_date)`

## API Implementation

### Router: personalRecords.ts
Location: `/apps/api/src/routes/personalRecords.ts`

#### Endpoints

1. **list** - Get all PRs with filtering
   - Input: `{ category?: 'strength'|'cardio', offset: number, limit: number }`
   - Returns: Array of PRs with exercise name, current value, record count
   - Features: Pagination, category filtering

2. **getById** - Get PR details with full history
   - Input: `{ prId: string }`
   - Returns: PR details + ordered history array
   - Features: RLS verified, includes all historical records

3. **create** - Create new PR with initial record
   - Input: Exercise, metric name, category, value, unit, date, notes
   - Returns: `{ prId: string }`
   - Features: Transaction-safe, creates both PR and first history entry

4. **addRecord** - Add new record to existing PR
   - Input: PR ID, value, unit, date, notes
   - Returns: `{ success: boolean }`
   - Features: Updates current PR if new record is most recent

5. **update** - Update PR metadata
   - Input: PR ID, metric name, notes
   - Returns: `{ success: boolean }`
   - Features: Only updates metadata, not values/dates

6. **deleteRecord** - Delete specific historical record
   - Input: `{ historyId: string }`
   - Returns: `{ success: boolean }`
   - Features: Prevents deleting last record, updates current if needed

7. **delete** - Delete entire PR and all history
   - Input: `{ prId: string }`
   - Returns: `{ success: boolean }`
   - Features: Cascade delete via FK constraints

### Router Registration
Added to `/apps/api/src/router.ts`:
```typescript
import { personalRecordsRouter } from './routes/personalRecords';
// ...
personalRecords: personalRecordsRouter,
```

## Mobile UI Implementation

### Pages Created

#### 1. PR List Page
**Path**: `/apps/mobile/src/app/prs/page.tsx`

**Features**:
- Filter buttons: All, Strength, Cardio
- "Add Personal Record" button
- PR cards showing:
  - Exercise name and metric
  - Current value with large font
  - Date achieved
  - Category badge (color-coded)
  - Record count if > 1
  - Optional notes preview
- Pull to refresh
- Pagination controls
- Empty state with CTA
- Loading and error states

**UI Pattern**: Matches /history page design with category filtering

#### 2. Add New PR Page
**Path**: `/apps/mobile/src/app/prs/new/page.tsx`

**Features**:
- Exercise picker with search
  - Searchable dropdown
  - Shows category for each exercise
  - Auto-sets category based on exercise
- Metric name input
  - Free text field
  - Examples provided
- Category selection (strength/cardio)
- Value input
  - Numeric input
  - Unit input (separate field)
- Date picker
  - Defaults to today
  - Cannot select future dates
- Notes textarea (optional)
- Validation before submission

#### 3. PR Detail Page
**Path**: `/apps/mobile/src/app/prs/[id]/page.tsx`

**Features**:
- Current PR card (prominent display)
  - Large value display
  - Category badge
  - Date achieved
  - Notes if present
- Action buttons:
  - "Add Record" (primary)
  - "Edit PR" (secondary)
- Historical records timeline
  - Ordered by date (newest first)
  - Shows value, unit, date
  - "Current" badge on latest
  - Progression arrows (↑/↓) showing change from previous
  - Delete button for each record (except if only one)
  - Notes if present
- Delete PR button (destructive, bottom)
- Loading and error states

#### 4. Add Record Page
**Path**: `/apps/mobile/src/app/prs/[id]/add-record/page.tsx`

**Features**:
- Context header showing exercise and metric
- Value input (numeric + unit)
  - Pre-fills unit from current PR
- Date picker
- Notes textarea (optional)
- Submit button

#### 5. Edit PR Page
**Path**: `/apps/mobile/src/app/prs/[id]/edit/page.tsx`

**Features**:
- Context header showing exercise
- Metric name input (pre-filled)
- Notes textarea (pre-filled)
- Info message explaining values/dates are updated via "Add Record"
- Save button

### Navigation Integration

**Updated**: `/apps/mobile/src/components/HamburgerMenu.tsx`

Added navigation item after Calendar:
```typescript
{
  name: "Personal Records - PR's",
  href: '/prs',
  icon: TrophyIcon,
  description: 'Track your personal records'
}
```

Icon: Trophy (🏆) from Heroicons

## Design Patterns

### Data Flow
1. User navigates to /prs
2. tRPC query fetches PRs with category filter
3. UI renders list with pagination
4. User clicks PR → navigates to detail page
5. Detail page fetches full PR with history
6. User can add records, edit metadata, or delete

### State Management
- tRPC for all API calls
- React hooks (useState) for local UI state
- Optimistic updates disabled (refetch on mutation success)
- Loading states for all async operations

### Error Handling
- API returns TRPCError with meaningful messages
- UI displays error messages in red alert boxes
- Validation at form submission level
- Database-level constraints as fallback

### Security
- All queries set RLS context (user_id, tenant_id)
- Row-level policies enforce data isolation
- No direct SQL injection risk (parameterized queries)
- FK constraints prevent orphaned records

## Testing Checklist

### Database
- [ ] Run migration 010
- [ ] Verify tables created
- [ ] Test RLS policies (cross-tenant query should fail)
- [ ] Test FK constraints
- [ ] Verify indexes created

### API
- [ ] Test create PR endpoint
- [ ] Test list with each filter (all, strength, cardio)
- [ ] Test pagination
- [ ] Test getById
- [ ] Test addRecord (with older and newer dates)
- [ ] Test update metadata
- [ ] Test deleteRecord (verify current updates)
- [ ] Test delete PR
- [ ] Test RLS (different user shouldn't see PRs)

### Mobile UI
- [ ] Navigate to /prs from hamburger menu
- [ ] Test each filter button
- [ ] Add new PR (strength exercise)
- [ ] Add new PR (cardio exercise)
- [ ] View PR detail page
- [ ] Add second record to existing PR
- [ ] Verify "Current" badge moves
- [ ] Verify progression arrows show correctly
- [ ] Edit PR metadata
- [ ] Delete a historical record
- [ ] Verify current updates if latest deleted
- [ ] Delete entire PR
- [ ] Test pagination (create 25+ PRs)
- [ ] Test pull to refresh
- [ ] Test empty state
- [ ] Test error states (disconnect network)
- [ ] Test loading states

## Deployment Steps

### 1. Database Migration
```bash
# From project root
docker exec -it rythm-db-1 psql -U rythm_api -d rythm -f /packages/db/migrations/010_personal_records.sql
```

Or use migration tool:
```bash
./scripts/run-migrations.sh
```

### 2. Build and Deploy API
```bash
# Local development
docker-compose up -d --build api

# Production (Azure Container Apps)
# Will auto-deploy via GitHub Actions on merge to main
```

### 3. Build and Deploy Mobile
```bash
# Local development
docker-compose up -d --build mobile

# Production (Azure Container Apps)
# Will auto-deploy via GitHub Actions on merge to main
```

### 4. Verify Deployment
1. Check API health: `GET /health`
2. Test tRPC endpoint: `POST /trpc/personalRecords.list`
3. Access mobile app: https://mobile.rythm.app/prs
4. Create test PR
5. Verify navigation link appears

## Files Created/Modified

### Created
- `/packages/db/migrations/010_personal_records.sql` (Database schema)
- `/apps/api/src/routes/personalRecords.ts` (API endpoints)
- `/apps/mobile/src/app/prs/page.tsx` (List page)
- `/apps/mobile/src/app/prs/new/page.tsx` (Add PR page)
- `/apps/mobile/src/app/prs/[id]/page.tsx` (Detail page)
- `/apps/mobile/src/app/prs/[id]/add-record/page.tsx` (Add record page)
- `/apps/mobile/src/app/prs/[id]/edit/page.tsx` (Edit PR page)

### Modified
- `/apps/api/src/router.ts` (Added personalRecords router)
- `/apps/mobile/src/components/HamburgerMenu.tsx` (Added PR nav item)

## Known Limitations

1. **No automated PR detection**: PRs must be entered manually (by design)
2. **No comparison with sessions**: PRs are standalone, not automatically synced with workout sessions
3. **No 1RM calculation**: System stores what user enters, no Epley/Brzycki formulas applied
4. **No leaderboards**: PRs are private to each user
5. **No PR notifications**: System doesn't alert when you beat a PR (could be future enhancement)

## Future Enhancements (Out of Scope)

- **PR suggestions**: Based on recent workout data
- **PR badges/achievements**: Gamification
- **PR sharing**: Social features
- **PR graphs**: Visual progression over time
- **Export PRs**: CSV download
- **Import PRs**: Bulk import from other apps
- **PR reminders**: "It's been 30 days since you tested your 1RM"
- **PR validation**: Warn if value seems unrealistic
- **Session linking**: Automatically suggest creating PR from workout session

## Support

### Common Issues

**Q: PR not showing after creation**
- Check tRPC query invalidation
- Verify RLS context is set correctly
- Check browser console for errors

**Q: Can't delete last historical record**
- This is by design - delete the entire PR instead
- Ensures PRs always have at least one record

**Q: Current PR not updating after adding record**
- Check date comparison logic in addRecord mutation
- Current only updates if new date >= current date

**Q: Exercise not appearing in picker**
- Verify exercise_templates table has data
- Check search filter logic
- Verify API returns exercises

## References

- User requirements: Conversation starting 2025-01-10
- Database schema: `/packages/db/migrations/010_personal_records.sql`
- API documentation: tRPC schema introspection at `/trpc`
- UI patterns: Based on `/apps/mobile/src/app/history/page.tsx`

## Sign-off

Implementation completed: 2025-01-10  
Status: ✅ Ready for testing  
Next step: Run database migration and test all endpoints  

---

**Note**: Docker must be running to test locally. Use `./scripts/start.sh` to start all services.
