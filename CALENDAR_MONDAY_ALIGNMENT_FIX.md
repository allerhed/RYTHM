# Calendar Monday Alignment Fix

## Issue
In the mobile app calendar view, there was a mismatch between the weekday headers and the actual calendar grid:
- **Headers**: Showed `M T W T F S S` (Monday through Sunday)
- **Grid**: Started on Sunday instead of Monday

This caused confusion as the days were offset by one position.

## Root Cause
The calendar calculation in `/apps/mobile/src/app/calendar/page.tsx` was using JavaScript's native `getDay()` method which returns:
- `0` for Sunday
- `1` for Monday
- `2` for Tuesday
- etc.

The code was directly using `firstDayOfMonth.getDay()` to calculate how many days to go back to start the calendar, which naturally aligned to Sunday.

However, the weekday headers were hardcoded to start with Monday, creating the misalignment.

## Solution
Modified the calendar calculation to use a Monday-first system by converting the native Sunday-first `getDay()` values:

```typescript
// Convert Sunday-first (0-6) to Monday-first (0-6)
const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7
```

This formula works as:
- Sunday (0) → (0 + 6) % 7 = 6 (last day of week)
- Monday (1) → (1 + 6) % 7 = 0 (first day of week)
- Tuesday (2) → (2 + 6) % 7 = 1
- etc.

## Files Changed

### `/apps/mobile/src/app/calendar/page.tsx`

**Before:**
```typescript
// Get the start of the calendar (might include days from previous month)
const startOfCalendar = new Date(firstDayOfMonth)
startOfCalendar.setDate(startOfCalendar.getDate() - firstDayOfMonth.getDay())

// Get the end of the calendar (might include days from next month)
const endOfCalendar = new Date(lastDayOfMonth)
const daysToAdd = 6 - lastDayOfMonth.getDay()
endOfCalendar.setDate(endOfCalendar.getDate() + daysToAdd)
```

**After:**
```typescript
// Get the start of the calendar (might include days from previous month)
// Adjust for Monday start: getDay() returns 0=Sunday, 1=Monday, etc.
// We want: Monday=0, Tuesday=1, ..., Sunday=6
const startOfCalendar = new Date(firstDayOfMonth)
const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7 // Convert to Monday=0 system
startOfCalendar.setDate(startOfCalendar.getDate() - firstDayWeekday)

// Get the end of the calendar (might include days from next month)
const endOfCalendar = new Date(lastDayOfMonth)
const lastDayWeekday = (lastDayOfMonth.getDay() + 6) % 7 // Convert to Monday=0 system
const daysToAdd = 6 - lastDayWeekday
endOfCalendar.setDate(endOfCalendar.getDate() + daysToAdd)
```

## Testing
After deployment completes (~10-15 minutes):

1. Open the mobile app and navigate to the Calendar page
2. Verify the calendar grid now starts on Monday (matching the headers)
3. Check that:
   - The first column shows Mondays under the 'M' header
   - The second column shows Tuesdays under the 'T' header
   - The last column shows Sundays under the 'S' header
4. Navigate between months to ensure consistency

## Impact
- ✅ Calendar grid now correctly aligns with weekday headers
- ✅ Monday is the first day of the week throughout the calendar
- ✅ Consistent with European/ISO 8601 week standard
- ✅ Matches the rest of the app's Monday-first week logic (dashboard, training score, etc.)
- ✅ No breaking changes - purely visual/UX improvement

## Related
This fix aligns with the Monday-first week logic already used in:
- Dashboard week navigation (`apps/mobile/src/app/dashboard/page.tsx`)
- Training history calendar (`apps/mobile/src/app/training/history/page.tsx` - already had Monday-first logic)
- Analytics week calculations (`apps/api/src/routes/analytics.ts`)

## Deployment
- **Commit**: `8c196a7`
- **Status**: Deploying...
- **Expected completion**: ~10-15 minutes from commit time
