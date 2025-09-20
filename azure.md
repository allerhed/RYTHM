# RYTHM Azure Deployment Documentation

## Overview
This document contains all Azure URLs, configuration settings, and deployment information for the RYTHM application suite deployed to Azure Container Apps.

## 🌐 Production URLs

### **Live Applications**
- **Mobile App**: `https://rythm.training` - Main fitness tracking PWA for end users
- **Admin App**: `https://admin.rythm.training` - Administrative interface for system management

### **Azure Container Apps (Internal URLs)**
- **Mobile App**: `https://ca-mobile-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Admin App**: `https://ca-admin-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **API Backend**: `https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`

## Environment Information
- **Environment Name**: `rythm-prod`
- **Azure Region**: Sweden Central
- **Resource Group**: `rg-rythm-prod`
- **Deployment Date**: September 19, 2025

## Azure Resources

### Container Apps Environment
- **Name**: `cae-tvqklipuckq3a`
- **Location**: Sweden Central
- **Resource Group**: `rg-rythm-prod`

### Azure Container Registry
- **Registry Name**: `crtvqklipuckq3a.azurecr.io`
- **Login Server**: `crtvqklipuckq3a.azurecr.io`
- **Images**:
  - `crtvqklipuckq3a.azurecr.io/rythm-api:latest`
  - `crtvqklipuckq3a.azurecr.io/rythm-mobile:latest`
  - `crtvqklipuckq3a.azurecr.io/rythm-admin:latest`

### PostgreSQL Database
- **Server Name**: `psql-tvqklipuckq3a.postgres.database.azure.com`
- **Database Name**: `rythm`
- **Port**: `5432`
- **SSL Mode**: Disabled (for development)
- **Connection Timeout**: 10 seconds

## Application URLs

### API Application
- **Container App Name**: `ca-api-tvqklipuckq3a`
- **Public URL**: `https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Port**: `3001`
- **Health Check**: `GET /health`

#### API Endpoints
- Authentication: `/api/auth/*`
  - Login: `POST /api/auth/login`
  - Register: `POST /api/auth/register`
  - Profile: `GET /api/auth/profile`
  - Password Update: `PUT /api/auth/password`
  - Avatar Upload: `PUT /api/auth/avatar`
- Sets: `/api/sets/*`
- Sessions: `/api/sessions/*`
- Analytics: `/api/analytics/*`

### Mobile Application (PWA)
- **Container App Name**: `ca-mobile-tvqklipuckq3a`
- **Public URL**: `https://ca-mobile-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Port**: `3000`
- **Framework**: Next.js 14.2.32

#### Mobile App Routes
- Home: `/`
- Authentication: 
  - Login: `/auth/login`
  - Register: `/auth/register`
- Dashboard: `/dashboard`
- Profile: `/profile`
- Test Auth: `/test-auth`

### Admin Application
- **Container App Name**: `ca-admin-tvqklipuckq3a`
- **Public URL**: `https://ca-admin-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Port**: `3002`
- **Framework**: Next.js

## Environment Variables

### API Container (`ca-api-tvqklipuckq3a`)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://username:password@psql-tvqklipuckq3a.postgres.database.azure.com:5432/rythm
JWT_SECRET=<managed-secret>
CORS_ORIGIN=https://ca-mobile-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io
```

### Mobile Container (`ca-mobile-tvqklipuckq3a`)
```env
NODE_ENV=production
PORT=3000
API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io
NEXT_PUBLIC_API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io
```

### Admin Container (`ca-admin-tvqklipuckq3a`)
```env
NODE_ENV=production
PORT=3002
NEXT_PUBLIC_API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io
```

## Container Configuration

### Resource Allocation
All containers are configured with:
- **CPU**: 0.5 cores
- **Memory**: 1 GiB
- **Ephemeral Storage**: 2 GiB

### Scaling Configuration
- **Minimum Replicas**: 1
- **Maximum Replicas**: 3
- **Cooldown Period**: 300 seconds
- **Polling Interval**: 30 seconds

### Networking
- **Ingress**: External (public)
- **Transport**: Auto (HTTP/HTTPS)
- **Allow Insecure**: false
- **Target Ports**:
  - API: 3001
  - Mobile: 3000
  - Admin: 3002

## Security & Authentication

### Managed Identity
Each container app has a User Assigned Managed Identity:
- **Mobile Identity**: `id-mobile-tvqklipuckq3a`
  - Client ID: `5a8ec19b-59c6-499d-814f-1f1dc055703f`
  - Principal ID: `91fea43f-1d4f-4ea0-9a66-f9089d850c5c`

### Registry Authentication
- **Secret Reference**: `registry-password`
- **Username**: `crtvqklipuckq3a`

## Known Issues & Solutions

### Next.js Environment Variables
- **Issue**: `NEXT_PUBLIC_` environment variables must be available at build time
- **Solution**: Added `ENV NEXT_PUBLIC_API_URL` to Dockerfile before the build step

### CORS Configuration
The API is configured to allow requests from the mobile application domain:
- **Allowed Origin**: `https://ca-mobile-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Allowed Headers**: `Content-Type, Authorization, X-Requested-With`

### Admin Dashboard API Fix
- **Issue**: Admin app 500 errors due to missing database tables and incorrect schema relationships
- **Solution**: 
  - Created complete database schema with all required tables
  - Added `equipment_id` foreign key columns to `exercises` and `exercise_templates` tables
  - Added `branding` JSONB column to `tenants` table for organization customization
  - Populated equipment catalog with 15 default items
  - Fixed foreign key relationships for proper data analytics

### Database Extensions
- **Issue**: Azure PostgreSQL doesn't support `uuid-ossp` and `citext` extensions
- **Solution**: Use `gen_random_uuid()` instead of `uuid_generate_v4()` and `VARCHAR` instead of `CITEXT`

## Database Schema

### Essential Tables Created
Due to Azure PostgreSQL extension limitations, the following tables were manually created:

#### Core Tables
- **tenants**: Organization/tenant management (with branding JSONB column)
- **users**: User accounts with role-based access  
- **exercises**: Global exercise definitions (with equipment_id foreign key)
- **exercise_templates**: Exercise template library (with equipment_id foreign key)
- **sessions**: Workout sessions
- **sets**: Individual exercise sets within sessions
- **equipment**: Equipment catalog with categories (15 default items)
- **workout_templates**: Predefined workout templates

#### Custom Types
- **session_category**: ENUM ('strength', 'cardio', 'hybrid')
- **set_value_type**: ENUM ('weight_kg', 'distance_m', 'duration_s', 'calories', 'reps')
- **user_role**: ENUM ('athlete', 'coach', 'tenant_admin', 'org_admin', 'system_admin')
- **exercise_type**: ENUM ('STRENGTH', 'CARDIO')

### System Administrator Account
A system administrator account has been created with the following credentials:

**Email**: `orchestrator@rythm.training`  
**Password**: `Resolve@0`  
**Role**: `system_admin`  
**Tenant**: `RYTHM System Admin` (ID: `00000000-0000-0000-0000-000000000000`)

This account has full system administrator privileges and can be used to access both the mobile and admin applications.

## Deployment Commands

### Build and Push Images
```bash
# API
docker build -t crtvqklipuckq3a.azurecr.io/rythm-api:latest --platform linux/amd64 -f apps/api/Dockerfile .
docker push crtvqklipuckq3a.azurecr.io/rythm-api:latest

# Mobile
docker build -t crtvqklipuckq3a.azurecr.io/rythm-mobile:latest --platform linux/amd64 -f apps/mobile/Dockerfile .
docker push crtvqklipuckq3a.azurecr.io/rythm-mobile:latest

# Admin
docker build -t crtvqklipuckq3a.azurecr.io/rythm-admin:latest --platform linux/amd64 -f apps/admin/Dockerfile .
docker push crtvqklipuckq3a.azurecr.io/rythm-admin:latest
```

### Update Container Apps
```bash
# API
az containerapp update --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod --image crtvqklipuckq3a.azurecr.io/rythm-api:latest

# Mobile
az containerapp update --name ca-mobile-tvqklipuckq3a --resource-group rg-rythm-prod --image crtvqklipuckq3a.azurecr.io/rythm-mobile:latest

# Admin
az containerapp update --name ca-admin-tvqklipuckq3a --resource-group rg-rythm-prod --image crtvqklipuckq3a.azurecr.io/rythm-admin:latest
```

## Monitoring & Logs

### View Container Logs
```bash
# API logs
az containerapp logs show --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod --follow

# Mobile logs
az containerapp logs show --name ca-mobile-tvqklipuckq3a --resource-group rg-rythm-prod --follow

# Admin logs
az containerapp logs show --name ca-admin-tvqklipuckq3a --resource-group rg-rythm-prod --follow
```

### Health Checks
- **API Health**: `curl https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io/health`
- **Mobile App**: Direct browser access to the public URL
- **Admin App**: Direct browser access to the public URL

## Known Issues & Solutions

### Next.js Environment Variables
- **Issue**: `NEXT_PUBLIC_` environment variables must be available at build time
- **Solution**: Added `ENV NEXT_PUBLIC_API_URL` to Dockerfile before the build step

### Database Extensions
- **Issue**: Azure PostgreSQL doesn't support `uuid-ossp` and `citext` extensions
- **Solution**: Use `gen_random_uuid()` instead of `uuid_generate_v4()` and `VARCHAR` instead of `CITEXT`

### CORS Configuration
- **Issue**: Browser blocking cross-origin requests
- **Solution**: Configured API to explicitly allow the mobile app domain in CORS headers

## Revision History

### Latest Revisions (as of September 19, 2025)
- **API**: Latest stable revision
- **Mobile**: `ca-mobile-tvqklipuckq3a--1758276733` (with environment variable fixes)
- **Admin**: `ca-admin-tvqklipuckq3a--1758277444` (with authentication fixes)

## Contact & Support
- **Repository**: https://github.com/allerhed/RYTHM
- **Azure Subscription**: `5899f73d-9264-4a9a-aee7-037197501dfa`
- **Deployment Tool**: Azure Developer CLI (azd)