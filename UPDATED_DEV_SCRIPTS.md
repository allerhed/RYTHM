# Local Development Setup - Updated Scripts

## What Changed (October 10, 2025)

Updated local development scripts to automatically prevent and detect common Docker configuration issues that can break container-to-container communication.

## Issues That Are Now Automatically Handled

### 1. `.env.local` Files Override Docker Environment Variables
**Problem**: `.env.local` files in `apps/mobile/` and `apps/admin/` were overriding Docker Compose environment variables, causing the proxy to use `localhost:3001` instead of `api:3001`.

**Solution**: `start.sh` now automatically:
- Detects `.env.local` files before starting containers
- Backs them up to `.env.local.backup`
- Warns if found inside running containers

### 2. Wrong Priority Order in `next.config.js`
**Problem**: `next.config.js` files prioritized `NEXT_PUBLIC_API_URL` (browser URL) over `API_URL` (container URL), breaking server-side proxy requests.

**Solution**: 
- `start.sh` validates configuration files before starting
- `validate-config.sh` checks for the correct priority order
- Both scripts provide clear instructions if issues are found

## New Scripts

### 1. `npm run dev:validate`
Runs comprehensive validation checks **before** starting the environment:
- ✅ Checks for `.env.local` files
- ✅ Validates `next.config.js` environment variable priority
- ✅ Verifies `docker-compose.yml` configuration
- ✅ Checks `.dockerignore` settings

**Usage:**
```bash
npm run dev:validate
```

**When to use:**
- Before starting dev environment for the first time
- After pulling changes from git
- When experiencing proxy or API connection issues

### 2. Enhanced `npm run dev`
Now includes automatic checks and fixes:
- Backs up `.env.local` files automatically
- Validates `next.config.js` files
- Verifies proxy configuration after startup
- Provides detailed health check results

## Correct Configuration Reference

### `next.config.js` (Mobile & Admin)
```javascript
env: {
  // ✅ CORRECT: API_URL first (container-to-container)
  API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://api:3001' : 'https://api.rythm.training'),
}

// ❌ WRONG: NEXT_PUBLIC_API_URL first (causes localhost to be used)
// API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || ...
```

### `docker-compose.yml`
```yaml
mobile:
  environment:
    - API_URL=http://api:3001              # ✅ Container name for server-side
    - NEXT_PUBLIC_API_URL=http://localhost:3001  # ✅ localhost for browser

admin:
  environment:
    - API_URL=http://api:3001              # ✅ Container name for server-side
    - NEXT_PUBLIC_API_URL=http://localhost:3001  # ✅ localhost for browser
```

### `.env.local` Files
```bash
# ❌ DON'T create these files in apps/mobile/ or apps/admin/
# They override Docker environment variables

# ✅ DO use docker-compose.yml for all container configuration
```

## Quick Start (Updated Process)

### First Time Setup
```bash
# 1. Validate configuration
npm run dev:validate

# 2. If validation passes, start dev environment
npm run dev
```

### If Validation Fails
The validator will tell you exactly what to fix:
```bash
❌ apps/mobile/.env.local exists
   Solution: mv apps/mobile/.env.local apps/mobile/.env.local.backup

❌ apps/mobile/next.config.js has WRONG priority
   Solution: Change order to: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
```

### Daily Development
```bash
# Just start - validation happens automatically
npm run dev
```

## Troubleshooting

### Proxy Still Using Wrong URL
1. **Check environment variables inside container:**
   ```bash
   docker-compose exec mobile sh -c 'echo $API_URL'
   # Should output: http://api:3001
   ```

2. **Check if .env.local exists in container:**
   ```bash
   docker-compose exec mobile ls /app/apps/mobile/.env.local
   # Should output: No such file or directory
   ```

3. **Verify next.config.js priority:**
   ```bash
   docker-compose exec mobile sh -c 'cd /app/apps/mobile && node -e "const config = require(\"./next.config.js\"); console.log(config.env?.API_URL)"'
   # Should output: http://api:3001
   ```

4. **Rebuild if necessary:**
   ```bash
   docker-compose up -d --build mobile admin
   ```

### Registration/Login Still Failing
1. **Check proxy logs:**
   ```bash
   docker-compose logs mobile --tail=50 | grep "Proxying"
   # Should show: Proxying POST /api/auth/register -> http://api:3001/api/auth/register
   ```

2. **Check API health:**
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok",...}
   ```

3. **Test container-to-container connectivity:**
   ```bash
   docker-compose exec mobile wget -O- http://api:3001/health
   # Should return JSON response
   ```

## Understanding the Fix

### The Problem
In Docker, `localhost` inside a container refers to **that container**, not the host machine or other containers. For containers to communicate with each other, they must use **Docker service names** defined in `docker-compose.yml`.

### The Solution
- **Server-side code** (Next.js API routes, server components) uses `API_URL=http://api:3001`
- **Browser code** (client components, fetch calls) uses `NEXT_PUBLIC_API_URL=http://localhost:3001`
- **Priority order** in `next.config.js` must put `API_URL` first so server-side code gets the correct value

### Why It Matters
```javascript
// In proxy route (runs on Next.js server inside container)
const apiBaseUrl = process.env.API_URL;  // Must be 'http://api:3001'

// In browser (runs on user's computer)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;  // Can be 'http://localhost:3001'
```

## File Changes Summary

| File | Change | Purpose |
|------|--------|---------|
| `scripts/start.sh` | Added `.env.local` detection and backup | Prevents environment variable override |
| `scripts/start.sh` | Added `next.config.js` validation | Detects wrong priority order |
| `scripts/start.sh` | Added proxy verification | Confirms correct API URL after startup |
| `scripts/validate-config.sh` | New comprehensive validator | Pre-flight checks before starting |
| `package.json` | Added `dev:validate` script | Easy access to validation |
| `apps/mobile/next.config.js` | Fixed env var priority | API_URL before NEXT_PUBLIC_API_URL |
| `apps/admin/next.config.js` | Fixed env var priority | API_URL before NEXT_PUBLIC_API_URL |

## Additional Commands

```bash
# Validate configuration only
npm run dev:validate

# Start with validation (happens automatically)
npm run dev

# Check service status
npm run dev:status

# View proxy logs
npm run dev:logs:mobile | grep Proxying

# Check API URL configuration
docker-compose exec mobile sh -c 'cd /app/apps/mobile && node -e "const c = require(\"./next.config.js\"); console.log(c.env?.API_URL)"'

# Restart services if needed
npm run dev:restart:mobile
npm run dev:restart:admin
```

## Related Documentation
- [PROXY_FIX_SUMMARY.md](../PROXY_FIX_SUMMARY.md) - Detailed explanation of the proxy fix
- [docs/CONTAINER_FIRST_DEVELOPMENT.md](../docs/CONTAINER_FIRST_DEVELOPMENT.md) - Container development guide
- [docs/QUICK_START.md](../docs/QUICK_START.md) - Quick start guide

## Summary

The updated scripts now:
1. ✅ **Automatically detect and fix** `.env.local` issues
2. ✅ **Validate configuration** before starting
3. ✅ **Verify proxy setup** after startup
4. ✅ **Provide clear error messages** with solutions
5. ✅ **Prevent future issues** through automated checks

No more manual debugging of proxy issues! 🎉
