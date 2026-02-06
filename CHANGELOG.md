# Changelog

All notable changes to the DAFC OTB Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

Changes that are in development but not yet released.

---

## [2026-01-27] - Phase 1: Foundation Setup

### Added

**Documentation & Setup**
- Comprehensive `SETUP.md` guide for development environment
- Git workflow documentation (`docs/GIT_WORKFLOW.md`)
- Commit convention guidelines (`docs/COMMIT_CONVENTION.md`)
- Pull request template (`.github/PULL_REQUEST_TEMPLATE.md`)
- `CHANGELOG.md` to track project changes

**Git Workflow**
- Created `develop` branch as integration branch
- Established feature branch workflow
- Branch protection rules documentation

### Changed

- Updated `README.md` with links to new documentation

### Documentation

- Complete environment setup guide (300+ lines)
- Branch strategy and PR process documentation
- Commit message standards with examples

---

## [Previous] - Initial Monorepo Setup

### Added

**Project Structure**
- Turborepo monorepo setup with pnpm workspaces
- `apps/web`: Next.js 14 frontend application
- `apps/api`: NestJS 10 backend application
- `packages/database`: Prisma schema with 75+ models
- `packages/shared`: Shared types and utilities

**Tech Stack**
- Next.js 14 with App Router
- NestJS 10 with TypeScript
- Prisma 5 with PostgreSQL 15
- Tailwind CSS + Shadcn/ui
- NextAuth 5 (beta) for authentication
- OpenAI SDK for AI features

**Features Implemented**
- User authentication & authorization
- Budget management with approval workflow
- OTB planning with versioning
- SKU proposal with Excel import
- Workflow engine for approvals
- Master data management (Brands, Categories, Seasons)
- Analytics & KPI tracking
- AI assistant features
- WSSI management
- Forecasting engine
- Clearance optimization
- Replenishment (MOC/MOQ)
- Size profiles
- ERP integrations
- PowerBI integration
- Reports generation

**Database Schema**
- 75+ models covering entire OTB domain
- Complete relationships and indexes
- Comprehensive enums for all statuses

---

## Version Format

```
## [YYYY-MM-DD] - Session/Phase Name

### Added
For new features.

### Changed
For changes in existing functionality.

### Deprecated
For soon-to-be removed features.

### Removed
For now removed features.

### Fixed
For any bug fixes.

### Security
For security improvements.
```

---

*Keep this changelog updated with every significant change to the project.*
