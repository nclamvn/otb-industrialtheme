# DAFC OTB Platform - Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database provisioned
- [ ] Redis instance ready (for caching/sessions)
- [ ] Environment variables configured

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dafc_otb"

# Authentication
JWT_SECRET="<secure-random-string>"
JWT_EXPIRES_IN="7d"

# API
API_PORT=3001
CORS_ORIGIN="https://your-domain.com"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# AI Services (if using OpenAI)
OPENAI_API_KEY="<your-key>"
```

### Code Quality
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` - all tests pass
- [ ] `pnpm build` completes successfully

## Build Commands

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm --filter api prisma migrate deploy

# Build all packages
pnpm build

# Build specific apps
pnpm --filter api build
pnpm --filter web build
```

## Database

### Migrations
- [ ] Run `prisma migrate deploy` on production database
- [ ] Verify all migrations applied: `prisma migrate status`
- [ ] Seed data if needed: `prisma db seed`

### Backup
- [ ] Create database backup before deployment
- [ ] Verify backup restoration process

## API Server

### Health Checks
- [ ] `/health` endpoint returns 200
- [ ] `/api/v1/health` returns system status
- [ ] Database connectivity verified

### Security
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] JWT secrets rotated

## Web Application

### Build Verification
- [ ] Production build completes
- [ ] No console errors on load
- [ ] All routes accessible

### Static Assets
- [ ] Images optimized
- [ ] JS/CSS minified
- [ ] Gzip/Brotli compression enabled

## Post-Deployment

### Smoke Tests
- [ ] Login functionality works
- [ ] Dashboard loads correctly
- [ ] OTB Planning page accessible
- [ ] Create/Edit/Delete operations work
- [ ] AI suggestions load
- [ ] Export to Excel works

### Monitoring
- [ ] Application logs flowing
- [ ] Error tracking configured
- [ ] Performance metrics collecting
- [ ] Uptime monitoring active

### Rollback Plan
- [ ] Previous version tagged and accessible
- [ ] Database rollback scripts ready
- [ ] Rollback procedure documented

## Feature Verification

### Core Features
- [ ] OTB Hierarchy Table displays correctly
- [ ] All 4 metrics visible (% Buy, % Sales, $ Sales Thru, MOC)
- [ ] Filters work (Division, Category, Collection, Sizing)
- [ ] AI confidence scores display
- [ ] Export functionality operational

### ExcelAI Tools
- [ ] NL Formula endpoint responds
- [ ] Vietnamese input processed correctly
- [ ] Data cleaner suggestions working

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| DevOps | | | |
| Product Owner | | | |

---

## Quick Deploy Commands

```bash
# Full deployment sequence
pnpm install
pnpm --filter api prisma migrate deploy
pnpm build
pnpm --filter api start:prod &
pnpm --filter web start
```

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors:**
```bash
pnpm typecheck  # Check for type errors
```

**Database connection issues:**
```bash
# Test connection
npx prisma db pull
```

**Port already in use:**
```bash
lsof -i :3001  # Find process using port
kill -9 <PID>  # Kill if needed
```

---
*Last updated: January 2026*
