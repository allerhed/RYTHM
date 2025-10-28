# Contributing to RYTHM

Thank you for your interest in contributing to RYTHM! This document provides guidelines and standards for development.

## 🎨 Semantic Theme Adherence

### Required Standards
All UI contributions **must** follow the semantic theme system:

1. **No Gradient Utilities**: Never use `bg-gradient-to-*` classes
   - ESLint will reject these automatically
   - Use elevation surfaces: `bg-dark-primary`, `bg-dark-elevated1`, `bg-dark-elevated2`

2. **Semantic Text Classes**: Use text hierarchy tiers
   - Primary content: `text-text-primary`
   - Supporting info: `text-text-secondary`
   - Subtle metadata: `text-text-tertiary`
   - Avoid raw `text-gray-*` utilities

3. **Button Components**: Use semantic button classes
   - Primary actions: `btn-primary` (burnt orange)
   - Secondary actions: `btn-secondary`
   - Include focus states: `focus:ring-2 focus:ring-orange-accent`

4. **Surface Elevation**: Use elevation scale for depth
   - Base: `bg-dark-primary`
   - Elevated panels: `bg-dark-elevated1` with `border border-dark-border`
   - Headers/overlays: `bg-dark-elevated2`

📖 **Full Reference**: [docs/SEMANTIC_THEME.md](docs/SEMANTIC_THEME.md)

## 🔧 Development Workflow

### Setting Up
```bash
# Start development environment
npm run dev

# Verify services are running
npm run dev:status
```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Edit files in `apps/` or `packages/`
   - Hot reload will apply changes automatically
   - Check logs if needed: `npm run dev:logs`

3. **Test your changes**
   - Verify in browser at http://localhost:3000 (mobile) or http://localhost:3002 (admin)
   - Run linter: `npm run lint --workspace=apps/mobile`
   - Check for errors: `npm run dev:logs:api`

4. **Document your changes**
   - Update relevant docs in `docs/`
   - Add entry to `CHANGELOG.md` if user-facing
   - Include screenshots for UI changes

### ESLint Validation
Before committing UI changes:
```bash
# Lint mobile app (includes gradient check)
npm run lint --workspace=apps/mobile

# Lint API
npm run lint --workspace=apps/api
```

## 📝 Code Style

### TypeScript
- Use strict TypeScript (`strict: true`)
- Prefer interfaces over types for object shapes
- Export types alongside implementations

### React Components
- Use functional components with hooks
- Implement proper TypeScript props interfaces
- Include JSDoc comments for complex components

### API Routes (tRPC)
- Define Zod schemas for input validation
- Return properly typed responses
- Handle errors with appropriate HTTP status codes

### Database Queries
- Use parameterized queries (never string concatenation)
- Respect Row Level Security (RLS) policies
- Include tenant_id checks where appropriate

## 🗂️ Project Structure

```
RYTHM/
├── apps/
│   ├── api/          # Backend API (Express + tRPC)
│   ├── mobile/       # Mobile PWA (Next.js)
│   └── admin/        # Admin interface (Next.js)
├── packages/
│   ├── db/          # Database migrations & utilities
│   └── shared/      # Shared types & schemas
├── docs/            # Documentation
├── scripts/         # Development & build scripts
└── infra/           # Azure infrastructure (Bicep)
```

## 🧪 Testing

### Manual Testing
1. Test in Docker containers (not local Node.js)
2. Verify mobile responsiveness (Chrome DevTools)
3. Check admin interface permissions
4. Test with different user roles

### Database Migrations
```bash
# Run migrations
npm run db:migrate

# Access database shell
npm run dev:shell:db
```

## 📖 Documentation

### Required Documentation
- **Feature docs**: Add to `docs/features/` for new features
- **API changes**: Update `docs/api/` endpoints
- **Architecture**: Update `docs/architecture/` for structural changes
- **User guides**: Update `docs/user-guides/` for user-facing changes

### Documentation Style
- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Update table of contents in `docs/README.md`

## 🚀 Commit Guidelines

### Commit Message Format
Use conventional commits:
```
<type>(<scope>): <subject>

<body>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```bash
feat(mobile): add workout history calendar view
fix(api): resolve tenant isolation in sessions query
docs(theme): update semantic theme enforcement section
chore(lint): add ESLint gradient restriction rule
```

## 🔍 Pull Request Process

1. **Before Submitting**
   - [ ] ESLint passes without errors
   - [ ] No gradient utilities in code
   - [ ] Documentation updated
   - [ ] Changes tested in Docker containers
   - [ ] Admin/mobile parity maintained (if applicable)

2. **PR Description Should Include**
   - Problem/feature description
   - Approach and implementation details
   - Screenshots (for UI changes)
   - Testing notes
   - Breaking changes (if any)

3. **Review Process**
   - At least one approval required
   - All CI checks must pass
   - No merge conflicts with main

## 🐛 Reporting Issues

### Bug Reports
Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (browser, Docker version)
- Screenshots or logs

### Feature Requests
Include:
- Use case description
- Proposed solution
- Alternative solutions considered
- Impact on existing features

## 🔐 Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Report security vulnerabilities privately
- Follow RLS policies for data access

## 📞 Getting Help

- **Documentation**: Check `docs/` first
- **Quick Start**: See `docs/QUICK_START.md`
- **Theme Guide**: See `docs/SEMANTIC_THEME.md`
- **Architecture**: See `docs/architecture/`

## 📄 License

By contributing to RYTHM, you agree that your contributions will be licensed under the same proprietary license as the project.
