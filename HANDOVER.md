# HANDOVER - DAFC OTB Platform (Monorepo)

> **Khi quay lai, yeu cau Claude doc file nay de tiep tuc:**
> ```
> doc file HANDOVER.md de tiep tuc
> ```

---

## Cap nhat lan cuoi: 29/01/2026 (Session 3 - UI Design)

---

## TONG QUAN DU AN

**DAFC OTB Platform** - He thong quan ly Open-to-Buy cho nganh thoi trang cao cap

| Thong tin | Chi tiet |
|-----------|----------|
| **Architecture** | Turborepo Monorepo |
| **Frontend** | Next.js 14.2.35 (apps/web - port 3000) |
| **Backend** | NestJS 10 (apps/api - port 3001) |
| **Shared** | @dafc/shared (types, schemas, utils) |
| **Database** | Prisma + PostgreSQL (@dafc/database) |
| **AI** | OpenAI GPT-4 (AI Copilot) |

---

## TRANG THAI HIEN TAI: 100% HOAN THANH

### Monorepo Structure: COMPLETED

```
dafc-otb-monorepo/
├── apps/
│   ├── web/                    # Next.js Frontend (port 3000)
│   │   ├── app/               # Pages
│   │   ├── components/        # React components
│   │   ├── lib/
│   │   │   └── api-client.ts  # Full API client (updated)
│   │   └── Dockerfile
│   └── api/                    # NestJS Backend (port 3001)
│       ├── src/
│       │   ├── modules/       # All feature modules (updated)
│       │   │   ├── auth/
│       │   │   ├── budgets/
│       │   │   ├── otb-plans/     # +submit/approve/reject/sizing/ai-proposal
│       │   │   ├── sku-proposals/ # +submit/approve/reject/import/validate/enrich
│       │   │   ├── workflows/     # NEW: Approvals module
│       │   │   ├── analytics/     # NEW: KPI, forecasts, scenarios
│       │   │   ├── integrations/  # NEW: ERP, S3, webhooks, API keys
│       │   │   └── ...
│       │   ├── common/
│       │   └── main.ts
│       └── Dockerfile
├── packages/
│   ├── shared/                 # @dafc/shared
│   └── database/               # @dafc/database
├── .github/workflows/ci.yml    # NEW: CI/CD pipeline
├── docker-compose.yml          # NEW: Docker setup
├── render.yaml                 # NEW: Render.com deployment
├── turbo.json
└── pnpm-workspace.yaml
```

### Build Status: ALL PASSING

```
packages/shared    -> Build OK
packages/database  -> Build OK
apps/api          -> Build OK (12+ modules)
apps/web          -> Build OK
```

---

## API ENDPOINTS (Full List)

### Core Business
```
# Budgets
/api/v1/budgets                 # CRUD
/api/v1/budgets/:id/submit      # Submit for approval
/api/v1/budgets/:id/approve     # Approve
/api/v1/budgets/:id/reject      # Reject

# OTB Plans
/api/v1/otb-plans               # CRUD
/api/v1/otb-plans/:id/submit    # Submit for approval
/api/v1/otb-plans/:id/approve   # Approve
/api/v1/otb-plans/:id/reject    # Reject
/api/v1/otb-plans/:id/sizing    # Get/Save sizing data
/api/v1/otb-plans/:id/ai-proposal  # Generate AI proposal

# SKU Proposals
/api/v1/sku-proposals           # CRUD
/api/v1/sku-proposals/:id/submit   # Submit for approval
/api/v1/sku-proposals/:id/approve  # Approve
/api/v1/sku-proposals/:id/reject   # Reject
/api/v1/sku-proposals/:id/import   # Import from Excel
/api/v1/sku-proposals/:id/validate # Validate items
/api/v1/sku-proposals/:id/enrich   # AI enrichment
```

### Workflows & Approvals
```
/api/v1/approvals               # List all pending approvals
/api/v1/approvals/mine          # My pending approvals
/api/v1/workflows/:id           # Get workflow
/api/v1/workflows/:id/approve   # Approve step
/api/v1/workflows/:id/reject    # Reject step
```

### Analytics & KPI
```
/api/v1/kpi                     # KPI dashboard
/api/v1/kpi/alerts              # KPI alerts
/api/v1/kpi/alerts/:id/acknowledge
/api/v1/forecast                # Forecasts
/api/v1/forecast/analyze        # Generate forecast
/api/v1/simulator               # What-if scenarios
/api/v1/insights                # AI insights
/api/v1/analytics/executive-summary
/api/v1/analytics/stock-optimization
/api/v1/analytics/risk-assessment
```

### Integrations
```
# API Keys
/api/v1/api-keys                # CRUD

# Webhooks
/api/v1/webhooks                # CRUD
/api/v1/webhooks/:id/test       # Test webhook

# ERP
/api/v1/integrations/erp        # CRUD connections
/api/v1/integrations/erp/:id/mappings  # Field mappings
/api/v1/integrations/erp/:id/sync      # Trigger sync

# S3/Files
/api/v1/integrations/s3/presign # Get upload URL
/api/v1/integrations/s3/files   # List/register files
```

### Master Data
```
/api/v1/brands
/api/v1/categories
/api/v1/locations
/api/v1/seasons
/api/v1/divisions
/api/v1/users
```

### AI
```
/api/v1/ai/conversations        # Chat conversations
/api/v1/ai/suggestions          # AI suggestions
/api/v1/ai/generated-plans      # AI generated plans
/api/v1/ai/predictive-alerts    # Predictive alerts
/api/v1/ai/dashboard            # AI dashboard
```

### Other
```
/api/v1/health                  # Health check (public)
/api/v1/health/ping             # Ping (public)
/api/v1/auth/login              # Login
/api/v1/auth/profile            # Get profile
/api/v1/notifications           # User notifications
/api/v1/reports                 # Reports
```

**Swagger Docs:** `http://localhost:3001/api/docs`

---

## SESSION 29/01/2026 - Session 3 (UI Design)

### Thay doi chinh

1. **Khoi phuc giao dien** - Client khong hai long voi sidebar mau nau do
   - Reset ve commit `2569d32` (truoc khi doi sidebar)
   - Tao backup branch: `backup-apple-design-2026-01-29`

2. **Thiet ke card moi - Watermark Icon Design**
   - Icon lon (h-32 w-32) lam watermark o goc phai duoi
   - Opacity 10% (`text-{color}-500/10`)
   - Typography lon hon (`text-3xl font-bold tracking-tight`)
   - Ap dung cho ~90+ stat cards tren 22 trang

### Design Pattern moi cho Stat Cards

```tsx
<Card className="relative overflow-hidden">
  {/* Watermark icon */}
  <IconName className="absolute -bottom-4 -right-4 h-32 w-32 text-{color}-500/10" />

  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Title
    </CardTitle>
  </CardHeader>

  <CardContent className="relative">
    <div className="text-3xl font-bold tracking-tight text-{color}-600">
      $9,600,000
    </div>
    <p className="text-sm text-muted-foreground mt-1">Description</p>
  </CardContent>
</Card>
```

### Cac trang da cap nhat (22 files)

```
apps/web/app/(dashboard)/
├── budget/page.tsx
├── budget/[id]/page.tsx
├── dashboard/page.tsx
├── sku-proposal/page.tsx
├── wssi/page.tsx
├── wssi/alerts/page.tsx
├── wssi/[id]/page.tsx
├── approvals/page.tsx
├── size-profiles/page.tsx
├── settings/audit/page.tsx
├── otb-analysis/page.tsx
├── predictive-alerts/page.tsx
├── ai-auto-plan/page.tsx
└── analytics/
    ├── page.tsx
    ├── kpi/page.tsx
    ├── simulator/page.tsx
    ├── forecast/page.tsx
    ├── insights/page.tsx
    ├── automation/page.tsx
    ├── comparison/page.tsx
    ├── decisions/page.tsx
    └── demand/page.tsx
```

### Git Commits

```
daf1414 style: modern watermark icon design for stat cards
2569d32 style: increase user dropdown menu size (reset point)
```

### Backup Branch

```bash
# Neu can tham khao thiet ke Apple truoc do:
git checkout backup-apple-design-2026-01-29
```

---

## SESSION 14/01/2026 - Session 2

### Da hoan thanh (100%)

1. **OTB Plans endpoints** - submit, approve, reject, sizing, ai-proposal
2. **SKU Proposals endpoints** - submit, approve, reject, import, validate, enrich
3. **Workflows module** - Approvals, pending list, workflow actions
4. **Analytics module** - KPI dashboard, forecasts, scenarios, insights
5. **Integrations module** - API keys, webhooks, ERP connections, S3 storage
6. **api-client.ts** - Full update with all new endpoints
7. **Deployment config** - render.yaml, docker-compose.yml, Dockerfiles, CI/CD

### Files da tao/update

```
# Backend modules
apps/api/src/modules/otb-plans/otb-plans.service.ts      # UPDATED: +12 methods
apps/api/src/modules/otb-plans/otb-plans.controller.ts   # UPDATED: +6 endpoints
apps/api/src/modules/sku-proposals/sku-proposals.service.ts  # UPDATED: +12 methods
apps/api/src/modules/sku-proposals/sku-proposals.controller.ts # UPDATED: +6 endpoints
apps/api/src/modules/workflows/                           # NEW: Full module
apps/api/src/modules/analytics/                           # NEW: Full module
apps/api/src/modules/integrations/                        # NEW: Full module
apps/api/src/app.module.ts                               # UPDATED: +3 modules

# Frontend
apps/web/lib/api-client.ts                               # UPDATED: +130 lines

# Deployment
render.yaml                                              # NEW
docker-compose.yml                                       # NEW
apps/api/Dockerfile                                      # NEW
apps/web/Dockerfile                                      # NEW
.github/workflows/ci.yml                                 # NEW
```

---

## CREDENTIALS (Development/Testing)

```
Email: admin@dafc.com
Password: admin123
```

---

## COMMANDS THUONG DUNG

```bash
# Install dependencies
pnpm install

# Development (all apps)
pnpm dev

# Development (specific app)
pnpm dev:api     # Backend (port 3001)
pnpm dev:web     # Frontend (port 3000)

# Build all
pnpm build

# Build specific
pnpm turbo run build --filter=@dafc/api
pnpm turbo run build --filter=@dafc/web

# Database
cd packages/database
pnpm db:generate          # Generate Prisma client
pnpm db:push             # Push schema to DB
pnpm db:seed             # Seed demo data
pnpm db:studio           # Open Prisma Studio

# Docker
docker-compose up -d      # Start all services
docker-compose logs -f    # View logs
docker-compose down       # Stop all services
```

---

## ENVIRONMENT VARIABLES

Copy `.env.example` sang `.env` va cap nhat:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dafc_otb"

# Auth
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# API
API_PORT=3001
NEXT_PUBLIC_API_URL="http://localhost:3001"
CORS_ORIGIN="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."
```

---

## DEPLOYMENT

### Render.com
1. Connect repository to Render
2. Blueprint will auto-detect `render.yaml`
3. Services: dafc-otb-web, dafc-otb-api, dafc-otb-db
4. Set environment variables in dashboard

### Docker
```bash
# Build and run
docker-compose up -d

# Or build images manually
docker build -f apps/api/Dockerfile -t dafc-otb-api .
docker build -f apps/web/Dockerfile -t dafc-otb-web .
```

### GitHub Actions
- Auto runs on push to main/develop
- Jobs: lint, build, test-api, test-web, deploy
- Set `RENDER_DEPLOY_HOOK_URL` secret for auto-deploy

---

## GHI CHU CHO CLAUDE

Khi doc file nay:
1. Kiem tra `pnpm turbo run build` de verify builds
2. Kiem tra API: `curl http://localhost:3001/api/v1/health`
3. Du an da 100% hoan thanh ve mat ky thuat
4. Co the can E2E testing va performance tuning

---

*Cap nhat file nay sau moi session lam viec quan trong*
