# E2E Test Implementation Plan - DAFC OTB Platform

## Executive Summary

**Date:** 2026-01-31
**Total Routes:** 61
**Current Test Files:** 17
**Current Test Cases:** 500+
**Estimated Coverage:** ~65%
**Target Coverage:** 95%+

---

## 1. Current State Analysis

### 1.1 Existing Test Infrastructure

```
e2e/
├── fixtures/
│   ├── test-data.ts        # Test data constants (292 lines)
│   └── test-helpers.ts     # Utility functions (349 lines)
├── page-objects/
│   ├── BasePage.ts         # Base class (126 lines)
│   ├── LoginPage.ts        # Auth pages (84 lines)
│   ├── BudgetPage.ts       # Budget CRUD (212 lines)
│   ├── OTBPlanPage.ts      # OTB management (205 lines)
│   └── SKUProposalPage.ts  # SKU import (271 lines)
├── tests/                   # 17 spec files (500+ tests)
└── playwright.config.ts     # Multi-browser config
```

### 1.2 Existing Test Files

| File | Type | Coverage | Tests |
|------|------|----------|-------|
| auth.spec.ts | Smoke | Login/Logout | ~15 |
| dashboard.spec.ts | Smoke | Dashboard basics | ~20 |
| budget.spec.ts | Smoke | Budget CRUD | ~20 |
| sku-import.spec.ts | Smoke | Import basics | ~25 |
| comprehensive-auth.spec.ts | Full | All auth flows | ~40 |
| comprehensive-budget.spec.ts | Full | Budget workflows | ~45 |
| comprehensive-otb-plans.spec.ts | Full | OTB planning | ~50 |
| comprehensive-sku-import.spec.ts | Full | SKU operations | ~45 |
| comprehensive-analytics.spec.ts | Full | Analytics/KPIs | ~50 |
| comprehensive-navigation.spec.ts | Full | Navigation/UI | ~55 |
| full-workflow.spec.ts | Integration | E2E business flow | ~30 |
| approval-flow.spec.ts | Business | Approvals/RBAC | ~40 |
| workflows.spec.ts | Business | Multi-step flows | ~35 |
| performance.spec.ts | Non-func | Page load/metrics | ~30 |
| responsive.spec.ts | Non-func | Mobile/Tablet | ~35 |
| accessibility.spec.ts | Non-func | A11y/WCAG | ~25 |
| stress-ui.spec.ts | Non-func | Load/Stress | ~30 |

---

## 2. Application Routes Mapping

### 2.1 All Routes (61 total)

#### Auth Routes (2)
| Route | Status | Test File |
|-------|--------|-----------|
| /auth/login | ✅ Covered | comprehensive-auth.spec.ts |
| /auth/forgot-password | ✅ Covered | comprehensive-auth.spec.ts |

#### Core Business Routes (16)
| Route | Status | Test File |
|-------|--------|-----------|
| / | ✅ Covered | dashboard.spec.ts |
| /dashboard | ✅ Covered | dashboard.spec.ts |
| /budget | ✅ Covered | comprehensive-budget.spec.ts |
| /budget/[id] | ✅ Covered | comprehensive-budget.spec.ts |
| /budget/new | ✅ Covered | comprehensive-budget.spec.ts |
| /budget-flow | ⚠️ Partial | - |
| /budget-flow/[id] | ⚠️ Partial | - |
| /otb-analysis | ✅ Covered | comprehensive-otb-plans.spec.ts |
| /otb-analysis/[id] | ✅ Covered | comprehensive-otb-plans.spec.ts |
| /otb-analysis/new | ✅ Covered | comprehensive-otb-plans.spec.ts |
| /sku-proposal | ✅ Covered | comprehensive-sku-import.spec.ts |
| /sku-proposal/[id] | ✅ Covered | comprehensive-sku-import.spec.ts |
| /sku-proposal/import | ✅ Covered | comprehensive-sku-import.spec.ts |
| /sku-proposal/new | ⚠️ Partial | - |
| /tickets | ❌ Missing | NEW: tickets.spec.ts |
| /approvals | ⚠️ Partial | approval-flow.spec.ts |

#### Analytics Routes (13)
| Route | Status | Test File |
|-------|--------|-----------|
| /analytics | ✅ Covered | comprehensive-analytics.spec.ts |
| /analytics/automation | ❌ Missing | NEW: analytics-modules.spec.ts |
| /analytics/comparison | ❌ Missing | NEW: analytics-modules.spec.ts |
| /analytics/decisions | ❌ Missing | NEW: analytics-modules.spec.ts |
| /analytics/demand | ❌ Missing | NEW: analytics-modules.spec.ts |
| /analytics/forecast | ⚠️ Partial | comprehensive-analytics.spec.ts |
| /analytics/insights | ❌ Missing | NEW: analytics-modules.spec.ts |
| /analytics/kpi | ⚠️ Partial | comprehensive-analytics.spec.ts |
| /analytics/performance | ❌ Missing | NEW: analytics-modules.spec.ts |
| /analytics/powerbi | ❌ Missing | NEW: analytics-modules.spec.ts |
| /analytics/reports | ⚠️ Partial | comprehensive-analytics.spec.ts |
| /analytics/simulator | ❌ Missing | NEW: analytics-modules.spec.ts |
| /analytics/sku-analysis | ❌ Missing | NEW: analytics-modules.spec.ts |

#### AI Features (3)
| Route | Status | Test File |
|-------|--------|-----------|
| /ai-assistant | ❌ Missing | NEW: ai-features.spec.ts |
| /ai-auto-plan | ❌ Missing | NEW: ai-features.spec.ts |
| /ai-suggestions | ❌ Missing | NEW: ai-features.spec.ts |

#### Master Data Routes (5)
| Route | Status | Test File |
|-------|--------|-----------|
| /master-data | ❌ Missing | NEW: master-data.spec.ts |
| /master-data/brands | ❌ Missing | NEW: master-data.spec.ts |
| /master-data/categories | ❌ Missing | NEW: master-data.spec.ts |
| /master-data/locations | ❌ Missing | NEW: master-data.spec.ts |
| /master-data/users | ❌ Missing | NEW: master-data.spec.ts |

#### Settings Routes (8)
| Route | Status | Test File |
|-------|--------|-----------|
| /settings | ⚠️ Partial | - |
| /settings/api-keys | ❌ Missing | NEW: settings.spec.ts |
| /settings/audit | ❌ Missing | NEW: settings.spec.ts |
| /settings/integrations | ❌ Missing | NEW: settings.spec.ts |
| /settings/integrations/erp | ❌ Missing | NEW: settings.spec.ts |
| /settings/integrations/sso | ❌ Missing | NEW: settings.spec.ts |
| /settings/integrations/storage | ❌ Missing | NEW: settings.spec.ts |
| /settings/integrations/webhooks | ❌ Missing | NEW: settings.spec.ts |
| /settings/preferences | ❌ Missing | NEW: settings.spec.ts |

#### WSSI Routes (3)
| Route | Status | Test File |
|-------|--------|-----------|
| /wssi | ❌ Missing | NEW: wssi.spec.ts |
| /wssi/[id] | ❌ Missing | NEW: wssi.spec.ts |
| /wssi/alerts | ❌ Missing | NEW: wssi.spec.ts |

#### Advanced Features (9)
| Route | Status | Test File |
|-------|--------|-----------|
| /clearance | ❌ Missing | NEW: advanced-features.spec.ts |
| /costing | ❌ Missing | NEW: advanced-features.spec.ts |
| /delivery-planning | ❌ Missing | NEW: advanced-features.spec.ts |
| /forecasting | ❌ Missing | NEW: advanced-features.spec.ts |
| /help | ❌ Missing | NEW: help.spec.ts |
| /predictive-alerts | ❌ Missing | NEW: advanced-features.spec.ts |
| /replenishment | ❌ Missing | NEW: advanced-features.spec.ts |
| /reports | ⚠️ Partial | comprehensive-analytics.spec.ts |
| /size-profiles | ❌ Missing | NEW: size-profiles.spec.ts |

#### Utility (1)
| Route | Status | Test File |
|-------|--------|-----------|
| /offline | ❌ Missing | NEW: pwa.spec.ts |

---

## 3. Coverage Gap Analysis

### 3.1 Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Covered | 16 | 26% |
| ⚠️ Partial | 9 | 15% |
| ❌ Missing | 36 | 59% |
| **Total** | **61** | **100%** |

### 3.2 Priority Gaps

**Priority 1 - Critical Business Features:**
- `/tickets` - Ticket management workflow
- `/budget-flow` - Visual budget flow
- Full analytics sub-modules

**Priority 2 - AI Features:**
- `/ai-assistant` - Chat interface
- `/ai-auto-plan` - Auto planning
- `/ai-suggestions` - AI recommendations

**Priority 3 - Master Data & Settings:**
- All `/master-data/*` routes
- All `/settings/*` routes

**Priority 4 - Advanced Features:**
- `/wssi/*` - Weekly Stock Sales Intake
- `/forecasting`, `/replenishment`, `/clearance`
- `/costing`, `/delivery-planning`

---

## 4. Implementation Plan

### Phase 1: Critical Business Features (Week 1)

#### 4.1 New Test Files

**tickets.spec.ts** (~80 tests)
```typescript
// Test Scenarios:
- Ticket list view and filtering
- Create ticket with bundled items
- Ticket status transitions
- Ticket approval workflow
- Ticket timeline/history
- Export tickets
```

**budget-flow.spec.ts** (~60 tests)
```typescript
// Test Scenarios:
- Budget flow visualization
- Version history panel
- Gap analysis dashboard
- Workflow tracker
- Export functionality
```

**analytics-modules.spec.ts** (~120 tests)
```typescript
// Test Scenarios for each sub-module:
- /automation - Auto rules management
- /comparison - Compare analytics
- /decisions - Decision history
- /demand - Demand planning
- /forecast - Forecasting views
- /insights - AI insights
- /kpi - KPI dashboard
- /performance - Performance metrics
- /powerbi - PowerBI embed
- /simulator - What-if simulator
- /sku-analysis - SKU analysis
```

### Phase 2: AI Features (Week 2)

**ai-features.spec.ts** (~80 tests)
```typescript
// AI Assistant Tests:
- Chat interface rendering
- Message input/send
- Response display
- Suggestion cards
- Chat history

// AI Auto Plan Tests:
- Parameter input form
- Generation trigger
- Progress display
- Result review

// AI Suggestions Tests:
- Suggestion list loading
- Apply suggestion
- Dismiss suggestion
- Suggestion details
```

### Phase 3: Master Data & Settings (Week 3)

**master-data.spec.ts** (~100 tests)
```typescript
// For each entity (brands, categories, locations, users):
- List view with filters
- Create new item
- Edit existing item
- Delete item
- Bulk operations
- Export/Import
- Validation errors
```

**settings.spec.ts** (~80 tests)
```typescript
// General settings
- Preferences update
- API keys CRUD
- Audit log viewing

// Integration settings
- ERP connection test
- SSO configuration
- Storage settings
- Webhook management
```

### Phase 4: Advanced Features (Week 4)

**wssi.spec.ts** (~60 tests)
```typescript
- WSSI dashboard rendering
- Weekly data entry
- Calculations verification
- Alert configuration
- Report generation
```

**advanced-features.spec.ts** (~100 tests)
```typescript
// Each module:
- /clearance - Markdown management
- /costing - Cost calculations
- /delivery-planning - Delivery windows
- /forecasting - Trend analysis
- /replenishment - Auto-reorder
- /predictive-alerts - Alert config
```

**size-profiles.spec.ts** (~50 tests)
```typescript
- Profile list and filters
- Create/Edit profile
- Size distribution chart
- Profile comparison
- Optimization form
- Version management
```

### Phase 5: Edge Cases & Utilities (Week 5)

**help.spec.ts** (~20 tests)
```typescript
- Help page rendering
- Search functionality
- Category navigation
```

**pwa.spec.ts** (~30 tests)
```typescript
- Offline page display
- Service worker registration
- Cache behavior
```

**error-handling.spec.ts** (~50 tests)
```typescript
- 404 pages
- 500 error handling
- Network failures
- Session expiry
- Concurrent editing conflicts
```

**large-datasets.spec.ts** (~30 tests)
```typescript
- 5000+ row tables
- Pagination with large data
- Export large datasets
- Search in large lists
```

---

## 5. New Page Objects Required

```typescript
// page-objects/
├── TicketPage.ts         // Ticket management
├── AnalyticsPage.ts      // Analytics modules
├── AIAssistantPage.ts    // AI chat interface
├── MasterDataPage.ts     // Master data CRUD
├── SettingsPage.ts       // Settings management
├── WSSIPage.ts           // WSSI dashboard
├── ForecastingPage.ts    // Forecasting views
├── SizeProfilePage.ts    // Size profiles
└── ReportsPage.ts        // Reports generation
```

---

## 6. Test Data Additions

```typescript
// Add to test-data.ts:

export const TestTickets = {
  valid: { /* ticket data */ },
  bundled: { /* bundled ticket */ },
  approved: { /* approved ticket */ },
};

export const TestWSSI = {
  weeklyData: { /* WSSI data */ },
  alerts: { /* alert configs */ },
};

export const TestAISuggestions = {
  budgetOptimization: { /* suggestion */ },
  skuRecommendation: { /* suggestion */ },
};
```

---

## 7. Implementation Timeline

| Week | Phase | Test Files | Est. Tests |
|------|-------|------------|------------|
| 1 | Critical Business | 3 files | ~260 |
| 2 | AI Features | 1 file | ~80 |
| 3 | Master Data & Settings | 2 files | ~180 |
| 4 | Advanced Features | 3 files | ~210 |
| 5 | Edge Cases & Utilities | 4 files | ~130 |
| **Total** | | **13 new files** | **~860 new tests** |

---

## 8. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Route Coverage | 26% | 95% |
| Test Cases | 500 | 1360 |
| Test Files | 17 | 30 |
| Page Objects | 5 | 14 |
| Browser Configs | 7 | 7 |

---

## 9. Execution Commands

```bash
# Run all new tests
pnpm test:e2e --grep "@new"

# Run by phase
pnpm test:e2e --grep "@phase1"
pnpm test:e2e --grep "@phase2"
pnpm test:e2e --grep "@phase3"

# Run specific new module
pnpm test:e2e tests/tickets.spec.ts
pnpm test:e2e tests/ai-features.spec.ts
pnpm test:e2e tests/master-data.spec.ts

# Full regression
pnpm test:e2e:comprehensive

# CI pipeline
pnpm test:e2e:ci
```

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API dependencies | Mock responses for unstable APIs |
| Test flakiness | Retry logic + explicit waits |
| Long execution time | Parallel execution + sharding |
| Data conflicts | Unique test data generation |
| Auth token expiry | Token refresh in setup |

---

## Approval

- [ ] Technical Lead Review
- [ ] QA Lead Review
- [ ] Product Owner Review

**Prepared by:** Claude Code
**Date:** 2026-01-31
