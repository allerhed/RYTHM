# Admin UI Troubleshooting Guide

## Common Issues and Solutions

### 1. Delete Operations Failing with 400 Bad Request

**Symptoms**:
- Clicking delete button returns 400 error
- Console shows "Zod validation error"
- Error message: "field_name: Required" with "received: undefined"

**Root Causes**:
1. **Indentation issues in tRPC endpoint** (most common)
2. Client sending wrong parameter format
3. tRPC body parsing misconfiguration

**Solution**:
```typescript
// Check the endpoint definition for proper indentation
deleteItem: adminProcedure
  .input(z.object({        // Must have proper indentation (4 spaces)
    item_id: z.string(),
  }))
  .mutation(async ({ input }) => {
    // Implementation
  }),
```

**Debugging Steps**:
1. Check browser console for client-side logs
2. Check API logs for server-side logs  
3. Verify request body format: `{"json":{"field":"value"}}`
4. Compare with working similar endpoints

**Related**: See [TRPC_CODING_STANDARDS.md](./TRPC_CODING_STANDARDS.md)

---

### 2. Authentication Errors (401 Unauthorized)

**Symptoms**:
- All requests return 401
- "Unauthorized" error in console
- Redirected to login page constantly

**Root Causes**:
1. Token expired
2. Token not stored correctly
3. Token not sent in Authorization header
4. Server JWT secret changed

**Solution**:
```typescript
// Check localStorage
console.log(localStorage.getItem('admin_token'));

// Clear and re-login
localStorage.removeItem('admin_token');
// Then login again
```

**Debugging Steps**:
1. Open DevTools > Application > Local Storage
2. Check for `admin_token` entry
3. Decode JWT at jwt.io to check expiration
4. Clear storage and re-login
5. Check API logs for JWT validation errors

---

### 3. Data Not Loading / Empty Lists

**Symptoms**:
- Lists show loading state but never finish
- No error messages
- Empty state showing when data should exist

**Root Causes**:
1. API endpoint returning empty array
2. Tenant filter excluding data
3. RLS policies blocking access
4. Database query error (silent failure)

**Solution**:
```typescript
// Check API logs for query results
console.log('Query result:', result.rows);

// Verify tenant context
console.log('User tenant:', ctx.user.tenantId);

// Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

**Debugging Steps**:
1. Open Network tab in DevTools
2. Find the API request
3. Check response status and body
4. Verify query parameters
5. Check API logs for database errors
6. Verify RLS policies allow access

---

### 4. CORS Errors

**Symptoms**:
- "CORS policy" error in console
- Requests fail with no response
- Works in development but fails in production

**Root Causes**:
1. CORS origin not whitelisted
2. Preflight request failing
3. Credentials not allowed

**Solution**:
```typescript
// Server-side (apps/api/src/index.ts)
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://admin.rythm.training',  // Add production URLs
    'https://rythm.training'
  ],
  credentials: true,
}));
```

**Debugging Steps**:
1. Check browser console for CORS error details
2. Verify API CORS configuration
3. Check environment variables
4. Test with curl to isolate client vs server issue

---

### 5. Slow Performance / Timeouts

**Symptoms**:
- Requests taking >10 seconds
- Timeout errors
- UI freezing

**Root Causes**:
1. Missing database indexes
2. N+1 query problems
3. Large dataset without pagination
4. Slow RLS policy evaluation

**Solution**:
```sql
-- Add indexes for commonly filtered columns
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_sets_session_id ON sets(session_id);

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Debugging Steps**:
1. Check Network tab for slow requests
2. Enable query logging in PostgreSQL
3. Use EXPLAIN ANALYZE on slow queries
4. Add appropriate indexes
5. Implement pagination
6. Consider materialized views for complex queries

---

### 6. Form Validation Errors Not Showing

**Symptoms**:
- Form submission fails silently
- No error messages displayed
- Data doesn't save

**Root Causes**:
1. Zod schema mismatch between client and server
2. Error handling not showing validation errors
3. Form state not updating

**Solution**:
```typescript
// Client-side error handling
try {
  await apiClient.admin.createItem(formData);
} catch (error) {
  if (error instanceof Error) {
    // Extract Zod validation errors
    const match = error.message.match(/Validation errors: (.+)/);
    if (match) {
      const errors = match[1];
      // Display to user
      alert(errors);
    }
  }
}
```

**Debugging Steps**:
1. Check console for error messages
2. Verify Zod schema on server matches client expectations
3. Add error logging in catch blocks
4. Test API endpoint directly with Postman/curl

---

### 7. Stale Data / Cache Issues

**Symptoms**:
- Changes not reflecting after save
- Old data showing after update
- Refresh shows correct data

**Root Causes**:
1. Not refetching data after mutation
2. Client-side cache not invalidated
3. Component state not updating

**Solution**:
```typescript
// Refresh list after mutation
const handleDelete = async (id: string) => {
  await apiClient.admin.deleteItem({ id });
  
  // Refetch data
  await refreshList();  // Your refresh function
  await refreshStats(); // Update counts/stats
};
```

**Debugging Steps**:
1. Check if mutation succeeds (check API response)
2. Verify data refresh logic is called
3. Add console.log to track data flow
4. Check if component re-renders after state change

---

### 8. Mobile Responsiveness Issues

**Symptoms**:
- Layout broken on mobile
- Buttons not clickable
- Horizontal scroll on mobile

**Root Causes**:
1. Fixed widths instead of responsive
2. Missing mobile breakpoints
3. Table layout on mobile
4. Touch targets too small

**Solution**:
```tsx
// Use Tailwind responsive classes
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Content */}
</div>

// Hide tables on mobile, show cards
<div className="hidden md:block">
  <Table />
</div>
<div className="block md:hidden">
  <CardList />
</div>
```

---

### 9. Production vs Development Differences

**Symptoms**:
- Works locally but fails in production
- Environment variables not working
- API endpoints 404 in production

**Root Causes**:
1. Environment variables not set in production
2. Build process differences
3. API URL hardcoded for localhost

**Solution**:
```typescript
// Use environment-aware API URL
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.rythm.training';

// Check environment in code
if (process.env.NODE_ENV === 'production') {
  // Production-specific logic
}
```

**Debugging Steps**:
1. Check Azure Container App environment variables
2. Review build logs for errors
3. Test production build locally: `npm run build && npm start`
4. Compare environment variables between dev and prod

---

### 10. Memory Leaks / Browser Hanging

**Symptoms**:
- Browser tab consuming high memory
- UI becomes unresponsive over time
- Need to refresh to restore performance

**Root Causes**:
1. Event listeners not cleaned up
2. Intervals not cleared
3. Large arrays stored in state
4. Console.log keeping references

**Solution**:
```typescript
// Clean up in useEffect
useEffect(() => {
  const interval = setInterval(() => {
    // Update logic
  }, 1000);
  
  return () => {
    clearInterval(interval);  // Clean up
  };
}, []);

// Limit console.log in production
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

---

## Debugging Checklist

When troubleshooting any issue:

- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Check API logs in Azure Container Apps
- [ ] Verify authentication token is present and valid
- [ ] Test API endpoint directly (Postman/curl)
- [ ] Compare with working similar features
- [ ] Check database for data issues
- [ ] Verify RLS policies allow access
- [ ] Review recent code changes
- [ ] Test in incognito mode (rule out extension issues)

## Getting Help

1. **GitHub Issues**: Create issue with full error logs
2. **Azure Logs**: Use Azure CLI to get container logs:
   ```bash
   az containerapp logs show --name api --resource-group rythm-rg
   ```
3. **Local Testing**: Reproduce in local development environment
4. **Documentation**: Check [docs/README.md](./README.md) for guides

---

**Last Updated**: October 14, 2025  
**Version**: 1.0.0
