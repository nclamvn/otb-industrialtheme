# HANDOVER - DAFC OTB NextJS Frontend

> **Khi quay lai, yeu cau Claude doc file nay de tiep tuc:**
> ```
> doc file HANDOVER.md de tiep tuc
> ```

---

## Cap nhat lan cuoi: 06/02/2026 (Session 6 - i18n, Premium UI, Light Theme)

---

## TONG QUAN DU AN

**DAFC OTB Platform** - He thong quan ly Open-to-Buy cho nganh thoi trang cao cap

| Thong tin | Chi tiet |
|-----------|----------|
| **Frontend** | Next.js 16.1.6, App Router, React 19 |
| **Styling** | Tailwind CSS v3, custom CSS variables |
| **Backend** | NestJS (rieng biet, port 4000) |
| **API Base** | `http://localhost:4000/api/v1` |
| **Dev Port** | `http://localhost:3006` |
| **Language** | Bilingual EN/VN with toggle |
| **Theme** | Dark/Light mode with CSS variables |

### Repositories

| Remote | URL |
|--------|-----|
| **origin** (TCDevop) | https://github.com/TCDevop/OTB.git |
| **nclamvn** | https://github.com/nclamvn/DAFC-OTB-TCDATA.git |

### Demo Accounts

```
admin@dafc.com    / dafc@2026  (Admin)
merch@dafc.com    / dafc@2026  (Merchandiser)
manager@dafc.com  / dafc@2026  (Manager)
finance@dafc.com  / dafc@2026  (Finance)
```

---

## KIEN TRUC FRONTEND

```
DAFC-OTB-NextJS/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.jsx                # Root layout
│   │   ├── providers.jsx             # AuthProvider > LanguageProvider > AppProvider
│   │   ├── globals.css               # Theme CSS variables + component classes
│   │   ├── login/page.jsx            # Login route
│   │   └── (dashboard)/              # Protected routes (AuthGuard)
│   │       ├── layout.jsx            # Sidebar + AppHeader layout
│   │       ├── page.jsx              # / → HomeScreen
│   │       ├── budget-management/    # /budget-management
│   │       ├── planning/             # /planning → BudgetAllocateScreen
│   │       ├── otb-analysis/         # /otb-analysis
│   │       ├── proposal/             # /proposal → SKUProposalScreen
│   │       ├── tickets/              # /tickets
│   │       ├── approval-config/      # /approval-config
│   │       ├── master-data/          # /master-data
│   │       ├── profile/              # /profile
│   │       ├── settings/             # /settings
│   │       └── dev-tickets/          # /dev-tickets
│   ├── screens/                      # 15 screen components (all 'use client')
│   │   ├── HomeScreen.jsx            # Dashboard KPI cards + alerts
│   │   ├── BudgetManagementScreen.jsx
│   │   ├── BudgetAllocateScreen.jsx
│   │   ├── OTBAnalysisScreen.jsx
│   │   ├── SKUProposalScreen.jsx
│   │   ├── TicketScreen.jsx
│   │   ├── TicketDetailPage.jsx
│   │   ├── PlanningDetailPage.jsx
│   │   ├── ProposalDetailPage.jsx
│   │   ├── ApprovalWorkflowScreen.jsx
│   │   ├── MasterDataScreen.jsx
│   │   ├── ProfileScreen.jsx
│   │   ├── SettingsScreen.jsx
│   │   ├── LoginScreen.jsx
│   │   └── DevTicketScreen.jsx
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.jsx           # Navigation sidebar (collapsible)
│   │   │   └── AppHeader.jsx         # Top header (search, dark mode, lang, notifications)
│   │   ├── Common/
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── BudgetModal.jsx
│   │   │   └── PlanningDetailModal.jsx
│   │   ├── AuthGuard.jsx             # Route protection
│   │   ├── BudgetAlertsBanner.jsx    # Premium alert banner
│   │   ├── RiskScoreCard.jsx         # AI risk assessment
│   │   ├── OtbAllocationAdvisor.jsx  # AI allocation advisor
│   │   ├── SkuRecommenderPanel.jsx   # AI SKU recommendations
│   │   ├── SizeCurveAdvisor.jsx      # AI size curve advisor
│   │   └── TicketKanbanBoard.jsx     # Kanban board
│   ├── contexts/
│   │   ├── AuthContext.js            # JWT auth (login, logout, user)
│   │   ├── LanguageContext.js        # Bilingual EN/VN with t() function
│   │   └── AppContext.js             # Shared state (darkMode, allocation data, etc.)
│   ├── services/
│   │   ├── api.js                    # Axios instance + JWT interceptor
│   │   ├── authService.js
│   │   ├── budgetService.js
│   │   ├── planningService.js
│   │   ├── proposalService.js
│   │   ├── masterDataService.js
│   │   ├── approvalService.js
│   │   ├── approvalWorkflowService.js
│   │   ├── aiService.js
│   │   └── index.js                  # Re-exports all services
│   ├── locales/
│   │   ├── en.js                     # English translations
│   │   ├── vi.js                     # Vietnamese translations
│   │   └── index.js
│   └── utils/
│       ├── routeMap.js               # screenId → URL mapping
│       └── formatters.js             # Currency, date formatters
└── public/
    └── dafc-logo.png
```

---

## KEY PATTERNS

### Services
```js
// api.js = Axios instance with JWT interceptor (NOT a service with methods)
// Domain services use: api.get('/endpoint') → response.data.data || response.data
```

### API Responses
```js
// May return { data: { data: [...] } } or { data: [...] } - always handle both
```

### Bilingual (i18n)
```js
const { t, language, setLanguage } = useLanguage();
// Usage: t('home.welcomeBack', { name: 'Admin' })
// Translations in src/locales/en.js and src/locales/vi.js
// Toggle on AppHeader + Settings page
// Persisted in localStorage
```

### Dark/Light Mode
```js
// CSS variables in globals.css (.light / .dark classes)
// All screens receive darkMode prop from AppContext
// Pattern: darkMode ? 'dark-classes' : 'light-classes'
```

### Premium Card Design
```js
// KPI/stat cards use gradient background + watermark icon pattern:
// - Diagonal gradient: linear-gradient(135deg, base 0%, base 60%, accentGrad 100%)
// - Large watermark icon: absolute -bottom-3 -right-3, size 80-90px, opacity 0.05
// - Icon badge: w-10 h-10 rounded-xl backdrop-blur-sm
// - Accent colors per card: gold, emerald, blue, rose, amber, teal, violet, indigo
// Applied in: HomeScreen, BudgetManagementScreen, TicketScreen, DevTicketScreen
```

### Color Palette
```
Dark Theme:
  #0A0A0A  - Background
  #121212  - Card background
  #1A1A1A  - Muted/input background
  #2E2E2E  - Borders
  #666666  - Muted text
  #999999  - Secondary text
  #F2F2F2  - Primary text
  #D7B797  - Brand gold (primary accent)
  #2A9E6A  - Success green
  #F85149  - Error red
  #E3B341  - Warning gold

Light Theme:
  #ffffff  - Card background
  #C4B5A5  - Borders (was border-[#2E2E2E]/20)
  #D4C8BB  - Light borders (was border-[#2E2E2E]/10)
  rgba(160,120,75,...) - Hover/accent backgrounds (was rgba(215,183,151,...))
```

---

## SESSION 06/02/2026 - Session 6

### Thay doi chinh

1. **Next.js Migration (tu CRA)**
   - CRA (reference): `/Users/mac/OTBDAFC/DAFC - OTB - App/`
   - Next.js 16, App Router, Tailwind v3, React 19
   - 16 routes (14 static + 2 dynamic), all build OK
   - AuthGuard bao ve dashboard routes
   - Cross-screen data: AppContext + sessionStorage

2. **Bilingual UI (EN/VN)**
   - LanguageContext with t() function, {{param}} interpolation
   - 500+ translated keys across 15 screens + components
   - Language toggle on AppHeader + Settings page
   - Persisted in localStorage, default: 'vi'
   - Missing key fallback: current lang → EN → raw key

3. **Premium Card Design**
   - KPI cards: gradient background + large watermark icon (80-90px)
   - 8 accent themes: gold, emerald, blue, rose, amber, teal, violet, indigo
   - Applied to HomeScreen (8 cards), BudgetManagement (3), Ticket (3), DevTicket (4)
   - BudgetAlertsBanner redesigned: glass-morphism, gradient badges, left accent bar
   - hover:shadow-lg, group-hover watermark scale animation

4. **Light Theme Contrast Fix**
   - CSS variables updated: stronger borders, pure white cards, saturated primary
   - Component-level light overrides: .light .ind-card, .ind-table, .kpi-card, etc.
   - Screen-level: border-[#2E2E2E]/20 → border-[#C4B5A5] (solid warm-tan)
   - Screen-level: rgba(215,183,151,...) → rgba(160,120,75,...) (deeper brown)
   - 11 screen files + AppHeader + globals.css updated

5. **Dark Blue Flash Fix**
   - AuthGuard.jsx: bg-[#0f172a] → bg-[#0A0A0A]
   - LoginScreen.jsx: Full palette conversion from slate to app dark theme

6. **Sidebar Enhancements**
   - All text bold (font-semibold for items, font-bold for headers/active)
   - Logo + brand name 120% larger when expanded (h-11, text-xs)
   - Header height 64px

### Files da cap nhat (39 files)

```
# New files
src/contexts/LanguageContext.js       # i18n context
src/locales/en.js                     # English translations
src/locales/vi.js                     # Vietnamese translations
src/locales/index.js                  # Re-export

# Modified - Layout & Components
src/app/globals.css                   # Theme variables + light mode overrides
src/app/providers.jsx                 # + LanguageProvider
src/components/AuthGuard.jsx          # Dark flash fix
src/components/BudgetAlertsBanner.jsx # Premium redesign
src/components/Layout/AppHeader.jsx   # Lang toggle + i18n + light fix
src/components/Layout/Sidebar.jsx     # i18n + bold text + larger logo
src/components/Common/*.jsx           # i18n translations
src/components/RiskScoreCard.jsx      # i18n
src/components/OtbAllocationAdvisor.jsx
src/components/SkuRecommenderPanel.jsx
src/components/SizeCurveAdvisor.jsx
src/components/TicketKanbanBoard.jsx

# Modified - Screens (all 15)
src/screens/*.jsx                     # i18n + light theme fix + premium cards
```

---

## PREVIOUS SESSIONS

### Session 5 (06/02/2026) - Frontend-Backend Integration
- All 7 phases completed: services connected to real API
- Removed all mock data fallbacks (except TicketDetailPage)
- HomeScreen/ProfileScreen use AuthContext user

### Session 4 (03/02/2026) - UI & Render Deployment
- AI button styling, dashboard welcome section
- Render deployment config (render.yaml)

### Session 3 (29/01/2026) - UI Design
- Watermark icon card design (original concept)
- Applied to 22 pages in monorepo version

### Session 2 (14/01/2026) - Backend Completion
- OTB Plans, SKU Proposals, Workflows, Analytics, Integrations modules
- Full API client, CI/CD, Docker config

---

## COMMANDS

```bash
# Development
npm run dev              # Start dev server (port 3006)
npm run build            # Production build

# Git (2 remotes)
git push origin main     # Push to TCDevop/OTB
git push nclamvn main    # Push to nclamvn/DAFC-OTB-TCDATA

# Backend (separate project)
cd /path/to/backend && npm run start:dev   # NestJS on port 4000
```

---

## REMAINING ITEMS

- [ ] TicketDetailPage.jsx still has MOCK_SKU_DATA and MOCK_DETAIL_DATA
- [ ] nclamvn remote has divergent history (needs force push or merge)
- [ ] E2E testing
- [ ] Performance tuning

---

## GHI CHU CHO CLAUDE

Khi doc file nay:
1. Frontend: `/Users/mac/OTBDAFC/DAFC-OTB-NextJS/`
2. Backend: NestJS rieng biet, API tai `localhost:4000/api/v1`
3. Tat ca screen la `'use client'` components
4. i18n dung `useLanguage()` hook, translations tai `src/locales/`
5. Dark/light mode qua `darkMode` prop + CSS variables
6. Premium cards: gradient + watermark icon pattern (xem HomeScreen lam mau)

---

*Cap nhat file nay sau moi session lam viec quan trong*
