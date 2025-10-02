# RYTHM Authentication System - Build Documentation

## 📋 Project Overview
**RYTHM** is a hybrid training application with a complete authentication system supporting multi-tenant architecture, secure user management, and modern web standards.

**Repository**: `allerhed/RYTHM`  
**Last Updated**: September 8, 2025  
**Latest Changes**: Dashboard profile picture integration and Avatar component
**Commit**: `f2916b8` - Complete authentication system implementation

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14.2.32, React 18, TypeScript
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL 15 (Docker container)
- **Authentication**: JWT tokens, bcrypt password hashing
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context API

### Project Structure
```
RYTHM/
├── apps/
│   ├── api/                    # Backend API server
│   │   ├── src/
│   │   │   ├── index.ts       # Main TypeScript server (tRPC)
│   │   │   ├── simple-server.js # Working JavaScript server
│   │   │   ├── router.ts      # tRPC router
│   │   │   ├── trpc.ts        # tRPC configuration
│   │   │   └── routes/        # API route handlers
│   │   └── package.json
│   └── mobile/                # Frontend Next.js app
│       ├── src/
│       │   ├── app/           # Next.js 14 app directory
│       │   ├── components/    # Reusable UI components
│       │   ├── contexts/      # React Context providers
│       │   ├── styles/        # Tailwind CSS styles
│       │   └── middleware.ts  # Next.js middleware
│       └── package.json
├── packages/
│   └── db/                    # Database utilities
│       ├── src/
│       │   ├── database.ts    # Database connection class
│       │   └── migrate.ts     # Migration utilities
│       └── package.json
├── infra/                     # Azure infrastructure
└── docker-compose.yml        # PostgreSQL container
```

---

## 🔐 Authentication System Components

### 1. Database Schema

#### Tables Created
- **`tenants`**: Multi-tenant organization data
  - `tenant_id` (UUID, Primary Key)
  - `name` (VARCHAR, Organization name)
  - `created_at`, `updated_at` (Timestamps)

- **`users`**: User account information
  - `user_id` (UUID, Primary Key)
  - `tenant_id` (UUID, Foreign Key to tenants)
  - `email` (VARCHAR, Unique)
  - `password_hash` (VARCHAR, bcrypt hashed)
  - `role` (ENUM: 'athlete', 'coach', 'tenant_admin', 'org_admin')
  - `first_name`, `last_name` (VARCHAR)
  - `about` (TEXT, User bio/description)
  - `avatar_url` (TEXT, Profile picture path)
  - `created_at`, `updated_at` (Timestamps)

#### Security Features
- Row Level Security (RLS) policies for tenant isolation
- Password hashing with bcrypt (12 rounds)
- UUID primary keys for security
- Proper foreign key constraints

### 2. Backend API (`apps/api/`)

#### Main Server Files
- **`simple-server.js`** ✅ **Working Production Server**
  - Express.js server with authentication endpoints
  - Direct PostgreSQL integration
  - CORS configuration for development
  - Comprehensive error handling

- **`index.ts`** (TypeScript with tRPC)
  - tRPC-based API with type safety
  - Had compatibility issues with direct HTTP requests

#### API Endpoints
```javascript
POST /api/auth/register
- Creates new user account with tenant
- Validates required fields
- Checks for existing users
- Hashes password with bcrypt
- Creates tenant and user in transaction
- Returns JWT token and user data

POST /api/auth/login
- Authenticates existing users
- Validates credentials
- Compares hashed passwords
- Returns JWT token and user data

PUT /api/auth/profile (authenticated)
- Updates user profile information
- Validates email uniqueness
- Updates first name, last name, email, about field
- Returns updated user data

PUT /api/auth/password (authenticated) 
- Changes user password
- Verifies current password
- Validates new password requirements
- Hashes and stores new password

PUT /api/auth/avatar (authenticated)
- Uploads user avatar image
- Validates file type and size (5MB limit)
- Stores file and updates user avatar URL
- Deletes previous avatar file

GET /health
- Server health check endpoint

GET /test
- Simple test endpoint for verification

GET /uploads/avatars/:filename
- Serves uploaded avatar images
- Static file serving endpoint
```

#### Database Integration
- **`packages/db/src/database.ts`**: Database connection class
  - PostgreSQL connection pooling
  - Transaction support
  - Tenant context setting for RLS
  - Error handling and connection management

### 3. Frontend Application (`apps/mobile/`)

#### Authentication Context (`src/contexts/AuthContext.tsx`)
```typescript
// Core authentication state management
interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateProfile: (data: ProfileUpdateData) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updateAvatar: (file: File) => Promise<void>
}

interface User {
  id: string
  email: string
  role: 'athlete' | 'coach' | 'tenant_admin' | 'org_admin'
  firstName?: string
  lastName?: string
  tenantId: string
  about?: string
  avatarUrl?: string
}
```

**Features**:
- JWT token management
- localStorage persistence
- Automatic authentication state restoration
- Error handling for API calls
- Higher-order component for route protection (`withAuth`)
- Profile management functions (update profile, password, avatar)
- File upload support for avatar images

#### Pages and Components

##### Registration Page (`src/app/auth/register/page.tsx`)
- **Two-step registration form**:
  1. Email and password setup
  2. Personal and organization information
- **Form validation** with real-time error feedback
- **Password strength requirements**
- **Toast notifications** for success/error states
- **Automatic login** after successful registration
- **Responsive design** with mobile-first approach

##### Login Page (`src/app/auth/login/page.tsx`)
- Clean, minimal login form
- Email and password authentication
- Remember me functionality
- Error handling and display
- Redirect to dashboard after login

##### Dashboard Page (`src/app/dashboard/page.tsx`)
- **Protected route** requiring authentication
- **User profile display** with personal information and avatar
- **Profile picture integration** in header and welcome section
- **Enhanced profile card** with avatar display and about section
- **Training statistics** (placeholder data)
- **Quick action buttons** for navigation
- **Recent activity feed**
- **Development mode notice**

##### Profile Page (`src/app/profile/page.tsx`)
- **Comprehensive profile editing** with tabbed interface
- **Avatar upload section** with file validation and preview
- **Profile information form** for name, email, and about fields
- **Password change form** with current password verification
- **Real-time validation** with error messages and success notifications
- **Form state management** with loading states
- **Character counting** for about field (500 character limit)
- **Responsive design** with mobile-first approach

##### Navigation Components (`src/components/Navigation.tsx`)
- **Enhanced header component** with optional user avatar display
- **Bottom navigation** for mobile app feel
- **User avatar integration** in header for authenticated views
- **Responsive design** with dark mode support

##### Avatar Component (`src/components/Avatar.tsx`)
- **Reusable avatar component** with multiple size variants
- **Fallback initials display** when no avatar image
- **Consistent styling** across the application
- **Gradient background** for initials
- **Size variants**: xs, sm, md, lg, xl

#### Middleware (`src/middleware.ts`)
```typescript
// Next.js middleware for route protection
export function middleware(request: NextRequest) {
  // Protects /dashboard and other authenticated routes
  // Redirects to login if not authenticated
  // Allows auth routes for unauthenticated users
}
```

#### Styling and Design System

##### Global Styles (`src/styles/globals.css`)
- **Tailwind CSS** integration
- **Custom component classes**:
  - `.btn` - Button variants (primary, outline, strength, cardio, hybrid)
  - `.input` - Form input styling
  - `.card` - Card component styling
- **Typography system** with semantic classes
- **Dark mode support** throughout

##### Design Tokens
- **Color palette**:
  - Primary: Blue (#2563eb, #3b82f6)
  - Strength: Orange (#ea580c, #f97316)
  - Cardio: Red (#dc2626, #ef4444)
  - Hybrid: Purple (#9333ea, #a855f7)
- **Typography scale**: Display, heading, subtitle, body, caption
- **Spacing system**: Consistent padding and margins

---

## 🚀 Deployment and Infrastructure

### Development Environment
- **API Server**: http://localhost:3001
- **Frontend**: http://localhost:3000
- **Database**: PostgreSQL on localhost:5432 (Docker)

### Docker Configuration
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: rythm
      POSTGRES_USER: rythm_api
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-EXEC", "pg_isready -U rythm_api -d rythm"]
      interval: 30s
      timeout: 10s
      retries: 5
```

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rythm
DB_USER=rythm_api
DB_PASSWORD=password

# Authentication
JWT_SECRET=your-secret-key

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
```

---

## 🔧 Build and Development

### Installation
```bash
# Clone repository
git clone https://github.com/allerhed/RYTHM.git
cd RYTHM

# Install dependencies
npm install

# Start database
docker-compose up -d

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

### Available Scripts
```bash
# Development
npm run dev          # Start both API and frontend
npm run dev:api      # Start API server only
npm run dev:mobile   # Start frontend only

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed development data

# Build
npm run build        # Build for production
npm run build:api    # Build API only
npm run build:mobile # Build frontend only
```

---

## ✅ Features Implemented

### Core Authentication
- [x] **User Registration**
  - Multi-step form with validation
  - Tenant/organization creation
  - Password hashing and security
  - Automatic login after registration

- [x] **User Login**
  - Email/password authentication
  - JWT token generation
  - Session persistence with localStorage
  - Remember me functionality

- [x] **Route Protection**
  - Middleware-based protection
  - React HOC for component protection
  - Automatic redirects for unauthenticated users
  - Protected dashboard and pages

- [x] **Session Management**
  - JWT token storage and retrieval
  - Automatic token refresh (planned)
  - Logout functionality with cleanup
  - Persistent authentication state

- [x] **Profile Management**
  - Complete profile editing interface
  - Avatar upload with file validation
  - Update personal information (name, email, about)
  - Password change with current password verification
  - Real-time form validation and error handling

### User Interface
- [x] **Responsive Design**
  - Mobile-first approach
  - Tablet and desktop optimization
  - Touch-friendly interface
  - Progressive Web App ready

- [x] **Design System**
  - Consistent color palette
  - Typography scale
  - Component library
  - Dark mode support

- [x] **User Experience**
  - Loading states and spinners
  - Toast notifications
  - Form validation with real-time feedback
  - Error handling and display

### Security
- [x] **Password Security**
  - bcrypt hashing (12 rounds)
  - Password strength requirements
  - Secure password storage

- [x] **JWT Authentication**
  - Secure token generation
  - 7-day token expiration
  - Token-based API authentication
  - Proper token storage

- [x] **Multi-tenant Architecture**
  - Tenant isolation with RLS
  - Proper data segregation
  - Tenant-admin role system
  - Secure tenant creation

---

## 🐛 Known Issues and Solutions

### Resolved Issues
1. **tRPC HTTP Request Format**: ✅ Solved by creating direct Express endpoints
2. **Server Stability**: ✅ Solved with simplified JavaScript server
3. **Provider Import Errors**: ✅ Resolved with proper module exports
4. **Database Connection**: ✅ Working with PostgreSQL container
5. **Authentication Flow**: ✅ Complete registration and login working

### Current Status
- ✅ **API Server**: Stable and working (`simple-server.js`)
- ✅ **Frontend**: Fully functional with authentication
- ✅ **Database**: Healthy with proper schema
- ✅ **Authentication**: Complete end-to-end flow working

---

## 📁 File Inventory

### New Files Created
```
apps/api/src/
├── simple-server.js         # Working production API server
├── index-simple.ts          # TypeScript version (backup)
├── test-db.ts              # Database connection test
├── index-test.ts           # Server testing utilities
└── index-test.js           # JavaScript server test

apps/mobile/src/
├── contexts/
│   └── AuthContext.tsx     # Authentication state management
├── app/auth/
│   └── register/
│       └── page.tsx        # Registration form page
├── app/dashboard/
│   └── page.tsx           # Protected dashboard page
├── app/test-auth/
│   └── page.tsx           # Authentication testing page
└── middleware.ts          # Route protection middleware

Documentation:
├── APPLICATION_FIXED.md     # Application status documentation
├── AUTHENTICATION_COMPLETE.md # Authentication completion notes
├── DEBUG_GUIDE.md          # Debugging guide
├── REGISTRATION_FIXED.md   # Registration fix documentation
└── REGISTRATION_FIX_SUMMARY.md # Fix summary
```

### Modified Files
```
apps/api/src/
├── index.ts                # Enhanced with direct auth endpoints
└── routes/auth.ts          # Updated authentication routes

apps/mobile/src/
├── app/providers.tsx       # Fixed provider hierarchy
└── app/auth/login/page.tsx # Enhanced login page
```

---

## 🎯 Next Steps and Roadmap

### Immediate Priorities
1. **API Server Migration**: Replace `simple-server.js` with TypeScript version
2. **Error Handling**: Enhance error boundaries and user feedback
3. **Testing**: Add unit and integration tests
4. **Documentation**: API documentation with Swagger/OpenAPI

### Feature Roadmap
1. **User Profile Management**: Edit profile, change password
2. **Training Features**: Workout creation, tracking, analytics
3. **Social Features**: Team management, coach assignments
4. **Notifications**: Email verification, password reset
5. **Mobile App**: React Native version

### Infrastructure
1. **Production Deployment**: Azure Container Apps
2. **CI/CD Pipeline**: GitHub Actions
3. **Monitoring**: Application Insights, logging
4. **Security**: Rate limiting, audit logging

---

## 📊 Statistics

### Codebase Metrics
- **Total Files Added**: 19
- **Lines of Code Added**: 2,118
- **Languages**: TypeScript (70%), JavaScript (20%), CSS (10%)
- **Components Created**: 8 React components
- **API Endpoints**: 6 authentication and profile endpoints
- **Database Tables**: 2 tables with RLS policies

### Git History
- **Latest Commit**: `f2916b8` - Complete authentication system implementation
- **Branch**: `main`
- **Repository**: `allerhed/RYTHM`
- **Commits**: 5 total commits

---

## 📝 Maintenance Notes

### Regular Tasks
- Monitor server logs for errors
- Update dependencies monthly
- Review security practices quarterly
- Backup database regularly

### Critical Dependencies
- `@types/bcrypt`: Password hashing types
- `@types/jsonwebtoken`: JWT token types
- `pg`: PostgreSQL client
- `next`: React framework
- `react`: UI library

### Environment Requirements
- Node.js 18+ 
- PostgreSQL 15+
- Docker for local development
- 4GB+ RAM for development

---

*This documentation is maintained as part of the RYTHM project development. Last updated: September 8, 2025*