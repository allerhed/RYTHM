# Mobile Analytics Distance Card Enhancement

## Purpose
Add an enhanced "Running Distance" card to the mobile analytics page providing:
- Total distance over the last 3 months (derived from `getAnalyticsSummary` currentPeriod.totalDistance).
- Percentage change vs previous 3 months.
- Derived averages: per workout, per day, per week.
- Previous period total distance and workout count footer.

## Acceptance Criteria
- Display total distance with one decimal precision and unit `km`.
- Show percentage change vs previous period using existing `formatChange` helper logic.
- Compute averages safely (avoid division by zero):
  - Avg / Workout = totalDistance / max(workoutCount, 1)
  - Avg / Day = totalDistance / 90 (fixed 3-month window)
  - Avg / Week = totalDistance / 12 (approx weeks in 3 months)
- Styling matches existing dark elevated cards (uses `bg-dark-elevated1`, `bg-dark-elevated`).
- Card positioned where previous Total Distance widget existed.
- No backend schema changes required (reuses existing `getAnalyticsSummary`).

## Code Changes
File: `apps/mobile/src/app/analytics/page.tsx`
- Replaced "Total Distance" widget block with enhanced "Running Distance" card.
- Added derived metrics grid and footer.

## Follow Ups
- Consider adding a small sparkline or weekly distance trend when weekly data becomes available.
- Potential localization for units (km → miles) if user preference system is introduced.

## Commit Message (planned)
```
feat(mobile): add enhanced running distance totals card with derived averages
```

## Azure Considerations
- Pure UI change; no impact on container build or health endpoints.
- No new environment variables.

## Testing
Manual verification steps:
1. Load mobile analytics page as authenticated user with existing sessions containing distance sets.
2. Confirm total distance matches prior widget value.
3. Confirm averages recompute when workoutCount changes (add/remove session).
4. Confirm graceful display when workoutCount = 0 (Avg / Workout shows 0.00).

Edge cases:
- No previous period data → percentage change should show +0.0% (existing helper logic).
- Zero distances → all derived metrics show 0.00.

---
Document generated October 30, 2025.
