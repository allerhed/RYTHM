# Avatar Persistence — Quick Reference

## The Problem
Profile pictures were lost after every deployment because they were stored in the container's ephemeral filesystem.

## The Solution
Store profile pictures as base64-encoded data in the PostgreSQL database.

---

## What Changed

### Database
- Added `users.avatar_data TEXT` column for base64 image data
- Added `users.avatar_content_type TEXT` column for MIME type
- Migration: `packages/db/migrations/017_add_avatar_data_column.sql`

### API Endpoints

**PUT /api/auth/avatar** (updated)
- Now converts uploaded file to base64
- Stores in database instead of filesystem
- Cleans up temporary files
- Returns: `avatarUrl: "/api/auth/avatar/:userId"`

**GET /api/auth/avatar/:userId** (new)
- Retrieves avatar from database
- Converts base64 back to image buffer
- Sets proper content-type and cache headers
- Returns image data directly

### Profile Endpoints (updated)
All endpoints now return database-served avatar URLs:
- POST /api/auth/register
- POST /api/auth/login  
- GET /api/auth/profile
- PUT /api/auth/profile

---

## Deployment Steps

### Local Development
```bash
# Start containers
./scripts/start.sh

# Apply migration
./scripts/apply-avatar-migration.sh

# Verify
docker exec rythm-db-1 psql -U rythm_api -d rythm -c "\d users"
```

### Production (Azure Container Apps)
Migration runs automatically on deployment. Users will need to re-upload profile pictures.

---

## Frontend Impact
**None** — The Avatar component already handles API URLs correctly.

---

## Benefits
✅ Profile pictures persist across deployments  
✅ No external dependencies (blob storage)  
✅ Automatic backups with database  
✅ Zero frontend changes required  
✅ Backward compatible

---

## Files Modified
- `packages/db/migrations/017_add_avatar_data_column.sql`
- `apps/api/src/index.ts` (avatar upload/retrieval)
- `scripts/apply-avatar-migration.sh` (new)
- `docs/fixes/AVATAR_PERSISTENCE_FIX.md` (new)

---

## Testing
```bash
# Upload avatar
curl -X PUT http://localhost:3001/api/auth/avatar \
  -H "Authorization: Bearer TOKEN" \
  -F "avatar=@test.jpg"

# Retrieve avatar
curl http://localhost:3001/api/auth/avatar/USER_ID -o test-download.jpg

# Verify
diff test.jpg test-download.jpg
```

---

**Status**: Ready for deployment  
**Migration**: Idempotent, safe to run multiple times  
**Rollback**: Simple git revert, but avatar data will be lost
