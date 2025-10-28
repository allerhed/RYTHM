# Proxy Configuration Fix - Development Environment

**Date**: October 10, 2025  
**Issue**: Mobile and Admin apps were using `localhost:3001` instead of `api:3001` for API proxy in Docker containers  
**Status**: ✅ RESOLVED

## Problem

The development environment proxy was incorrectly configured, causing the mobile and admin apps to try to connect to `localhost:3001` instead of the Docker service name `api:3001`. Inside Docker containers, `localhost` refers to the container itself, not the host machine.

### Symptoms
- API requests from mobile/admin apps were failing
- Logs showed: `Using apiBaseUrl: http://localhost:3001`
- Connection errors: `ECONNREFUSED ::1:3001` (IPv6 localhost)

### Root Cause
Both `apps/mobile/.env.local` and `apps/admin/.env.local` files were being copied into the Docker containers during the build process, overriding the environment variables set in `docker-compose.yml`.

Additionally, the `next.config.js` files had the wrong environment variable priority order:
- They prioritized `NEXT_PUBLIC_API_URL` (browser → host) over `API_URL` (container → container)
- This caused Next.js server-side code to use `http://localhost:3001` instead of `http://api:3001`

In Next.js, the environment variable precedence is:
1. `.env.local` (highest priority) ❌ Was overriding Docker env vars
2. Environment variables
3. `.env`
4. Default values

## Solution

### 1. Renamed .env.local Files
```bash
# These files are now backed up and won't be used in containers
apps/mobile/.env.local.backup
apps/admin/.env.local.backup
```

### 2. Fixed next.config.js Environment Variable Priority
The `next.config.js` files in both mobile and admin apps had the wrong priority order for environment variables. They were prioritizing `NEXT_PUBLIC_API_URL` (which is for browser use) over `API_URL` (which is for server-side use).

**Before:**
```javascript
env: {
  API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://api.rythm.training'),
}
```

**After:**
```javascript
env: {
  // Use API_URL for server-side (container-to-container), fallback to NEXT_PUBLIC for backwards compatibility
  API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://api:3001' : 'https://api.rythm.training'),
}
```

### 3. Docker Environment Variables (Correct Configuration)
In `docker-compose.yml`, both mobile and admin services have:
```yaml
environment:
  - NODE_ENV=development
  - API_URL=http://api:3001              # Container-to-container (server-side)
  - NEXT_PUBLIC_API_URL=http://localhost:3001  # Browser-to-host (client-side)
```

### 4. Rebuilt Containers
```bash
docker-compose up -d --build mobile admin
```

Note: After changing `next.config.js`, a container restart is sufficient as Next.js hot reload will pick up the changes.

## Verification

✅ Both containers now use correct API URL:
```bash
# Mobile
API_URL=http://api:3001
No .env.local ✓

# Admin
API_URL=http://api:3001
No .env.local ✓
```

## How the Proxy Works

### Server-Side Requests (API Route Proxy)
- Used by: `apps/mobile/src/app/api/[...proxy]/route.ts`
- Uses: `API_URL=http://api:3001`
- Communication: Container → Container (Docker network)
- Example: Next.js server fetches data from API

### Client-Side Requests (Browser)
- Used by: Frontend JavaScript in browser
- Uses: `NEXT_PUBLIC_API_URL=http://localhost:3001`
- Communication: Browser → Host machine → API container
- Example: User clicks a button, browser makes fetch request

## Files Modified

### Renamed (Backed Up)
- `apps/mobile/.env.local` → `apps/mobile/.env.local.backup`
- `apps/admin/.env.local` → `apps/admin/.env.local.backup`

### Fixed Environment Variable Priority
- `apps/mobile/next.config.js` - Changed `env.API_URL` to prioritize `process.env.API_URL` over `NEXT_PUBLIC_API_URL`
- `apps/admin/next.config.js` - Changed both `env.API_URL` and `rewrites()` to prioritize `process.env.API_URL`

### Already Correct
- `docker-compose.yml` - Environment variables were already correct
- `.dockerignore` - Already excluded `.env.local` files
- Proxy route implementations - Already had correct fallback logic

## Best Practices for Development

### ✅ DO
- Use `docker-compose.yml` environment variables for container configuration
- Use Docker service names (`api`, `db`) for container-to-container communication
- Use `localhost` only for browser-to-host communication (NEXT_PUBLIC_* vars)

### ❌ DON'T
- Create `.env.local` files in apps when using Docker containers
- Use `localhost` for server-side requests inside containers
- Commit `.env.local` files to version control

## Environment Variable Reference

| Variable | Used By | Purpose | Value in Docker |
|----------|---------|---------|-----------------|
| `API_URL` | Server-side code | Container→Container API calls | `http://api:3001` |
| `NEXT_PUBLIC_API_URL` | Browser JavaScript | Browser→Host API calls | `http://localhost:3001` |
| `DB_HOST` | API service | Database connection | `db` |
| `CORS_ORIGIN` | API service | CORS configuration | `http://localhost:3000,http://localhost:3002` |

## Testing the Fix

### 1. Check Environment Variables
```bash
# Mobile
docker-compose exec mobile sh -c 'echo $API_URL'
# Should output: http://api:3001

# Admin
docker-compose exec admin sh -c 'echo $API_URL'
# Should output: http://api:3001
```

### 2. Verify No .env.local Files
```bash
docker-compose exec mobile ls /app/apps/mobile/.env.local
# Should output: No such file or directory

docker-compose exec admin ls /app/apps/admin/.env.local
# Should output: No such file or directory
```

### 3. Test API Connectivity
```bash
# From inside mobile container
docker-compose exec mobile sh -c 'wget -O- http://api:3001/health'
# Should return: {"status":"ok",...}

# From inside admin container
docker-compose exec admin sh -c 'wget -O- http://api:3001/health'
# Should return: {"status":"ok",...}
```

**Test Results** (October 10, 2025):
```bash
# Mobile → API
{"status":"ok","timestamp":"2025-10-10T11:57:33.152Z"} ✅

# Admin → API
{"status":"ok","timestamp":"2025-10-10T11:57:39.429Z"} ✅
```

## Related Documentation
- [Container-First Development Guide](./docs/CONTAINER_FIRST_DEVELOPMENT.md)
- [Quick Start Guide](./docs/QUICK_START.md)
- [Docker Compose Configuration](./docker-compose.yml)

## Impact
- ✅ API requests now work correctly in development environment
- ✅ Container-to-container communication uses Docker networking
- ✅ No more connection refused errors
- ✅ Consistent behavior between local development and production
- ✅ Proper separation of server-side vs client-side configuration

## Future Prevention

To prevent this issue from recurring:

1. **Documentation**: Added this guide
2. **.gitignore**: Already ignores `.env.local` files
3. **.dockerignore**: Already excludes `.env.local` files
4. **Best Practice**: Use `docker-compose.yml` for all container configuration

## Rollback Procedure

If you need to restore the old behavior:
```bash
# Restore .env.local files
mv apps/mobile/.env.local.backup apps/mobile/.env.local
mv apps/admin/.env.local.backup apps/admin/.env.local

# Rebuild containers
docker-compose up -d --build mobile admin
```

## Summary

The issue was caused by `.env.local` files overriding Docker environment variables. By removing these files from the containers (they're now backed up as `.backup` files) and relying solely on `docker-compose.yml` configuration, the proxy now correctly uses `http://api:3001` for container-to-container communication.

This fix aligns with Docker best practices and ensures consistent behavior across development and production environments.
