# Quick Reference - Docker Dev Environment

## Starting Development

```bash
# First time or after git pull
npm run dev:validate    # Check configuration
npm run dev            # Start all services (includes auto-checks)
```

## Common Issues & Fixes

### ❌ "Proxy request failed" or "ECONNREFUSED"

**Cause**: Proxy using wrong API URL  
**Check**:
```bash
docker-compose logs mobile --tail=20 | grep "Using apiBaseUrl"
# Should show: Using apiBaseUrl: http://api:3001
```

**Fix**:
```bash
npm run dev:validate   # See what's wrong
# Follow instructions, then:
docker-compose restart mobile admin
```

### ❌ ".env.local file exists"

**Cause**: File overrides Docker environment variables  
**Fix**: Already handled automatically by `npm run dev`  
**Manual**: `mv apps/mobile/.env.local apps/mobile/.env.local.backup`

### ❌ "Wrong priority order in next.config.js"

**Cause**: NEXT_PUBLIC_API_URL comes before API_URL  
**Fix**: In `apps/mobile/next.config.js` and `apps/admin/next.config.js`:
```javascript
// Change this:
API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL

// To this:
API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
```

## Verification Commands

```bash
# Check proxy is using correct URL
docker-compose logs mobile --tail=10 | grep Proxying

# Check environment variables
docker-compose exec mobile sh -c 'echo $API_URL'

# Check next.config.js API_URL
docker-compose exec mobile sh -c 'cd /app/apps/mobile && node -e "const c = require(\"./next.config.js\"); console.log(c.env?.API_URL)"'

# Test container-to-container connectivity
docker-compose exec mobile wget -O- http://api:3001/health

# Check for .env.local in container
docker-compose exec mobile ls /app/apps/mobile/.env.local
# Should output: No such file or directory
```

## Useful Commands

```bash
# Status
npm run dev:status

# Logs
npm run dev:logs              # All services
npm run dev:logs:mobile       # Mobile only
npm run dev:logs:api          # API only
npm run dev:logs:admin        # Admin only

# Restart
npm run dev:restart           # All services
npm run dev:restart:mobile    # Mobile only
npm run dev:restart:api       # API only
npm run dev:restart:admin     # Admin only

# Shell access
npm run dev:shell:mobile      # Mobile container shell
npm run dev:shell:api         # API container shell
npm run dev:shell:db          # PostgreSQL shell

# Cleanup
npm run dev:down              # Stop all services
npm run dev:clean             # Stop and remove volumes
```

## Environment Variables Cheat Sheet

### In docker-compose.yml
```yaml
mobile:
  environment:
    - API_URL=http://api:3001              # ✅ For server-side (proxy)
    - NEXT_PUBLIC_API_URL=http://localhost:3001  # ✅ For browser

admin:
  environment:
    - API_URL=http://api:3001              # ✅ For server-side
    - NEXT_PUBLIC_API_URL=http://localhost:3001  # ✅ For browser
```

### Usage in Code
```javascript
// In Next.js API route (proxy) - runs in container
const apiUrl = process.env.API_URL;  // Uses: http://api:3001

// In browser code - runs in user's browser
const apiUrl = process.env.NEXT_PUBLIC_API_URL;  // Uses: http://localhost:3001
```

## Services & Ports

| Service | Port | URL |
|---------|------|-----|
| Mobile PWA | 3000 | http://localhost:3000 |
| API Server | 3001 | http://localhost:3001 |
| Admin Dashboard | 3002 | http://localhost:3002 |
| PostgreSQL | 5432 | localhost:5432 |

## Health Checks

```bash
# API
curl http://localhost:3001/health

# Database
docker-compose exec db pg_isready -U rythm_api -d rythm

# All services
npm run dev:health
```

## Documentation

- `UPDATED_DEV_SCRIPTS.md` - Full developer guide
- `PROXY_FIX_SUMMARY.md` - Technical proxy details
- `DEV_SCRIPTS_UPDATE_SUMMARY.md` - What changed
- `docs/QUICK_START.md` - Quick start guide
- `docs/CONTAINER_FIRST_DEVELOPMENT.md` - Container best practices

## When Things Go Wrong

1. **Run validation**: `npm run dev:validate`
2. **Check logs**: `npm run dev:logs:mobile | grep -i error`
3. **Verify config**: See "Verification Commands" above
4. **Restart services**: `npm run dev:restart`
5. **Full restart**: `npm run dev:down && npm run dev`
6. **Nuclear option**: `npm run dev:clean && npm run dev`

## Remember

- ❌ Don't create `.env.local` files in `apps/mobile/` or `apps/admin/`
- ✅ Use `docker-compose.yml` for container configuration
- ✅ Run `npm run dev:validate` when in doubt
- ✅ Use service names (`api`, `db`) for container-to-container communication
- ✅ Use `localhost` only for browser-to-host communication
