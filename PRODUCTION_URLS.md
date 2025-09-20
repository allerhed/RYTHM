# RYTHM Production URLs

## 🌐 Production Application URLs

### **Mobile App (PWA)**
- **Production URL**: `https://rythm.training`
- **Azure Container App**: `ca-mobile-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Custom Domain**: Configured with SSL certificate
- **Purpose**: End-user fitness tracking application

### **Admin App**
- **Production URL**: `https://admin.rythm.training`
- **Azure Container App**: `ca-admin-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Custom Domain**: Configured with SSL certificate
- **Purpose**: Administrative interface for system management

### **API Backend**
- **Production URL**: `https://api.rythm.training`
- **Azure Container App**: `ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Custom Domain**: Configured with SSL certificate
- **Purpose**: Backend API serving both mobile and admin apps

## 🔧 Environment Configuration

### **Mobile App Environment Variables**
```bash
# Production
NEXT_PUBLIC_API_URL=https://api.rythm.training

# Development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### **Admin App Environment Variables**
```bash
# Production
NEXT_PUBLIC_API_URL=https://api.rythm.training

# Development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📊 Application Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│   Mobile App        │    │   Admin App         │
│   rythm.training    │    │ admin.rythm.training│
└──────────┬──────────┘    └──────────┬──────────┘
           │                          │
           └──────────┬─────────────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │     API Backend     │
           │  api.rythm.training │
           └─────────────────────┘
```
           ┌─────────────────────┐
           │     API Backend     │
           │  ca-api-tvqklipuck  │
           │   ...azurecontainer │
           │       apps.io       │
           └─────────────────────┘
```

## 🔒 SSL Certificates

All custom domains are secured with SSL certificates managed by Azure Container Apps:
- `rythm.training` - Mobile app SSL certificate
- `admin.rythm.training` - Admin app SSL certificate  
- `api.rythm.training` - API SSL certificate

## 🚀 Deployment Information

- **Resource Group**: `rg-rythm-prod`
- **Azure Region**: Sweden Central
- **Container Environment**: `cae-tvqklipuckq3a`
- **Deployment Method**: GitHub Actions CI/CD + Direct ACR builds

## 📝 Access Information

### **End Users**
- Access via: `https://rythm.training`
- Purpose: Workout tracking, exercise logging, analytics

### **Admin Users**  
- Access via: `https://admin.rythm.training`
- Purpose: User management, system administration, analytics

### **API Access**
- Production URL: `https://api.rythm.training`
- Used by: Mobile and admin apps via environment variables
- Authentication: JWT tokens

## 🛠️ Direct Build Scripts

For faster development and troubleshooting:

```bash
# Build and deploy API only (fastest)
./scripts/build-api-direct.sh

# Build and deploy mobile app
./scripts/build-mobile-direct.sh

# Build and deploy admin app  
./scripts/build-admin-direct.sh

# Build and deploy all apps
./scripts/build-all-direct.sh
```

## 📊 Complete URL Reference

| **Component** | **Production URL** | **Azure Container Apps URL** | **Purpose** |
|---------------|-------------------|------------------------------|-------------|
| **Mobile App** | `https://rythm.training` | `ca-mobile-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io` | End-user PWA |
| **Admin App** | `https://admin.rythm.training` | `ca-admin-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io` | Admin interface |
| **API Backend** | `https://api.rythm.training` | `ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io` | Backend services |

## 🔧 Environment Variables

All applications use the clean production URLs:

```bash
# Production environment
NEXT_PUBLIC_API_URL=https://api.rythm.training

# Development environment  
NEXT_PUBLIC_API_URL=http://localhost:3001
```