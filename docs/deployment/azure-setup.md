# RYTHM Application - Production Deployment Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Azure Resources](#azure-resources)
4. [Applications](#applications)
5. [Database](#database)
6. [Custom Domains](#custom-domains)
7. [Security & Authentication](#security--authentication)
8. [Monitoring & Logging](#monitoring--logging)
9. [Deployment Procedures](#deployment-procedures)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance](#maintenance)

---

## 🎯 Overview

**RYTHM** is a comprehensive fitness tracking application deployed on Microsoft Azure using Container Apps. The system consists of three main applications (API, Mobile Web App, Admin Dashboard) with a PostgreSQL database backend.

### Key Information
- **Production URLs:**
  - **Mobile App (Main)**: `https://rythm.training` - End-user fitness tracking PWA
  - **Admin Dashboard**: `https://admin.rythm.training` - System administration interface
  - **API Backend**: `https://api.rythm.training` - Backend API serving both applications
- **Deployment Date:** September 19, 2025
- **Azure Region:** Sweden Central
- **Subscription:** Visual Studio Enterprise Subscription (5899f73d-9264-4a9a-aee7-037197501dfa)

### Azure Container Apps URLs (Internal)
- **Mobile App**: `ca-mobile-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Admin App**: `ca-admin-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **API Backend**: `ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`

---

## 🏗️ Architecture

### High-Level Architecture
```
Internet
    ↓
Custom Domain (rythm.training)
    ↓
Azure Container Apps Environment
    ↓
┌─────────────┬─────────────┬─────────────┐
│   Mobile    │    API      │   Admin     │
│   Web App   │   Server    │ Dashboard   │
└─────────────┴─────────────┴─────────────┘
    ↓
PostgreSQL Flexible Server
    ↓
Exercise & Equipment Database
```

### Technology Stack
- **Frontend:** Next.js (TypeScript)
- **Backend:** Node.js with tRPC (TypeScript)
- **Database:** PostgreSQL 15
- **Container Platform:** Azure Container Apps
- **Container Registry:** Azure Container Registry
- **Monitoring:** Application Insights + Log Analytics
- **Security:** Azure Key Vault, Managed Identity

---

## ☁️ Azure Resources

### Resource Group: `rg-rythm-prod`
**Location:** Sweden Central

### Core Infrastructure

| Resource | Name | Type | Purpose |
|----------|------|------|---------|
| **Container Environment** | `cae-tvqklipuckq3a` | Microsoft.App/managedEnvironments | Hosts all container apps |
| **Container Registry** | `crtvqklipuckq3a` | Microsoft.ContainerRegistry/registries | Stores Docker images |
| **Key Vault** | `kv-tvqklipuckq3a` | Microsoft.KeyVault/vaults | Stores secrets and credentials |
| **Storage Account** | `sttvqklipuckq3a` | Microsoft.Storage/storageAccounts | File storage and logs |
| **Log Analytics** | `log-tvqklipuckq3a` | Microsoft.OperationalInsights/workspaces | Centralized logging |
| **Application Insights** | `appi-tvqklipuckq3a` | Microsoft.Insights/components | Application monitoring |

### Database
| Resource | Name | Type | Purpose |
|----------|------|------|---------|
| **PostgreSQL Server** | `psql-tvqklipuckq3a` | Microsoft.DBforPostgreSQL/flexibleServers | Primary database |
| **Database Name** | `rythm` | Database | Application data storage |

### Container Applications
| Resource | Name | Purpose | External URL |
|----------|------|---------|-------------|
| **API Service** | `ca-api-tvqklipuckq3a` | Backend API server | Internal only |
| **Mobile App** | `ca-mobile-tvqklipuckq3a` | User-facing web application | https://rythm.training |
| **Admin Dashboard** | `ca-admin-tvqklipuckq3a` | Administrative interface | https://admin.rythm.training |

### Managed Identities
| Resource | Name | Purpose |
|----------|------|---------|
| **API Identity** | `id-api-tvqklipuckq3a` | API service authentication |
| **Mobile Identity** | `id-mobile-tvqklipuckq3a` | Mobile app authentication |
| **Admin Identity** | `id-admin-tvqklipuckq3a` | Admin app authentication |

---

## 🚀 Applications

### 1. API Service (`ca-api-tvqklipuckq3a`)
- **Framework:** Node.js with tRPC
- **Port:** 3001
- **Image:** `crtvqklipuckq3a.azurecr.io/rythm-api:latest`
- **Purpose:** Backend API serving all data operations
- **Key Features:**
  - User authentication & authorization
  - Exercise and equipment management
  - Workout session tracking
  - Analytics and reporting APIs
  - Admin functionality

### 2. Mobile Web App (`ca-mobile-tvqklipuckq3a`)
- **Framework:** Next.js (TypeScript)
- **Port:** 3000
- **Image:** `crtvqklipuckq3a.azurecr.io/rythm-mobile:latest`
- **Domain:** https://rythm.training
- **Purpose:** User-facing fitness tracking application
- **Key Features:**
  - User registration and login
  - Workout creation and tracking
  - Exercise library browsing
  - Progress analytics
  - Profile management

### 3. Admin Dashboard (`ca-admin-tvqklipuckq3a`)
- **Framework:** Next.js (TypeScript)
- **Port:** 3000
- **Image:** `crtvqklipuckq3a.azurecr.io/rythm-admin:latest`
- **Domain:** https://admin.rythm.training
- **Purpose:** Administrative interface for system management
- **Key Features:**
  - User management
  - System analytics
  - Equipment management
  - Exercise template management
  - System monitoring

---

## 💾 Database

### PostgreSQL Flexible Server (`psql-tvqklipuckq3a`)
- **Version:** PostgreSQL 15
- **Location:** Sweden Central
- **Database Name:** `rythm`
- **Admin User:** `rythm_admin`
- **Connection:** `psql-tvqklipuckq3a.postgres.database.azure.com:5432`

### Database Schema

#### Core Tables
| Table | Purpose | Key Relations |
|-------|---------|---------------|
| **tenants** | Multi-tenancy support | Parent to users, exercises |
| **users** | User accounts | References tenants |
| **equipment** | Exercise equipment library | Referenced by exercises |
| **exercise_templates** | Global exercise library | References equipment |
| **exercises** | Tenant-specific exercises | References tenants, equipment |
| **sessions** | Workout sessions | References users |
| **sets** | Individual exercise sets | References sessions, exercises |
| **workout_templates** | Predefined workout plans | References tenants |

#### Data Summary (Production)
- **Equipment Items:** 53 pieces across 6 categories
  - Free Weights: 6 items
  - Machines: 12 items
  - Cardio: 9 items
  - Bodyweight: 8 items
  - Resistance: 4 items
  - Other: 14 items

- **Exercise Templates:** 98 exercises
  - Strength Training: 68 exercises
  - Cardio Training: 30 exercises

### Database Connection Details
```bash
# Connection via Azure CLI
PGPASSWORD="$(az keyvault secret show --vault-name kv-tvqklipuckq3a --name postgres-password --query value -o tsv)" \
psql -h psql-tvqklipuckq3a.postgres.database.azure.com -U rythm_admin -d rythm
```

---

## 🌐 Custom Domains

### SSL Certificates (Auto-Managed)
| Domain | Certificate | Status | Binding |
|--------|-------------|--------|---------|
| **rythm.training** | `mc-cae-tvqklipuck-rythm-training-2002` | ✅ Active | Mobile App |
| **admin.rythm.training** | `mc-cae-tvqklipuck-admin-rythm-trai-2758` | ✅ Active | Admin Dashboard |

### DNS Configuration
#### Required DNS Records for rythm.training:
```dns
Type: A
Host: @
Value: 135.116.180.27

Type: TXT  
Host: asuid
Value: 5E8E9E4CF55A7645D02D12FA6815374B3BA938F9968F2A9E77BF186DC63F6C6B

Type: CNAME
Host: admin
Value: ca-admin-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io

Type: TXT
Host: asuid.admin
Value: 5E8E9E4CF55A7645D02D12FA6815374B3BA938F9968F2A9E77BF186DC63F6C6B
```

---

## 🔐 Security & Authentication

### Key Vault Secrets (`kv-tvqklipuckq3a`)
| Secret Name | Purpose |
|-------------|---------|
| `postgres-password` | PostgreSQL admin password |

### Environment Variables
#### API Service:
```env
NODE_ENV=production
DATABASE_URL=postgresql://rythm_admin:[PASSWORD]@psql-tvqklipuckq3a.postgres.database.azure.com:5432/rythm
PORT=3001
```

#### Mobile App:
```env
NODE_ENV=production
PORT=3000
API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io
NEXT_PUBLIC_API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io
```

#### Admin Dashboard:
```env
NODE_ENV=production
PORT=3000
API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io
NEXT_PUBLIC_API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io
```

### CORS Configuration
The API is configured to accept requests from:
- `https://rythm.training`
- `https://admin.rythm.training`

---

## 📊 Monitoring & Logging

### Application Insights (`appi-tvqklipuckq3a`)
- **Automatic instrumentation** for all container apps
- **Performance monitoring** and dependency tracking
- **Exception tracking** and error alerting
- **Custom telemetry** for business metrics

### Log Analytics Workspace (`log-tvqklipuckq3a`)
- **Centralized logging** from all services
- **Query capabilities** with KQL (Kusto Query Language)
- **Alert rules** for critical issues
- **Retention period** as per subscription settings

### Smart Detection
- **Anomaly detection** for performance issues
- **Failure anomaly detection** for error rates
- **Memory leak detection** for container apps

---

## 🚢 Deployment Procedures

### Prerequisites
```bash
# Ensure Azure CLI is authenticated
az login
az account set --subscription "5899f73d-9264-4a9a-aee7-037197501dfa"

# Ensure Docker is running
docker --version

# Login to Container Registry
az acr login --name crtvqklipuckq3a
```

### Full Deployment Process

#### 1. Build and Push Images
```bash
# From project root directory
cd /Users/lars-olofallerhed/Code/Azure/RYTHM

# Build API
docker build --platform linux/amd64 -f apps/api/Dockerfile -t rythm-api:latest .
docker tag rythm-api:latest crtvqklipuckq3a.azurecr.io/rythm-api:latest
docker push crtvqklipuckq3a.azurecr.io/rythm-api:latest

# Build Mobile App
docker build --platform linux/amd64 -f apps/mobile/Dockerfile -t rythm-mobile:latest .
docker tag rythm-mobile:latest crtvqklipuckq3a.azurecr.io/rythm-mobile:latest
docker push crtvqklipuckq3a.azurecr.io/rythm-mobile:latest

# Build Admin Dashboard (if separate)
# Similar process for admin app
```

#### 2. Update Container Apps
```bash
# Update API
az containerapp update \
  --name ca-api-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --image crtvqklipuckq3a.azurecr.io/rythm-api:latest

# Update Mobile App
az containerapp update \
  --name ca-mobile-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --image crtvqklipuckq3a.azurecr.io/rythm-mobile:latest

# Update Admin Dashboard
az containerapp update \
  --name ca-admin-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --image crtvqklipuckq3a.azurecr.io/rythm-admin:latest
```

#### 3. Database Migrations
```bash
# Run database migrations (if needed)
PGPASSWORD="$(az keyvault secret show --vault-name kv-tvqklipuckq3a --name postgres-password --query value -o tsv)" \
psql -h psql-tvqklipuckq3a.postgres.database.azure.com -U rythm_admin -d rythm -f migration_file.sql
```

### Environment Variable Updates
```bash
# Update environment variables for a container app
az containerapp update \
  --name ca-mobile-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --set-env-vars "NEW_VAR=value" "EXISTING_VAR=new_value"
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Not Loading
**Symptoms:** 502/503 errors, app not responding
**Checks:**
```bash
# Check container app status
az containerapp show --name ca-mobile-tvqklipuckq3a --resource-group rg-rythm-prod --query "properties.runningStatus"

# Check recent logs
az containerapp logs show --name ca-mobile-tvqklipuckq3a --resource-group rg-rythm-prod --tail 50
```

#### 2. Database Connection Issues
**Symptoms:** API errors, database timeouts
**Checks:**
```bash
# Test database connectivity
PGPASSWORD="$(az keyvault secret show --vault-name kv-tvqklipuckq3a --name postgres-password --query value -o tsv)" \
psql -h psql-tvqklipuckq3a.postgres.database.azure.com -U rythm_admin -d rythm -c "SELECT 1;"

# Check database server status
az postgres flexible-server show --resource-group rg-rythm-prod --name psql-tvqklipuckq3a --query "state"
```

#### 3. SSL Certificate Issues
**Symptoms:** HTTPS errors, certificate warnings
**Checks:**
```bash
# Check certificate status
az containerapp hostname list --resource-group rg-rythm-prod --name ca-mobile-tvqklipuckq3a

# Verify DNS records
nslookup rythm.training
```

#### 4. CORS Issues
**Symptoms:** Browser console errors about blocked requests
**Solution:** Verify API CORS configuration allows requests from custom domains

### Log Analysis
```bash
# View application logs
az containerapp logs show \
  --name ca-api-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --tail 100 \
  --follow

# Query logs with filters
az monitor log-analytics query \
  --workspace log-tvqklipuckq3a \
  --analytics-query "ContainerAppConsoleLogs_CL | where ContainerAppName_s == 'ca-api-tvqklipuckq3a' | order by TimeGenerated desc | limit 100"
```

---

## 🔄 Maintenance

### Regular Maintenance Tasks

#### Weekly
- [ ] Review Application Insights for performance issues
- [ ] Check error rates and response times
- [ ] Verify SSL certificate status
- [ ] Review resource utilization

#### Monthly
- [ ] Update container images with latest security patches
- [ ] Review and clean up old container revisions
- [ ] Backup database (if not automated)
- [ ] Review access logs and security events

#### Quarterly
- [ ] Review and update documentation
- [ ] Security assessment and penetration testing
- [ ] Disaster recovery testing
- [ ] Performance optimization review

### Scaling Operations
```bash
# Scale a container app
az containerapp update \
  --name ca-api-tvqklipuckq3a \
  --resource-group rg-rythm-prod \
  --min-replicas 2 \
  --max-replicas 10
```

### Backup Procedures
```bash
# Database backup
PGPASSWORD="$(az keyvault secret show --vault-name kv-tvqklipuckq3a --name postgres-password --query value -o tsv)" \
pg_dump -h psql-tvqklipuckq3a.postgres.database.azure.com -U rythm_admin -d rythm > backup_$(date +%Y%m%d).sql
```

---

## 📞 Support Contacts

### Azure Account Information
- **Subscription:** Visual Studio Enterprise Subscription
- **Account Owner:** lars-olof@allerhed.com
- **Tenant:** larsolofallerhed.onmicrosoft.com

### Key URLs
- **Azure Portal:** https://portal.azure.com
- **Application Insights:** https://portal.azure.com/#@larsolofallerhed.onmicrosoft.com/resource/subscriptions/5899f73d-9264-4a9a-aee7-037197501dfa/resourceGroups/rg-rythm-prod/providers/microsoft.insights/components/appi-tvqklipuckq3a/overview
- **Log Analytics:** https://portal.azure.com/#@larsolofallerhed.onmicrosoft.com/resource/subscriptions/5899f73d-9264-4a9a-aee7-037197501dfa/resourceGroups/rg-rythm-prod/providers/Microsoft.OperationalInsights/workspaces/log-tvqklipuckq3a/overview

---

## 📝 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-09-19 | 1.0 | Initial production deployment | Lars-Olof Allerhed |
| 2025-09-19 | 1.1 | Custom domain configuration | Lars-Olof Allerhed |
| 2025-09-19 | 1.2 | Database population with exercises | Lars-Olof Allerhed |

---

## 🔍 Quick Reference

### Essential Commands
```bash
# Check application status
az containerapp list --resource-group rg-rythm-prod --query "[].{Name:name,Status:properties.runningStatus}" --output table

# View recent logs
az containerapp logs show --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod --tail 20

# Connect to database
PGPASSWORD="$(az keyvault secret show --vault-name kv-tvqklipuckq3a --name postgres-password --query value -o tsv)" psql -h psql-tvqklipuckq3a.postgres.database.azure.com -U rythm_admin -d rythm

# Test applications
curl -I https://rythm.training
curl -I https://admin.rythm.training
```

### Important File Locations
- **Project Root:** `/Users/lars-olofallerhed/Code/Azure/RYTHM`
- **Data Loading Script:** `/Users/lars-olofallerhed/Code/Azure/RYTHM/load_production_data.sql`
- **Exercise Templates:** `/Users/lars-olofallerhed/Code/Azure/RYTHM/exercise_templates_master.sql`

---

*Document Version: 1.0 | Last Updated: September 19, 2025 | Status: Production Ready ✅*