# DAFC OTB Platform - Setup Guide

Complete guide to set up the development environment for the DAFC OTB Platform.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Software | Version | Check Command | Download |
|----------|---------|---------------|----------|
| Node.js | >= 18.0.0 | `node -v` | [nodejs.org](https://nodejs.org/) |
| pnpm | >= 9.0.0 | `pnpm -v` | `npm install -g pnpm` |
| PostgreSQL | >= 15 | `psql --version` | [postgresql.org](https://www.postgresql.org/download/) |
| Git | >= 2.0 | `git --version` | [git-scm.com](https://git-scm.com/) |

### Optional but Recommended

| Software | Purpose | Download |
|----------|---------|----------|
| Docker | Run PostgreSQL in container | [docker.com](https://www.docker.com/) |
| VS Code | IDE | [code.visualstudio.com](https://code.visualstudio.com/) |
| Prisma Extension | Database visualization | VS Code Extensions |

---

## Quick Start

For experienced developers:

```bash
# 1. Clone repository
git clone https://github.com/nclamvn/dafc-otb-monorepo.git
cd dafc-otb-monorepo

# 2. Install dependencies
pnpm install

# 3. Setup environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env

# 4. Configure DATABASE_URL in all .env files
# Edit: postgresql://user:password@localhost:5432/dafc_otb

# 5. Setup database
pnpm db:generate
pnpm db:push
pnpm db:seed

# 6. Start development
pnpm dev

# 7. Open browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:3001/api/docs
```

---

## Detailed Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/nclamvn/dafc-otb-monorepo.git
cd dafc-otb-monorepo
```

Verify the structure:
```bash
ls -la
# Should see: apps/, packages/, package.json, turbo.json, etc.
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This installs dependencies for all workspaces:
- Root dependencies (Turborepo, TypeScript)
- `apps/web` - Next.js frontend
- `apps/api` - NestJS backend
- `packages/database` - Prisma client
- `packages/shared` - Shared utilities

**Expected output:**
```
Packages: +XXX
+++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved XXX, reused XXX, downloaded X, added XXX, done
```

### Step 3: Setup Environment Files

Copy example files:

```bash
# Web app (Next.js)
cp apps/web/.env.example apps/web/.env.local

# API (NestJS)
cp apps/api/.env.example apps/api/.env

# Database (Prisma)
cp packages/database/.env.example packages/database/.env
```

### Step 4: Configure Environment Variables

Edit each `.env` file with your values. See [Environment Variables](#environment-variables) section for details.

**Minimum required:**
```bash
# All .env files need this:
DATABASE_URL="postgresql://username:password@localhost:5432/dafc_otb"

# apps/web/.env.local also needs:
AUTH_SECRET="your-secret-key-min-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# apps/api/.env also needs:
JWT_SECRET="your-jwt-secret-min-32-characters"
```

### Step 5: Setup Database

#### Option A: Local PostgreSQL

1. Create database:
```bash
psql -U postgres
CREATE DATABASE dafc_otb;
\q
```

2. Update DATABASE_URL in all .env files

#### Option B: Docker PostgreSQL (Recommended)

```bash
# Start PostgreSQL container
docker run --name dafc-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dafc_otb \
  -p 5432:5432 \
  -d postgres:15

# Verify running
docker ps
```

DATABASE_URL for Docker:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dafc_otb"
```

#### Option C: Use docker-compose

```bash
docker-compose up -d db
```

### Step 6: Initialize Database Schema

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (creates all tables)
pnpm db:push

# Seed demo data
pnpm db:seed
```

**Expected output for db:push:**
```
Your database is now in sync with your Prisma schema.
```

**Expected output for db:seed:**
```
Seeding...
✓ Created divisions
✓ Created brands
✓ Created categories
...
Seeding completed!
```

---

## Environment Variables

### apps/web/.env.local

```bash
# ═══════════════════════════════════════════════════════════
# DAFC WEB - Environment Configuration
# ═══════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dafc_otb"

# ─────────────────────────────────────────────────────────────
# AUTHENTICATION (NextAuth.js)
# ─────────────────────────────────────────────────────────────
# Secret for encrypting sessions (min 32 characters)
# Generate: openssl rand -base64 32
AUTH_SECRET="your-auth-secret-here-minimum-32-characters"

# Full URL of your application
NEXTAUTH_URL="http://localhost:3000"

# ─────────────────────────────────────────────────────────────
# API CONNECTION
# ─────────────────────────────────────────────────────────────
# NestJS backend URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# ─────────────────────────────────────────────────────────────
# OPENAI (for AI features)
# ─────────────────────────────────────────────────────────────
# Get key from: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-api-key"

# ─────────────────────────────────────────────────────────────
# AWS S3 (Optional - for file storage)
# ─────────────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
AWS_S3_REGION="ap-southeast-1"

# ─────────────────────────────────────────────────────────────
# REDIS (Optional - for caching)
# ─────────────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"
```

### apps/api/.env

```bash
# ═══════════════════════════════════════════════════════════
# DAFC API - Environment Configuration
# ═══════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dafc_otb"

# ─────────────────────────────────────────────────────────────
# SERVER
# ─────────────────────────────────────────────────────────────
API_PORT=3001
NODE_ENV="development"

# ─────────────────────────────────────────────────────────────
# JWT AUTHENTICATION
# ─────────────────────────────────────────────────────────────
# Secret for signing JWT tokens (min 32 characters)
JWT_SECRET="your-jwt-secret-here-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# ─────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────
# Allowed origins (comma-separated for multiple)
CORS_ORIGIN="http://localhost:3000"

# ─────────────────────────────────────────────────────────────
# REDIS (Optional)
# ─────────────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"
```

### packages/database/.env

```bash
# ═══════════════════════════════════════════════════════════
# DAFC DATABASE - Prisma Configuration
# ═══════════════════════════════════════════════════════════

# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dafc_otb"
```

---

## Running the Application

### Development Mode

```bash
# Run all apps (web + api)
pnpm dev

# Run only frontend
pnpm dev:web

# Run only backend
pnpm dev:api
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js web application |
| Backend | http://localhost:3001 | NestJS API server |
| API Docs | http://localhost:3001/api/docs | Swagger documentation |
| Prisma Studio | http://localhost:5555 | Database GUI (run: `pnpm db:studio`) |

### Build for Production

```bash
# Build all packages
pnpm build

# Start production
pnpm start
```

---

## Verification

Run these checks to verify your setup:

### 1. Check Dependencies
```bash
pnpm -v          # Should be >= 9.0.0
node -v          # Should be >= 18.0.0
```

### 2. Check Database Connection
```bash
pnpm db:generate  # Should complete without errors
```

### 3. Check Apps Start
```bash
pnpm dev          # Both apps should start
```

### 4. Verify Endpoints
```bash
# Frontend
curl http://localhost:3000
# Should return HTML

# API Health
curl http://localhost:3001/api/v1/health
# Should return: {"status":"ok"}

# API Docs
open http://localhost:3001/api/docs
# Should show Swagger UI
```

### 5. Verify Login
1. Open http://localhost:3000/login
2. Use seeded credentials:
   - Email: `admin@dafc.com`
   - Password: `Admin@123`

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Cause:** Dependencies not installed or Prisma client not generated.

**Solution:**
```bash
pnpm install
pnpm db:generate
```

#### 2. Database connection refused

**Cause:** PostgreSQL not running or wrong credentials.

**Solution:**
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# If using Docker
docker ps
docker start dafc-postgres

# Verify DATABASE_URL in all .env files
```

#### 3. Port already in use

**Cause:** Another process using port 3000 or 3001.

**Solution:**
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env
```

#### 4. Prisma schema errors

**Cause:** Schema out of sync with database.

**Solution:**
```bash
# Reset and regenerate
pnpm db:push --force-reset
pnpm db:seed
```

#### 5. TypeScript errors on build

**Cause:** Type mismatches or missing types.

**Solution:**
```bash
# Regenerate types
pnpm db:generate

# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

#### 6. AUTH_SECRET errors

**Cause:** AUTH_SECRET not set or too short.

**Solution:**
```bash
# Generate secure secret
openssl rand -base64 32

# Add to apps/web/.env.local
AUTH_SECRET="<generated-secret>"
```

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/nclamvn/dafc-otb-monorepo/issues)
2. Search existing issues for similar problems
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version, etc.)

---

## Next Steps

After successful setup:

1. **Explore the codebase:**
   - `apps/web/app/` - Frontend pages
   - `apps/api/src/modules/` - Backend modules
   - `packages/database/prisma/schema.prisma` - Database schema

2. **Read documentation:**
   - [Git Workflow](docs/GIT_WORKFLOW.md)
   - [Commit Convention](docs/COMMIT_CONVENTION.md)
   - [API Documentation](http://localhost:3001/api/docs)

3. **Start developing:**
   - Create feature branch: `git checkout -b feature/your-feature`
   - Make changes
   - Submit pull request

---

*Last updated: 2026-01-27*
