# Pull-to-Refresh Implementation Guide

## ✅ Completed Pages

### 1. Dashboard (`/dashboard/page.tsx`)
- ✅ Import added
- ✅ `handleRefresh` function created (refetches profile + recent activity)
- ✅ Content wrapped with `<PullToRefresh>`

### 2. History (`/history/page.tsx`)
- ✅ Import added
- ✅ `handleRefresh` function created (refetches session list)
- ✅ Content wrapped with `<PullToRefresh>`

## ⏳ Remaining Pages - Manual Wrapping Needed

The following pages have the imports and `handleRefresh` functions already added, but need the JSX content wrapped with `<PullToRefresh onRefresh={handleRefresh}>`:

### 3. Analytics (`/analytics/page.tsx`)
- ✅ Import added
- ✅ `handleRefresh` function created (refetches all 3 stat queries)
- ⏳ **TODO**: Wrap content with `<PullToRefresh>`

**Wrapping Pattern**:
```tsx
// Keep header outside
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="bg-white dark:bg-gray-800 shadow-sm">
    {/* Header content stays here */}
  </div>
  
  <PullToRefresh onRefresh={handleRefresh}>
    {/* All scrollable content goes here */}
    <div className="container mx-auto px-4 py-6">
      {/* ... rest of page content ... */}
    </div>
  </PullToRefresh>
</div>
```

### 4. Profile (`/profile/page.tsx`)
- ✅ Import added  
- ✅ `handleRefresh` function created (refetches profile)
- ⏳ **TODO**: Wrap content with `<PullToRefresh>`

### 5. Templates (`/templates/page.tsx`)
- ✅ Import added
- ✅ `handleRefresh` function created (refetches template list)
- ⏳ **TODO**: Wrap content with `<PullToRefresh>`

### 6. Calendar (`/calendar/page.tsx`)
- ✅ Import added
- ✅ `handleRefresh` function created (refetches workouts)
- ⏳ **TODO**: Wrap content with `<PullToRefresh>`

## Implementation Checklist

To complete pull-to-refresh implementation:

- [x] Create `PullToRefresh.tsx` component
- [x] Add component imports to all pages
- [x] Create `handleRefresh` functions on all pages
- [x] Wrap Dashboard page content
- [x] Wrap History page content
- [ ] Wrap Analytics page content
- [ ] Wrap Profile page content
- [ ] Wrap Templates page content
- [ ] Wrap Calendar page content

## Testing Instructions

Once all pages are wrapped:

1. **Local Testing**:
   ```bash
   ./scripts/start.sh
   # Open http://localhost:3000 in mobile browser or Chrome DevTools mobile mode
   ```

2. **Test Each Page**:
   - Navigate to page
   - Pull down from the top
   - Verify spinner appears
   - Verify data refreshes
   - Confirm pull doesn't trigger when scrolled down

3. **Production Deployment**:
   ```bash
   git add .
   git commit -m "feat: implement pull-to-refresh on all mobile app pages"
   git push origin main
   
   # Then manually trigger GitHub Actions deployment
   ```

## Technical Details

### Component Props
```typescript
interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number // default: 80px
  spinnerColor?: string // default: '#3B82F6'
  disabled?: boolean // default: false
}
```

### Refresh Handlers by Page

**Dashboard**:
```typescript
const handleRefresh = async () => {
  await Promise.all([
    fetchProfile(),
    refetchActivity()
  ])
}
```

**History**:
```typescript
const handleRefresh = async () => {
  await refetch()
}
```

**Analytics**:
```typescript
const handleRefresh = async () => {
  await Promise.all([
    trainingLoadQuery.refetch(),
    summaryQuery.refetch(),
    categoryBreakdownQuery.refetch()
  ])
}
```

**Profile**:
```typescript
const handleRefresh = async () => {
  await fetchProfile()
}
```

**Templates**:
```typescript
const handleRefresh = async () => {
  await refetch()
}
```

**Calendar**:
```typescript
const handleRefresh = async () => {
  await fetchWorkouts()
}
```

## Common Patterns

### With tRPC
```typescript
const { data, refetch } = trpc.someQuery.useQuery()
const handleRefresh = async () => {
  await refetch()
}
```

### With Multiple Queries
```typescript
const handleRefresh = async () => {
  await Promise.all([
    query1.refetch(),
    query2.refetch()
  ])
}
```

### With Custom Fetch
```typescript
const fetchData = async () => {
  // your fetch logic
}

const handleRefresh = async () => {
  await fetchData()
}
```

## Notes

- Headers, navigation, and modals should stay OUTSIDE the `<PullToRefresh>` wrapper
- Only wrap the scrollable content area
- Parent container should have proper height (e.g., `min-h-screen`, `h-full`)
- Pull-to-refresh only triggers when scrolled to the top of the content
- Works on touch devices and Chrome DevTools mobile emulation
