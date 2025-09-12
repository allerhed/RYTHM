# RYTHM Admin Interface

A comprehensive administrative dashboard for managing the RYTHM fitness platform.

## Overview

The RYTHM Admin interface provides system administrators with the tools needed to manage users, tenants, workouts, and system health across the entire platform.

## Features

- **Dashboard**: Real-time system statistics and health monitoring
- **User Management**: View and manage user accounts across all tenants
- **Tenant Management**: Manage fitness studios and organizations
- **System Monitoring**: Track system health, performance metrics, and activity logs
- **Authentication**: Secure admin-only access with JWT-based authentication

## Getting Started

### Development

1. **Start the development environment:**
   ```bash
   npm run dev
   ```

2. **Access the admin interface:**
   - URL: http://localhost:3002
   - Admin User: `admin@rythm.app` / `admin123`
   - Orchestrator: `orchestrator@rythm.app` / `Password123`

### Docker Development

1. **Build and start services:**
   ```bash
   npm run dev:build
   npm run dev:up
   ```

2. **View admin logs:**
   ```bash
   npm run dev:logs:admin
   ```

3. **Restart admin service:**
   ```bash
   npm run dev:restart:admin
   ```

## Admin Users

### Default Accounts

1. **System Administrator**
   - Email: `admin@rythm.app`
   - Password: `admin123`
   - Role: `super_admin`
   - Access: Full system administration

2. **Orchestrator**
   - Email: `orchestrator@rythm.app`
   - Password: `Password123`
   - Role: `admin`
   - Access: Platform administration

## Architecture

### Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Authentication**: JWT tokens with secure storage
- **API**: RESTful endpoints with admin middleware
- **State Management**: React Context + React Query

### Directory Structure

```
apps/admin/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/          # Admin API routes
│   │   ├── dashboard/    # Dashboard page
│   │   ├── login/        # Authentication
│   │   └── layout.tsx    # Root layout
│   ├── components/       # Reusable UI components
│   │   ├── AdminLayout.tsx    # Main layout with navigation
│   │   ├── StatsCard.tsx      # Statistics display
│   │   └── RecentActivity.tsx # Activity feed
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx    # Authentication state
│   └── services/         # API service layer
│       └── adminApi.ts        # Admin API client
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── Dockerfile            # Production container
├── Dockerfile.dev        # Development container
└── README.md            # This file
```

## API Endpoints

### Authentication

- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout

### Dashboard

- `GET /api/admin/dashboard` - Dashboard statistics and recent activity

## Security

- JWT-based authentication with secure token storage
- Role-based access control (RBAC)
- Admin-only API endpoints with middleware protection
- Password hashing with bcrypt
- CORS protection and request validation

## Environment Variables

```env
# Admin Interface
JWT_SECRET=your-admin-secret-key
NODE_ENV=development
API_URL=http://api:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Deployment

### Production Build

```bash
npm run build --workspace=@rythm/admin
```

### Docker Production

```bash
docker build -f apps/admin/Dockerfile -t rythm-admin .
docker run -p 3002:3002 rythm-admin
```

## Development

### Adding New Features

1. **API Routes**: Add new endpoints in `src/app/api/admin/`
2. **Pages**: Create new pages in `src/app/`
3. **Components**: Add reusable components in `src/components/`
4. **Services**: Extend the API client in `src/services/adminApi.ts`

### Code Standards

- TypeScript for type safety
- React functional components with hooks
- Tailwind CSS for styling
- ESLint and Prettier for code formatting

## Monitoring

### Health Checks

The admin interface includes built-in monitoring for:
- System health status
- API response times
- User activity metrics
- Error tracking and reporting

### Logs

- Application logs: `npm run dev:logs:admin`
- Error tracking: Built into dashboard interface
- Audit trails: User actions and system changes

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check admin credentials
   - Verify JWT_SECRET is set correctly
   - Clear browser localStorage

2. **API Connection Issues**
   - Ensure API service is running on port 3001
   - Check CORS configuration
   - Verify network connectivity

3. **Build Errors**
   - Run `npm install` to update dependencies
   - Check TypeScript errors
   - Verify environment variables

### Debug Mode

Enable detailed logging:
```bash
DEBUG=rythm:admin npm run dev
```

## Support

For issues, feature requests, or questions:
- Check the main RYTHM documentation
- Review API documentation
- Contact the development team

---

**Note**: This admin interface is designed for system administrators only. Never share admin credentials or expose the admin interface to end users.