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
- **Production URL**: `https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`
- **Purpose**: Backend API serving both mobile and admin apps

## 🔧 Environment Configuration

### **Mobile App Environment Variables**
```bash
# Production
NEXT_PUBLIC_API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io

# Development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### **Admin App Environment Variables**
```bash
# Production
NEXT_PUBLIC_API_URL=https://ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io

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
           │  ca-api-tvqklipuck  │
           │   ...azurecontainer │
           │       apps.io       │
           └─────────────────────┘
```

## 🔒 SSL Certificates

Both custom domains are secured with SSL certificates managed by Azure Container Apps:
- `rythm.training` - Mobile app SSL certificate
- `admin.rythm.training` - Admin app SSL certificate

## 🚀 Deployment Information

- **Resource Group**: `rg-rythm-prod`
- **Azure Region**: Sweden Central
- **Container Environment**: `cae-tvqklipuckq3a`
- **Deployment Method**: GitHub Actions CI/CD

## 📝 Access Information

### **Mobile App Users**
- Access via: `https://rythm.training`
- Purpose: Workout tracking, exercise logging, analytics

### **Admin Users**  
- Access via: `https://admin.rythm.training`
- Purpose: User management, system administration, analytics

### **API Access**
- Internal use only
- Accessed by mobile and admin apps via environment variables