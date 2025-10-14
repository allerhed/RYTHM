# NPM Commands Reference

Complete guide to all available npm commands in the RYTHM project.

## Table of Contents
- [Development Commands](#development-commands)
- [Service Management](#service-management)
- [Logging & Debugging](#logging--debugging)
- [Shell Access](#shell-access)
- [Production Commands](#production-commands)
- [Database Commands](#database-commands)
- [Data Generation](#data-generation)
- [Quick Reference Table](#quick-reference-table)

---

## Development Commands

### `npm run dev`
**Purpose**: Start the complete development environment  
**What it does**:
- Validates configuration (checks for `.env.local` issues)
- Backs up any problematic `.env.local` files
- Starts all Docker services (db, api, mobile, admin)
- Waits for database to be ready
- Performs health checks on all services
- Verifies proxy configuration

**Output**:
```
🚀 Starting RYTHM development environment...
✅ Database is ready!
✅ API is healthy
✅ Mobile app is responding
🎉 Setup complete! Happy coding!
```

**Services Started**:
- PostgreSQL Database (port 5432)
- API Server (port 3001)
- Mobile PWA (port 3000)
- Admin Dashboard (port 3002)

**When to use**: Every time you start working on the project

---

### `npm run dev:validate`
**Purpose**: Validate development configuration before starting  
**What it does**:
- Checks for `.env.local` files that override Docker env vars
- Validates `next.config.js` environment variable priority
- Verifies `docker-compose.yml` configuration
- Checks `.dockerignore` settings

**Exit Codes**:
- `0` - All checks passed, safe to start
- `1` - Issues found, see output for fixes

**Output Example**:
```
🔍 RYTHM Configuration Validator
================================

1️⃣  Checking for .env.local files...
   ✅ apps/mobile/.env.local not found (good)
   ✅ apps/admin/.env.local not found (good)

2️⃣  Validating next.config.js files...
   ✅ apps/mobile/next.config.js has correct priority (API_URL first)
   ✅ apps/admin/next.config.js has correct priority (API_URL first)

3️⃣  Checking docker-compose.yml environment variables...
   ✅ Mobile service has correct API_URL (http://api:3001)
   ✅ Admin service has correct API_URL (http://api:3001)

4️⃣  Checking .dockerignore...
   ✅ .dockerignore excludes .env.local files

================================
✅ All checks passed! Configuration is correct.
```

**When to use**:
- Before starting dev environment for the first time
- After pulling changes from git
- When experiencing proxy or connection issues
- Before committing configuration changes

---

### `npm run dev:build`
**Purpose**: Build Docker images without starting services  
**Command**: `docker-compose build`

**What it does**:
- Builds Docker images for api, mobile, and admin services
- Uses Dockerfile.dev for each service
- Installs dependencies
- Creates optimized development containers

**When to use**:
- After changing Dockerfile.dev files
- After updating dependencies in package.json
- When you want to rebuild without starting

**Time**: ~2-3 minutes (first build), ~30 seconds (cached)

---

### `npm run dev:up`
**Purpose**: Start all services without health checks  
**Command**: `docker-compose up -d`

**What it does**: Starts all services in detached mode

**Difference from `npm run dev`**:
- No configuration validation
- No health checks
- No automatic fixes
- Faster startup

**When to use**: When you know configuration is correct and want quick startup

---

### `npm run dev:down`
**Purpose**: Stop all services  
**Command**: `docker-compose down`

**What it does**:
- Stops all running containers
- Removes containers
- Removes networks
- **Preserves volumes** (database data persists)

**When to use**:
- End of workday
- Before switching branches
- Before major updates

**Note**: Database data is preserved. Use `npm run dev:clean` to remove data.

---

### `npm run dev:clean`
**Purpose**: Stop services and remove ALL data  
**Command**: `docker-compose down -v --remove-orphans && docker system prune -f`

**What it does**:
- Stops all containers
- **Removes all volumes** (⚠️ deletes database data)
- Removes networks
- Removes orphaned containers
- Prunes Docker system

**⚠️ WARNING**: This deletes your local database! You'll start with a fresh database.

**When to use**:
- Starting completely fresh
- Fixing database corruption
- After major schema changes
- Cleaning up disk space

**Recovery**: Database will be recreated from migrations on next `npm run dev`

---

## Service Management

### `npm run dev:restart`
**Purpose**: Restart all services  
**Command**: `docker-compose restart`

**What it does**: Restarts all containers without rebuilding

**Restart time**: ~5-10 seconds

**When to use**:
- After environment variable changes
- When a service becomes unresponsive
- To apply configuration changes without full rebuild

---

### `npm run dev:restart:api`
**Purpose**: Restart only the API server  
**Command**: `docker-compose restart api`

**When to use**:
- After changing API environment variables
- When API becomes unresponsive
- After modifying API configuration files

---

### `npm run dev:restart:mobile`
**Purpose**: Restart only the mobile app  
**Command**: `docker-compose restart mobile`

**When to use**:
- After changing mobile environment variables
- After modifying `next.config.js`
- When mobile app becomes unresponsive

---

### `npm run dev:restart:admin`
**Purpose**: Restart only the admin dashboard  
**Command**: `docker-compose restart admin`

**When to use**:
- After changing admin environment variables
- After modifying admin `next.config.js`
- When admin becomes unresponsive

---

### `npm run dev:status`
**Purpose**: Show status of all services  
**Command**: `docker-compose ps`

**Output**:
```
NAME             STATUS                   PORTS
rythm-admin-1    Up 2 minutes            0.0.0.0:3002->3002/tcp
rythm-api-1      Up 2 minutes (healthy)  0.0.0.0:3001->3001/tcp
rythm-db-1       Up 2 minutes (healthy)  0.0.0.0:5432->5432/tcp
rythm-mobile-1   Up 2 minutes            0.0.0.0:3000->3000/tcp
```

**Status indicators**:
- `Up X minutes` - Running
- `(healthy)` - Health check passing
- `Exited` - Stopped or crashed

**When to use**:
- Check if services are running
- See how long services have been up
- Verify health check status

---

### `npm run dev:health`
**Purpose**: Run comprehensive health checks  
**Command**: `./scripts/health-check.sh`

**What it checks**:
- Database connectivity
- API health endpoint
- Mobile app accessibility
- Admin app accessibility
- Container health status

**When to use**:
- Verifying environment after startup
- Troubleshooting connection issues
- Before running tests

---

## Logging & Debugging

### `npm run dev:logs`
**Purpose**: Stream logs from all services  
**Command**: `docker-compose logs -f`

**What it does**: Shows real-time logs from all containers with color coding

**Output format**:
```
api-1    | 🚀 RYTHM API server running on port 3001
mobile-1 | ✓ Ready in 3.3s
db-1     | database system is ready to accept connections
admin-1  | ✓ Ready in 2.8s
```

**Controls**:
- `Ctrl+C` to stop streaming (services keep running)
- Scroll to see history

**When to use**:
- Monitoring all services during development
- Seeing interactions between services
- General debugging

---

### `npm run dev:logs:api`
**Purpose**: Stream logs from API server only  
**Command**: `docker-compose logs -f api`

**When to use**:
- Debugging API endpoints
- Monitoring database queries
- Checking authentication flows
- Viewing API errors

**Common log patterns**:
```
✅ Database connected
🚀 RYTHM API server running on port 3001
📊 Health check: http://localhost:3001/health
POST /api/auth/login 200 in 45ms
```

---

### `npm run dev:logs:mobile`
**Purpose**: Stream logs from mobile app only  
**Command**: `docker-compose logs -f mobile`

**When to use**:
- Debugging proxy requests
- Monitoring page compilations
- Checking Next.js errors
- Viewing PWA service worker activity

**Common log patterns**:
```
✓ Ready in 3.3s
○ Compiling / ...
✓ Compiled / in 5s
Using apiBaseUrl: http://api:3001
Proxying POST /api/auth/register -> http://api:3001/api/auth/register
```

---

### `npm run dev:logs:admin`
**Purpose**: Stream logs from admin dashboard only  
**Command**: `docker-compose logs -f admin`

**When to use**:
- Debugging admin interface
- Monitoring admin API requests
- Checking admin authentication

---

### `npm run dev:logs:db`
**Purpose**: Stream logs from PostgreSQL database  
**Command**: `docker-compose logs -f db`

**When to use**:
- Debugging database connection issues
- Monitoring SQL queries (if query logging enabled)
- Checking database startup
- Viewing migration execution

**Common log patterns**:
```
database system is ready to accept connections
listening on IPv4 address "0.0.0.0", port 5432
database system was shut down at 2025-10-10 12:00:00 UTC
```

---

## Shell Access

### `npm run dev:shell:api`
**Purpose**: Open shell in API container  
**Command**: `docker-compose exec api sh`

**What you can do**:
- Inspect files inside container
- Run Node.js commands
- Check environment variables
- Debug container-specific issues

**Example usage**:
```bash
npm run dev:shell:api

# Inside container:
$ echo $API_URL
$ ls /app/apps/api/src
$ node --version
$ npm list
$ exit
```

---

### `npm run dev:shell:mobile`
**Purpose**: Open shell in mobile container  
**Command**: `docker-compose exec mobile sh`

**What you can do**:
- Check Next.js configuration
- Inspect environment variables
- Debug proxy issues
- View compiled files

**Example usage**:
```bash
npm run dev:shell:mobile

# Inside container:
$ echo $API_URL
$ cd /app/apps/mobile
$ node -e "const c = require('./next.config.js'); console.log(c.env?.API_URL)"
$ ls .next
$ exit
```

---

### `npm run dev:shell:admin`
**Purpose**: Open shell in admin container  
**Command**: `docker-compose exec admin sh`

**Similar to mobile shell**, use for debugging admin-specific issues.

---

### `npm run dev:shell:db`
**Purpose**: Open PostgreSQL interactive shell  
**Command**: `docker-compose exec db psql -U rythm_api -d rythm`

**What you can do**:
- Run SQL queries directly
- Inspect database schema
- Check data
- Debug database issues

**Example usage**:
```bash
npm run dev:shell:db

# Inside PostgreSQL:
rythm=# \dt          -- List tables
rythm=# \d users     -- Describe users table
rythm=# SELECT * FROM tenants LIMIT 5;
rythm=# SELECT COUNT(*) FROM sessions;
rythm=# \q           -- Exit
```

**Useful psql commands**:
- `\dt` - List all tables
- `\d table_name` - Describe table schema
- `\du` - List users/roles
- `\l` - List databases
- `\q` - Quit
- `\?` - Help

---

## Production Commands

### `npm run build`
**Purpose**: Build production Docker images  
**Command**: `docker-compose -f docker-compose.prod.yml build`

**What it does**:
- Uses production Dockerfiles
- Optimizes images for production
- Excludes development dependencies
- Creates smaller, faster images

**When to use**:
- Preparing for deployment
- Testing production builds locally
- Before pushing to container registry

**Time**: ~3-5 minutes

---

### `npm start`
**Purpose**: Start production environment  
**Command**: `docker-compose -f docker-compose.prod.yml up -d`

**Difference from dev**:
- Uses production configuration
- No hot reload
- Optimized builds
- Production environment variables

**When to use**:
- Testing production build locally
- Before deploying to Azure
- Validating production configuration

---

### `npm stop`
**Purpose**: Stop production environment  
**Command**: `docker-compose -f docker-compose.prod.yml down`

**When to use**: After testing production build

---

## Database Commands

### `npm run db:migrate`
**Purpose**: Run database migrations  
**Command**: `docker-compose exec api npm run db:migrate --workspace=@rythm/db`

**What it does**:
- Executes SQL migration files in order
- Updates database schema
- Creates/modifies tables
- Sets up RLS policies

**When to use**:
- After adding new migration files
- After pulling database schema changes
- Manually updating database schema

**Note**: Migrations run automatically on fresh database creation via Docker init scripts.

---

### `npm run db:seed`
**Purpose**: Seed database with initial data  
**Command**: `docker-compose exec api npm run db:seed --workspace=@rythm/db`

**What it does**:
- Inserts exercise templates
- Adds equipment data
- Creates initial categories
- Populates lookup tables

**When to use**:
- After fresh database creation
- Restoring reference data
- Development environment setup

---

## Data Generation

### `npm run populate-test-data`
**Purpose**: Populate database with test data (simple)  
**Command**: `node scripts/populate-test-data.js`

**What it generates**:
- Test tenant
- Test users
- Basic sessions
- Sample sets

**Use case**: Quick test data for basic development

---

### `npm run generate-test-data`
**Purpose**: Generate comprehensive test data  
**Command**: `./scripts/generate-test-data.sh`

**What it generates**:
- Multiple tenants
- Multiple users per tenant
- Realistic workout sessions
- Historical data
- Progress tracking data

**Use case**: Testing analytics, charts, and complex features

---

### `npm run generate-training-data`
**Purpose**: Generate comprehensive training data based on Training_week.md  
**Command**: `ts-node --project scripts/tsconfig.json scripts/generate-training-data.ts`

**What it generates**:
- Complete weekly training programs
- Realistic progression over time
- Multiple exercise variations
- 600+ lines of sophisticated data generation

**Data includes**:
- Strength training sessions (Mon, Wed, Fri)
- Cardio sessions (Tue, Thu, Sat)
- Rest days (Sun)
- Progressive overload
- Volume tracking

**Use case**: 
- Load testing
- Performance testing
- Demo data generation
- Testing analytics features with realistic data

**Options** (edit script to customize):
- Number of weeks
- User selection
- Exercise variations
- Progression rates

---

### `npm run verify-test-data`
**Purpose**: Verify test data integrity  
**Command**: `node scripts/verify-test-data.js`

**What it checks**:
- Data consistency
- Foreign key relationships
- Required fields
- Data quality

**When to use**:
- After generating test data
- Validating migrations
- Debugging data issues

---

## Quick Reference Table

| Category | Command | Purpose | Use Case |
|----------|---------|---------|----------|
| **Start** | `npm run dev` | Start everything | Daily development start |
| **Validate** | `npm run dev:validate` | Check config | Before starting, after git pull |
| **Stop** | `npm run dev:down` | Stop services | End of day |
| **Clean** | `npm run dev:clean` | Full cleanup | Start fresh, fix issues |
| **Status** | `npm run dev:status` | Check services | See what's running |
| **Logs** | `npm run dev:logs` | All logs | Monitor everything |
| **Logs** | `npm run dev:logs:api` | API logs only | Debug API issues |
| **Logs** | `npm run dev:logs:mobile` | Mobile logs only | Debug proxy/frontend |
| **Shell** | `npm run dev:shell:db` | Database shell | Run SQL queries |
| **Restart** | `npm run dev:restart:api` | Restart API | After env changes |
| **Data** | `npm run generate-training-data` | Generate training data | Load testing, demos |

---

## Common Workflows

### Starting Fresh
```bash
npm run dev:validate     # Check configuration
npm run dev             # Start environment
```

### After Git Pull
```bash
npm run dev:validate     # Verify no breaking changes
npm run dev:down        # Stop current environment
npm run dev:build       # Rebuild with new code
npm run dev             # Start with updates
```

### Debugging API Issues
```bash
npm run dev:logs:api    # Watch API logs
# In another terminal:
npm run dev:shell:api   # Inspect API container
```

### Database Work
```bash
npm run dev:shell:db    # Open PostgreSQL shell
# Run queries
npm run db:migrate      # Apply migrations
npm run db:seed         # Add seed data
```

### Full Reset
```bash
npm run dev:clean       # Remove everything
npm run dev             # Start fresh
```

### Production Testing
```bash
npm run build           # Build production images
npm start               # Start production environment
# Test...
npm stop                # Stop production environment
```

---

## Troubleshooting Commands

### Service won't start
```bash
npm run dev:status      # Check status
npm run dev:logs:api    # Check specific service logs
npm run dev:validate    # Check configuration
```

### Proxy errors
```bash
npm run dev:validate                    # Check config
npm run dev:logs:mobile | grep Proxy   # Check proxy logs
npm run dev:restart:mobile             # Restart mobile
```

### Database issues
```bash
npm run dev:logs:db                    # Check database logs
npm run dev:shell:db                   # Connect to database
npm run dev:clean && npm run dev      # Nuclear option
```

### Performance issues
```bash
docker system df        # Check disk usage
npm run dev:clean      # Clean up
docker system prune -a # Full cleanup (careful!)
```

---

## Environment URLs

After running `npm run dev`, access services at:

- **Mobile PWA**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Admin Dashboard**: http://localhost:3002
- **API Health**: http://localhost:3001/health
- **Database**: localhost:5432 (user: rythm_api, db: rythm)

---

## Related Documentation

- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) - Quick reference card
- [UPDATED_DEV_SCRIPTS.md](../UPDATED_DEV_SCRIPTS.md) - Development scripts guide
- [docs/QUICK_START.md](./QUICK_START.md) - Quick start guide
- [docs/CONTAINER_FIRST_DEVELOPMENT.md](./CONTAINER_FIRST_DEVELOPMENT.md) - Container development guide

---

**Last Updated**: October 10, 2025  
**Version**: 1.1.0
