# DAFC OTB Planning System — Next.js

Open-To-Buy (OTB) Planning Management System cho DAFC. Frontend duoc xay dung tren **Next.js 16 App Router**, ket noi voi backend **NestJS** tai `localhost:4000`.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 3.4.x |
| Icons | lucide-react | latest |
| Charts | Recharts | 3.7.x |
| HTTP Client | Axios | 1.13.x |
| Notifications | react-hot-toast | 2.6.x |
| Backend | NestJS (khong nam trong repo nay) | — |

## Cau truc thu muc

```
src/
├── app/                          # Next.js App Router
│   ├── layout.jsx                # Root layout (fonts, metadata, providers)
│   ├── providers.jsx             # Client-side providers (Auth, App, Toaster)
│   ├── globals.css               # Tailwind + DAFC design tokens
│   ├── login/page.jsx            # Trang dang nhap
│   └── (dashboard)/              # Route group - co sidebar + header
│       ├── layout.jsx            # Dashboard layout (AuthGuard, Sidebar, Header)
│       ├── page.jsx              # Home Dashboard (/)
│       ├── budget-management/    # Quan ly ngan sach
│       ├── planning/             # Phan bo ngan sach
│       │   └── [id]/             # Chi tiet ke hoach
│       ├── otb-analysis/         # Phan tich OTB
│       ├── proposal/             # De xuat SKU
│       │   └── [id]/             # Chi tiet de xuat
│       ├── tickets/              # Danh sach ticket
│       │   └── [id]/             # Chi tiet ticket
│       ├── dev-tickets/          # Dev tickets
│       ├── profile/              # Ho so ca nhan
│       ├── settings/             # Cai dat
│       ├── master-data/[type]/   # Master data (brands, skus, categories, subcategories)
│       └── approval-config/      # Cau hinh quy trinh duyet
│
├── components/                   # UI Components
│   ├── Layout/                   # Sidebar, AppHeader
│   ├── Common/                   # BudgetModal, LoadingSpinner, ErrorMessage, EmptyState
│   ├── AuthGuard.jsx             # Bao ve route can xac thuc
│   └── ...                       # AI components (OtbAllocationAdvisor, RiskScoreCard, etc.)
│
├── contexts/                     # React Contexts
│   ├── AuthContext.js            # Xac thuc (login, logout, permissions)
│   └── AppContext.js             # Shared state (darkMode, cross-screen data)
│
├── hooks/                        # Custom Hooks
│   ├── useBudget.js              # Logic ngan sach
│   ├── usePlanning.js            # Logic ke hoach
│   └── useProposal.js            # Logic de xuat
│
├── screens/                      # Screen components (tu CRA, giu nguyen logic)
│   ├── HomeScreen.jsx
│   ├── BudgetManagementScreen.jsx
│   ├── BudgetAllocateScreen.jsx
│   ├── PlanningDetailPage.jsx
│   ├── OTBAnalysisScreen.jsx
│   ├── SKUProposalScreen.jsx
│   ├── ProposalDetailPage.jsx
│   ├── TicketScreen.jsx
│   ├── TicketDetailPage.jsx
│   ├── DevTicketScreen.jsx
│   ├── LoginScreen.jsx
│   ├── ProfileScreen.jsx
│   ├── SettingsScreen.jsx
│   ├── MasterDataScreen.jsx
│   └── ApprovalWorkflowScreen.jsx
│
├── services/                     # API Services
│   ├── api.js                    # Axios instance + JWT interceptor
│   ├── authService.js            # Xac thuc
│   ├── budgetService.js          # Ngan sach
│   ├── planningService.js        # Ke hoach
│   ├── proposalService.js        # De xuat
│   ├── masterDataService.js      # Du lieu chu
│   ├── approvalService.js        # Duyet
│   ├── approvalWorkflowService.js # Cau hinh quy trinh duyet
│   └── aiService.js              # AI features
│
└── utils/                        # Tien ich
    ├── constants.js              # Hang so (stores, seasons, genders)
    ├── formatters.js             # Dinh dang (currency, date)
    ├── routeMap.js               # Map screen ID <-> URL path
    └── dafc-tokens.js            # Design tokens
```

## Cai dat va chay

### Yeu cau

- Node.js >= 18
- npm >= 9
- Backend NestJS dang chay tai `http://localhost:4000`

### Cai dat

```bash
git clone https://github.com/TCDevop/OTB.git
cd OTB
npm install
```

### Cau hinh moi truong

Tao file `.env.local` tai thu muc goc:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Chay development

```bash
npm run dev
```

Ung dung se chay tai `http://localhost:3000`.

### Build production

```bash
npm run build
npm start
```

## Routing

| URL | Man hinh | Mo ta |
|-----|----------|-------|
| `/login` | LoginScreen | Dang nhap (khong co sidebar) |
| `/` | HomeScreen | Dashboard tong quan |
| `/budget-management` | BudgetManagementScreen | Quan ly ngan sach |
| `/planning` | BudgetAllocateScreen | Phan bo ngan sach |
| `/planning/[id]` | PlanningDetailPage | Chi tiet ke hoach |
| `/otb-analysis` | OTBAnalysisScreen | Phan tich OTB |
| `/proposal` | SKUProposalScreen | De xuat SKU |
| `/proposal/[id]` | ProposalDetailPage | Chi tiet de xuat |
| `/tickets` | TicketScreen | Danh sach ticket |
| `/tickets/[id]` | TicketDetailPage | Chi tiet ticket |
| `/dev-tickets` | DevTicketScreen | Dev tickets |
| `/profile` | ProfileScreen | Ho so ca nhan |
| `/settings` | SettingsScreen | Cai dat ung dung |
| `/master-data/[type]` | MasterDataScreen | Master data (brands/skus/categories/subcategories) |
| `/approval-config` | ApprovalWorkflowScreen | Cau hinh quy trinh duyet |

## Kien truc

### Quy trinh Planning (Workflow)

```
Budget Management → Budget Allocation → OTB Analysis → SKU Proposal → Tickets
```

Du lieu duoc truyen giua cac buoc qua `AppContext`:
- **Budget → Planning**: `allocationData`
- **Planning → OTB**: `otbAnalysisContext`
- **OTB → Proposal**: `skuProposalContext`
- **Ticket list → Detail**: `sessionStorage`

### Xac thuc

- JWT tokens luu trong `localStorage` (accessToken + refreshToken)
- Auto refresh khi token het han (401 response)
- `AuthGuard` component bao ve tat ca route trong `(dashboard)/`
- Redirect ve `/login` khi chua xac thuc

### Dark Mode

- Mac dinh: Dark mode
- Toggle qua `AppContext.setDarkMode()`
- Tailwind `darkMode: 'class'` — toggle class `dark`/`light` tren `<html>`

### Design System

- **Brand colors**: DAFC Gold (#D7B797), DAFC Green (#127749)
- **Fonts**: Montserrat (brand/display), JetBrains Mono (data/monospace)
- **Design**: Flat design, minimal shadows, compact spacing (2px base)
- **Theme**: CSS variables cho dark/light mode

## Quy trinh duyet (Approval)

He thong ho tro 2 cap duyet:
- **L1**: Duyet cap 1 (budget:approve_l1, planning:approve_l1, proposal:approve_l1)
- **L2**: Duyet cap 2 (budget:approve_l2, planning:approve_l2, proposal:approve_l2)

## API

Tat ca API call di qua Axios instance tai `src/services/api.js`:
- Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:4000/api/v1`)
- JWT Bearer token tu dinh kem tu `localStorage`
- Auto refresh token khi nhan 401
- Response pattern: `response.data.data || response.data`

## Ghi chu

- Project nay duoc migrate tu Create React App (CRA) sang Next.js App Router
- CRA goc duoc giu lai lam tham chieu
- TypeScript migration la task rieng (chua thuc hien)
- Tailwind v4 migration la task rieng (dang dung v3)
