# Money Manager — Frontend Implementation Plan

> **Stack**: React 19 + TypeScript + TailwindCSS (no shadcn/ui) + Recharts + lucide-react  
> **Backend status**: Phase 1–3 APIs ready (auth, accounts, categories, transactions, budgets). Phase 4–7 APIs not yet built — those pages will get UI shells with "Coming Soon" banners.  
> **Current frontend**: `HomePage`, `LoginPage`, `SignupPage`, `DashboardPage` (placeholder), `Navbar`, `ProtectedRoute`, `authStore`, `axiosClient`, `authApi` — everything else is missing.

---

## Overview

| Phase | Scope | API Status |
|---|---|---|
| **A** | Foundation — deps, types, API layer, UI components, AppLayout | No API needed |
| **B** | Core CRUD Pages — Dashboard, Accounts, Categories, Transactions, Budgets | ✅ Live APIs |
| **C** | Settings & Profile | ✅ Live APIs |
| **D** | Reports — charts with client-side aggregation | ✅ Uses Phase 3 APIs |
| **E** | Subscriptions + Shared Wallets shells | ⏳ Backend Phase 4 |
| **F** | Routing, toast notifications, responsive polish | No API needed |

---

## Phase A: Foundation

### A1 — Install npm Dependencies

```bash
cd frontend
npm install recharts react-hot-toast date-fns lucide-react
npm install --save-dev @types/recharts
```

| Package | Purpose |
|---|---|
| `recharts` | All chart visualizations (pie, line, bar) |
| `react-hot-toast` | Success / error toast notifications |
| `date-fns` | Date formatting (`format`, `parseISO`, `startOfMonth`, etc.) |
| `lucide-react` | Icon library for navigation + UI (tree-shakeable) |

---

### A2 — TypeScript Types (matching backend DTOs exactly)

Directory: `src/types/`

#### `src/types/common.ts`
```typescript
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}
```

#### `src/types/account.ts`
```typescript
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'CRYPTO' | 'CASH'

export interface AccountResponse {
  id: number
  name: string
  accountType: AccountType
  currency: string
  balance: number
  institution: string | null
  accountNumberMasked: string | null
  isActive: boolean
  createdAt: string
}

export interface AccountRequest {
  name: string
  accountType: AccountType
  currency: string
  initialBalance: number
  institution?: string
  accountNumberMasked?: string
}
```

#### `src/types/transaction.ts`
```typescript
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export interface TransactionResponse {
  id: number
  accountId: number
  accountName: string
  categoryId: number | null
  categoryName: string | null
  categoryIcon: string | null
  categoryColor: string | null
  amount: number
  currency: string
  convertedAmount: number | null
  transactionType: TransactionType
  merchant: string | null
  description: string | null
  transactionDate: string
  isRecurring: boolean
  isAutoCategorized: boolean
  tags: string | null
  createdAt: string
}

export interface TransactionRequest {
  accountId: number
  categoryId?: number
  amount: number
  currency: string
  transactionType: TransactionType
  merchant?: string
  description?: string
  transactionDate: string
  toAccountId?: number
  tags?: string
}

export interface TransactionFilters {
  page?: number
  size?: number
  from?: string
  to?: string
  categoryId?: number
  accountId?: number
  type?: TransactionType
  search?: string
}
```

#### `src/types/category.ts`
```typescript
export type CategoryType = 'INCOME' | 'EXPENSE'

export interface CategoryResponse {
  id: number
  name: string
  icon: string
  color: string
  categoryType: CategoryType
  parentId: number | null
  parentName: string | null
  isSystem: boolean
  sortOrder: number
}

export interface CategoryRequest {
  name: string
  icon: string
  color: string
  categoryType: CategoryType
  parentId?: number
}
```

#### `src/types/budget.ts`
```typescript
export type BudgetStatus = 'UNDER' | 'NEAR' | 'OVER'

export interface BudgetSummaryResponse {
  budgetId: number
  categoryId: number
  categoryName: string
  categoryIcon: string
  categoryColor: string
  monthYear: string
  limitAmount: number
  spentAmount: number
  remainingAmount: number
  percentUsed: number
  currency: string
  status: BudgetStatus
}

export interface BudgetRequest {
  categoryId: number
  monthYear: string
  limitAmount: number
  currency: string
  alertAt80: boolean
  alertAt100: boolean
}
```

---

### A3 — API Service Files

Directory: `src/api/` — all use the existing `axiosClient`

#### `src/api/accountApi.ts`
```typescript
GET    /accounts                    → AccountResponse[]
GET    /accounts/{id}               → AccountResponse
POST   /accounts           body     → AccountResponse
PUT    /accounts/{id}      body     → AccountResponse
DELETE /accounts/{id}               → void
```

#### `src/api/transactionApi.ts`
```typescript
GET    /transactions   ?page&size&from&to&categoryId&accountId&type&search
                                    → PageResponse<TransactionResponse>
GET    /transactions/{id}           → TransactionResponse
POST   /transactions   body         → TransactionResponse
PUT    /transactions/{id}  body     → TransactionResponse
DELETE /transactions/{id}           → void
```

#### `src/api/categoryApi.ts`
```typescript
GET    /categories     ?type        → CategoryResponse[]
POST   /categories     body         → CategoryResponse
PUT    /categories/{id}  body       → CategoryResponse
DELETE /categories/{id}             → void
```

#### `src/api/budgetApi.ts`
```typescript
GET    /budgets        ?month       → BudgetSummaryResponse[]
POST   /budgets        body         → BudgetSummaryResponse
PUT    /budgets/{id}   body         → BudgetSummaryResponse
DELETE /budgets/{id}                → void
```

#### `src/api/userApi.ts`
```typescript
GET    /users/me                    → UserResponse
PUT    /users/me       body         → UserResponse
PUT    /users/me/password  body     → void
DELETE /users/me                    → void
```

---

### A4 — Reusable UI Components

Directory: `src/components/ui/`

| Component | Purpose |
|---|---|
| `Modal.tsx` | Overlay dialog with title, body, footer slots. Closes on backdrop click or Escape key. |
| `ConfirmDialog.tsx` | Destructive action confirmation — message, Cancel button, red Confirm button. Built on Modal. |
| `LoadingSpinner.tsx` | Centered animated spinner (Tailwind `animate-spin`). Accepts `size` prop. |
| `EmptyState.tsx` | Centered icon + heading + message + optional CTA button for empty list states. |
| `Badge.tsx` | Colored pill. Variants: `income` (green), `expense` (red), `transfer` (blue), `under` (green), `near` (yellow), `over` (red), `custom` (bg + text color props). |
| `StatsCard.tsx` | Card with Lucide icon (colored), label, large value, optional trend indicator (+/- % vs last period). |

---

### A5 — App Layout with Sidebar

File: `src/components/AppLayout.tsx`

**Sidebar navigation items:**
| Icon | Label | Route |
|---|---|---|
| `LayoutDashboard` | Dashboard | `/dashboard` |
| `CreditCard` | Accounts | `/accounts` |
| `ArrowLeftRight` | Transactions | `/transactions` |
| `Tag` | Categories | `/categories` |
| `Target` | Budgets | `/budgets` |
| `BarChart3` | Reports | `/reports` |
| `RefreshCw` | Subscriptions | `/subscriptions` |
| `Users` | Shared Wallets | `/wallets` |
| `Settings` | Settings | `/settings` |

**Layout structure:**
```
┌─────────────────────────────────────────────────────┐
│ Sidebar (240px, fixed)  │  Main content area         │
│                         │  ┌─────────────────────┐  │
│ [Logo] Money Manager    │  │ Top bar              │  │
│                         │  │ user name | logout   │  │
│ ● Dashboard             │  ├─────────────────────┤  │
│   Accounts              │  │                     │  │
│   Transactions          │  │  <Outlet />         │  │
│   Categories            │  │                     │  │
│   Budgets               │  │                     │  │
│   Reports               │  └─────────────────────┘  │
│   Subscriptions         │                            │
│   Shared Wallets        │                            │
│   Settings              │                            │
└─────────────────────────────────────────────────────┘
```

**Mobile behavior:** Hamburger icon in top bar → slide-over sidebar with dark overlay. Sidebar hidden by default on screens < `lg`.

---

## Phase B: Core CRUD Pages

> All pages in this phase wire to **live backend APIs**. Use `useState` + `useEffect` + API functions. Show `LoadingSpinner` while fetching, error message or toast on failure, `EmptyState` when list is empty.

---

### B1 — Dashboard Page

File: `src/pages/DashboardPage.tsx` *(full rewrite of placeholder)*

**Layout:**
```
Welcome back, [Name]!   [Today's date]

[Total Balance] [Month Income] [Month Expenses] [Active Budgets]
  (StatsCard)   (StatsCard ↑) (StatsCard ↓)    (StatsCard)

┌─────────────────────────┐  ┌──────────────────────────┐
│  Spending This Month    │  │  Recent Transactions      │
│  (Recharts PieChart     │  │  Last 5 transactions      │
│   donut, top 5          │  │  icon | merchant | amount │
│   categories)           │  │  date | account           │
└─────────────────────────┘  └──────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Budget Overview (current month)                     │
│  [Groceries ████████░░ 80% · $400/$500]              │
│  [Dining    ██████████ 110% · $220/$200] ← red       │
│  [Transport ████░░░░░░ 40% · $40/$100]               │
└──────────────────────────────────────────────────────┘
                              [+ Add Transaction] [+ Add Account]
```

**Data sources:**
- `GET /accounts` → sum balances for Total Balance
- `GET /transactions?from=YYYY-MM-01&to=YYYY-MM-31&size=100` (current month) → compute month income, month expenses, build donut data; also slice last 5 for recent list
- `GET /budgets` (current month) → show top 3 budget cards

**Chart spec — Spending Donut:**
- `PieChart` with `Pie` (inner radius 60, outer radius 100)
- Each slice: `{ name: categoryName, value: totalAmount, fill: categoryColor }`
- `Tooltip` showing name + `$amount`
- `Legend` below showing category name + color dot
- Max 5 slices; remaining grouped as "Other"

---

### B2 — Accounts Page

File: `src/pages/AccountsPage.tsx`

**Features:**
- **Summary bar** at top: "$12,450.00 Total Balance across 3 accounts"
- **Account cards grid** (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
  - Each card: account name, AccountType badge, balance (large, bold), institution name, currency code, created date
  - Hover: edit (pencil icon) + delete (trash icon) buttons appear
  - Balance color: green if ≥ 0, red if negative (credit accounts)
- **"+ Add Account"** button → opens Add Modal
- **Add/Edit Modal form fields:**
  - Name (text, required)
  - Account Type (select: CHECKING / SAVINGS / CREDIT / INVESTMENT / CRYPTO / CASH)
  - Currency (text input, 3 chars, default "USD")
  - Initial Balance / Balance (number input)
  - Institution (text, optional)
  - Account Number (text, optional, for display masking)
- **Delete** → `ConfirmDialog`: "Delete '[account name]'? This will permanently delete the account and all associated transactions."

**AccountType badge colors:**
| Type | Color |
|---|---|
| CHECKING | Indigo |
| SAVINGS | Green |
| CREDIT | Red |
| INVESTMENT | Purple |
| CRYPTO | Orange |
| CASH | Gray |

---

### B3 — Categories Page

File: `src/pages/CategoriesPage.tsx`

**Features:**
- **Tab bar**: `EXPENSE` | `INCOME` — active tab highlighted, switches category list
- **Category list** (vertical list with dividers):
  - Each row: large icon emoji, name (bold), color dot (round, CSS `background: categoryColor`), type badge, "System" badge if `isSystem: true`, parent category name if `parentId ≠ null`
  - Edit + Delete buttons (disabled/hidden for system categories)
- **"+ Add Category"** button → Add Modal
- **Add/Edit Modal form fields:**
  - Name (text, required)
  - Icon (text input accepting emoji, e.g. 🛒)
  - Color (preset palette: 12 swatches; clicking swatch sets color; displays hex value)
  - Category type (auto-set from active tab, shown as read-only)
  - Parent Category (select from existing categories of same type; optional)
- **Delete** → `ConfirmDialog`: "Delete '[name]'? Any transactions using this category will be uncategorized."
- System categories show a lock icon and cannot be edited or deleted

**Default color palette swatches:**
`#EF4444` `#F97316` `#EAB308` `#22C55E` `#14B8A6` `#3B82F6` `#8B5CF6` `#EC4899` `#6B7280` `#0EA5E9` `#84CC16` `#F43F5E`

---

### B4 — Transactions Page

File: `src/pages/TransactionsPage.tsx`

**Features:**
- **Filter bar** (sticky, always visible):
  - From date (date input)
  - To date (date input)
  - Category (select, populated from `GET /categories`)
  - Account (select, populated from `GET /accounts`)
  - Type (select: All / INCOME / EXPENSE / TRANSFER)
  - Search (text, debounced 400ms)
  - "Clear Filters" button
- **Transactions table** (horizontally scrollable on mobile):
  | Column | Description |
  |---|---|
  | Date | `MMM d, yyyy` format |
  | Merchant | Merchant name or "—" if empty |
  | Category | Emoji icon + colored badge with category name |
  | Account | Account name |
  | Type | Badge (green INCOME / red EXPENSE / blue TRANSFER) |
  | Amount | Green `+$X.XX` for income, Red `-$X.XX` for expense |
  | Actions | Edit (pencil) / Delete (trash) icons |
- **Pagination bar** below table:
  - Page size selector: 10 / 20 / 50 items per page
  - "Showing X–Y of Z transactions"
  - ← Prev / Next → buttons
  - "Page X of Y"
- **"+ Add Transaction"** button (top right)
- **Add/Edit Modal form fields:**
  - Account (select, required — lists all accounts)
  - Category (select, optional — filters by transaction type)
  - Transaction Type (select: INCOME / EXPENSE / TRANSFER, required)
  - Amount (number, required, positive)
  - Currency (text, 3 chars, default from account)
  - Date (date input, required, default today)
  - Merchant (text, optional)
  - Description (textarea, optional)
  - Tags (text input, comma-separated, stored as JSON array)
  - To Account (select, only shown when type = TRANSFER)
- **Empty state**: "No transactions found. Add your first transaction to get started."

---

### B5 — Budgets Page

File: `src/pages/BudgetsPage.tsx`

**Features:**
- **Month navigator**: `← March 2026 →` — clicking arrows changes month, fetches `GET /budgets?month=YYYY-MM`
- **Summary bar**: Total Budgeted `$X,XXX` · Total Spent `$X,XXX` · `XX%` Used · `X` budgets
- **Budget card grid** (responsive: 1 col mobile, 2 col md, 3 col lg):
  - Each card:
    - Category icon (emoji, large) + Category name + month badge
    - Progress bar: width = `percentUsed%`, capped at 100% visually
      - `< 80%` → green (`bg-green-500`)
      - `80–99%` → yellow (`bg-yellow-500`)
      - `≥ 100%` → red (`bg-red-500`)
    - Text: "$X spent of $X limit"
    - Remaining: "$X remaining" (red if 0 or negative)
    - BudgetStatus badge: UNDER (green) / NEAR (yellow) / OVER (red)
    - Edit + Delete buttons
- **"+ Add Budget"** button → Modal
- **Add/Edit Modal form fields:**
  - Category (select, **EXPENSE categories only**, required)
  - Month (month input `<input type="month">`, default current month)
  - Budget Limit (number, required)
  - Currency (text, 3 chars)
  - Alert at 80% (checkbox, default checked)
  - Alert at 100% (checkbox, default checked)
- **Empty state**: "No budgets for [Month Year]. Add a budget to start tracking your spending."

---

## Phase C: Settings & Profile

### C1 — Settings Page

File: `src/pages/SettingsPage.tsx`

**Sections (vertical stack, each in its own card):**

**1. Profile**
- Avatar URL (text input with live preview — circular `<img>` fallback to initials)
- Display Name (text input)
- Email (read-only, grayed text)
- Default Currency (select: USD / EUR / GBP / INR / other text input)
- "Save Changes" button → `PUT /users/me` → success toast

**2. Security — Change Password**
- Current Password (password input with show/hide toggle)
- New Password (password input with strength indicator)
- Confirm New Password (password input)
- "Update Password" button → `PUT /users/me/password` → success toast + clear form

**3. Danger Zone** (red-bordered card)
- "Delete My Account" button (red, outline) → `ConfirmDialog`:
  - "This action is permanent and cannot be undone. All your financial data will be deleted."
  - Type "DELETE" in text input to enable confirm button
  - On confirm: `DELETE /users/me` → logout → redirect to `/`

---

## Phase D: Reports

### D1 — Reports Page

File: `src/pages/ReportsPage.tsx`

> Phase 6 backend report APIs are not built yet. Reports are computed **client-side** by calling existing Phase 3 endpoints and aggregating in the browser.

**Layout:**
- **Tab bar**: Spending | Trends | Budgets
- **Date range controls** (shared across tabs): From date · To date · "This Month" / "Last Month" / "Last 3 Months" quick presets
- "Generate Report" button fetches fresh data for the selected range

---

**Tab 1 — Spending Distribution**

Chart: `Recharts PieChart` (donut)  
Data: `GET /transactions?from=...&to=...&type=EXPENSE&size=500` → group by categoryId → compute totals + percentages

```
Legend:
● Groceries    $450  (32%)
● Dining       $280  (20%)
● Transport    $190  (13%)
● ...
```

Chart interactions:
- Hover slice → tooltip: `{categoryName}: $amount (XX%)`
- Click slice → filter transactions table (future enhancement)

---

**Tab 2 — Income vs Expense Trend**

Chart: `Recharts LineChart`  
Data: `GET /transactions?from=...&to=...&size=1000` → group by month (format `MMM yyyy`) → sum INCOME and EXPENSE separately

Two lines:
- 🟢 Income (green, `#22C55E`)
- 🔴 Expenses (red, `#EF4444`)

Axes: X = month label, Y = dollar amount  
Tooltip: shows both values for hovered month  
Reference line at 0 for visual clarity

---

**Tab 3 — Budget vs Actual**

Chart: `Recharts BarChart` (grouped bars)  
Data: `GET /budgets?month=CURRENTMONTH` → each budget provides `limitAmount` + `spentAmount`

Two bars per category:
- 🔵 Budget Limit (blue, `#3B82F6`)
- 🟠 Actual Spent (orange, `#F97316`)

Bars in red if `spentAmount > limitAmount`  
X axis: category names  
Y axis: dollar amounts  
Tooltip: "Budget: $X · Spent: $Y"

---

## Phase E: Future Phase Shells

### E1 — Subscriptions Page

File: `src/pages/SubscriptionsPage.tsx`

Pre-built layout with "Coming Soon" banner:
- Header: "Subscriptions" + description
- Yellow banner: "🚧 Subscription tracking is coming in Phase 4. The backend will detect recurring payments automatically."
- Mock layout (static, no API): 3-column grid of subscription cards showing merchant name, amount, frequency, next due date, category badge
- "Upcoming this month" section with calendar-style list

---

### E2 — Shared Wallets Page

File: `src/pages/SharedWalletsPage.tsx`

Pre-built layout with "Coming Soon" banner:
- Yellow banner: "🚧 Shared wallets are coming in Phase 4."
- Mock layout: wallet cards with member avatar circles, balance, invite button
- Shared transaction feed mockup

---

## Phase F: Routing, Toasts & Polish

### F1 — Update App.tsx Routing

```typescript
// Public routes — with Navbar
<Route path="/" element={<HomePage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<SignupPage />} />

// Protected routes — wrapped in AppLayout
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/accounts" element={<AccountsPage />} />
    <Route path="/transactions" element={<TransactionsPage />} />
    <Route path="/categories" element={<CategoriesPage />} />
    <Route path="/budgets" element={<BudgetsPage />} />
    <Route path="/reports" element={<ReportsPage />} />
    <Route path="/subscriptions" element={<SubscriptionsPage />} />
    <Route path="/wallets" element={<SharedWalletsPage />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Route>
</Route>

<Route path="*" element={<Navigate to="/" replace />} />
```

---

### F2 — Toast Notifications

Add to `main.tsx`:
```typescript
import { Toaster } from 'react-hot-toast'
// Inside render:
<Toaster position="top-right" toastOptions={{ duration: 3000 }} />
```

**Toast usage pattern across all CRUD pages:**
```typescript
// Success
toast.success('Account created successfully')
toast.success('Transaction deleted')

// Error
toast.error('Failed to load accounts. Please try again.')
toast.error(error?.response?.data?.message ?? 'Something went wrong')
```

---

### F3 — Responsive Design Rules

| Screen | Sidebar | Cards | Table | Modals |
|---|---|---|---|---|
| `< lg` (mobile) | Hidden, hamburger trigger, slide-over overlay | 1 column | Horizontal scroll | Full width (no rounded border) |
| `lg` (tablet) | Always visible, 240px | 2 columns | Normal | Max-width centered |
| `> xl` (desktop) | Always visible, 240px | 3 columns | Normal | Max-width centered |

Key Tailwind patterns:
- Sidebar: `hidden lg:flex` for the sidebar, `lg:pl-60` for main content offset
- Cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Table wrapper: `overflow-x-auto`
- Modals: `w-full max-w-md mx-auto` with `sm:rounded-2xl`

---

## New Files Summary

### Types (5 files)
```
src/types/
  common.ts          PageResponse<T>, ApiError
  account.ts         AccountResponse, AccountRequest, AccountType
  transaction.ts     TransactionResponse, TransactionRequest, TransactionType, TransactionFilters
  category.ts        CategoryResponse, CategoryRequest, CategoryType
  budget.ts          BudgetSummaryResponse, BudgetRequest, BudgetStatus
```

### API Services (5 files)
```
src/api/
  accountApi.ts      CRUD for /accounts
  transactionApi.ts  Paginated/filtered CRUD for /transactions
  categoryApi.ts     CRUD with type filter for /categories
  budgetApi.ts       CRUD with month filter for /budgets
  userApi.ts         Profile/password/delete for /users/me
```

### UI Components (6 files)
```
src/components/ui/
  Modal.tsx          Overlay dialog
  ConfirmDialog.tsx  Destructive action confirmation
  LoadingSpinner.tsx Centered spinner
  EmptyState.tsx     Empty list placeholder
  Badge.tsx          Colored pill
  StatsCard.tsx      Stat display card
```

### Layout (1 file)
```
src/components/
  AppLayout.tsx      Sidebar + topbar layout for authenticated pages
```

### Pages (8 new files)
```
src/pages/
  AccountsPage.tsx
  CategoriesPage.tsx
  TransactionsPage.tsx
  BudgetsPage.tsx
  ReportsPage.tsx
  SettingsPage.tsx
  SubscriptionsPage.tsx
  SharedWalletsPage.tsx
```

### Modified Files (3)
```
frontend/package.json            add recharts, react-hot-toast, date-fns, lucide-react
frontend/src/App.tsx             new routes + AppLayout wrapper
frontend/src/main.tsx            Toaster provider
frontend/src/pages/DashboardPage.tsx   full rewrite with real data + charts
```

**Total: ~28 files created or modified**

---

## Verification Checklist

- [ ] `cd frontend && npm run build` — zero TypeScript errors, successful production build
- [ ] **Auth flow**: register → login → dashboard shows real data → logout → protected route redirects to login
- [ ] **CRUD flow**: create account → create category → add transaction → dashboard updates (balance, spending donut, recent list)
- [ ] **Budget flow**: create budget → add expense in that category → budget card updates progress bar + color threshold
- [ ] **Filters**: date range / category / account / type / search all filter transaction table correctly
- [ ] **Pagination**: add >20 transactions → page nav, page size selector all work; "Showing X–Y of Z" accurate
- [ ] **Reports**: donut chart shows category distribution, line chart shows monthly income vs expense, bar chart shows budget vs actual
- [ ] **Settings**: change display name → reflected in sidebar; change password → can log in with new password
- [ ] **Responsive**: mobile sidebar collapses, tables scroll horizontally, modals fill screen width, stat cards stack
- [ ] **Empty states**: new account with no data shows helpful empty state on every page
- [ ] **Error handling**: API failure shows error toast; no blank white screens (all loading states handled)
- [ ] **Toast notifications**: all create/update/delete operations show success toast; errors show error toast

---

## Decisions & Rationale

| Decision | Choice | Reason |
|---|---|---|
| Component library | None — pure Tailwind | User specified "React + Tailwind only" |
| Chart library | Recharts | User selection; integrates cleanly with React |
| Icon library | lucide-react | Lightweight, tree-shakeable, great Tailwind DX |
| API state management | useState + useEffect | Keep bundle lean; no extra dependencies needed at this scale |
| Global state | Zustand (existing authStore only) | No new stores needed; page-level state via useState |
| Reports data | Client-side aggregation | Phase 6 backend report APIs not yet built |
| Phase 4–7 pages | UI shells with "Coming Soon" | Provides navigation structure without blocking on backend |
| Dark mode | Not in this plan | Deferred to Extra Features phase |
| Date formatting | date-fns | Lightweight, functional, tree-shakeable |
