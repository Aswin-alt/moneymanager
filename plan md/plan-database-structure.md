# Money Manager — MySQL 8 Database Structure

> Complete schema reference for the Money Manager Intelligent Financial Assistant.
> **15 tables** across 12 Flyway migrations.

---

## Conventions

| Convention | Standard |
|---|---|
| Engine | InnoDB (transactional, FK support) |
| Charset | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |
| Table names | `snake_case`, plural (`users`, `accounts`) |
| Column names | `snake_case` (`transaction_date`, `is_active`) |
| Primary key | `id BIGINT AUTO_INCREMENT` on every table |
| Timestamps | `TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP` |
| Auto-update | `ON UPDATE CURRENT_TIMESTAMP` on `updated_at` columns |
| Booleans | `BOOLEAN NOT NULL DEFAULT TRUE/FALSE` |
| Money | `DECIMAL(15,2)` — supports up to 9,999,999,999,999.99 |
| Enums | MySQL `ENUM(...)` — enforced at DB level |
| Soft delete | `is_active BOOLEAN` flag (no physical deletes on users/accounts) |
| FK on delete | `CASCADE` for ownership (user → accounts), `SET NULL` for optional refs (transaction → category) |

---

## Entity-Relationship Diagram

```
                                  ┌──────────────────────┐
                                  │       users           │
                                  │──────────────────────│
                                  │ id (PK)              │
                                  │ email (UNIQUE)       │
                                  │ password_hash        │
                                  │ display_name         │
                                  │ default_currency     │
                                  └──────┬───────────────┘
                                         │
           ┌──────────────┬──────────────┼──────────────┬──────────────┬──────────────┐
           │              │              │              │              │              │
           ▼              ▼              ▼              ▼              ▼              ▼
    ┌─────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐
    │  accounts   │ │categories │ │  budgets  │ │  assets   │ │liabilities│ │notifications │
    │─────────────│ │───────────│ │───────────│ │───────────│ │───────────│ │──────────────│
    │ user_id(FK) │ │ user_id   │ │ user_id   │ │ user_id   │ │ user_id   │ │ user_id      │
    │ balance     │ │ parent_id │ │category_id│ │ asset_type│ │ liab_type │ │ notif_type   │
    │ account_type│ │ cat_type  │ │ month_year│ │ value     │ │ balance   │ │ is_read      │
    └──────┬──────┘ │ is_system │ └─────┬─────┘ └───────────┘ └───────────┘ └──────────────┘
           │        └─────┬─────┘       │
           │              │             │
           ▼              ▼             │          ┌────────────────────────┐
    ┌──────────────────────────┐        │          │ recurring_transactions │
    │      transactions        │        │          │────────────────────────│
    │──────────────────────────│        │          │ user_id (FK)           │
    │ account_id (FK)          │◄───────┘          │ category_id (FK)      │
    │ category_id (FK)         │                   │ merchant_pattern      │
    │ user_id (FK)             │                   │ frequency             │
    │ amount / currency        │                   │ next_due_date         │
    │ transaction_type         │                   └────────────────────────┘
    │ merchant / description   │
    │ transaction_date         │          ┌─────────────────────────────┐
    └──────────────────────────┘          │  merchant_category_mappings │
                                          │─────────────────────────────│
    ┌───────────────┐                     │ user_id (FK)                │
    │ shared_wallets│                     │ category_id (FK)            │
    │───────────────│                     │ merchant_pattern            │
    │ created_by(FK)│                     │ confidence                  │
    └──────┬────────┘                     └─────────────────────────────┘
           │
           ▼                              ┌──────────────────────┐
    ┌────────────────────┐                │  net_worth_snapshots  │
    │shared_wallet_members│               │──────────────────────│
    │────────────────────│                │ user_id (FK)          │
    │ wallet_id (FK)     │                │ snapshot_date         │
    │ user_id (FK)       │                │ total_assets          │
    │ role (ENUM)        │                │ total_liabilities     │
    └────────────────────┘                │ net_worth             │
                                          └──────────────────────┘

    ┌────────────────┐           ┌──────────────┐
    │ currency_rates │           │  audit_log   │
    │────────────────│           │──────────────│
    │ base_currency  │           │ user_id (FK) │
    │ target_currency│           │ action       │
    │ rate           │           │ entity_type  │
    └────────────────┘           │ old/new JSON │
                                 └──────────────┘
```

**Relationship Summary**

```
users 1──N accounts 1──N transactions N──1 categories (+ self-ref parent_id)
users 1──N categories
users 1──N budgets N──1 categories
users 1──N recurring_transactions N──1 categories
users 1──N assets
users 1──N liabilities
users 1──N net_worth_snapshots
users 1──N notifications
users 1──N merchant_category_mappings N──1 categories
users 1──N audit_log
users 1──N shared_wallet_members N──1 shared_wallets
users 1──N shared_wallets (via created_by)
```

---

## Table Definitions (15 tables)

### 1. `users`

> Authentication, profile, and preferences.

```sql
CREATE TABLE users (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    email               VARCHAR(255)  NOT NULL UNIQUE,
    password_hash       VARCHAR(255)  NOT NULL,
    display_name        VARCHAR(100)  NOT NULL,
    default_currency    VARCHAR(3)    NOT NULL DEFAULT 'USD',
    avatar_url          VARCHAR(500),
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    email_verified      BOOLEAN       NOT NULL DEFAULT FALSE,
    two_factor_enabled  BOOLEAN       NOT NULL DEFAULT FALSE,
    two_factor_secret   VARCHAR(255),
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `email` | VARCHAR(255) UNIQUE | Login identifier |
| `password_hash` | VARCHAR(255) | BCrypt hash (strength 12) |
| `default_currency` | VARCHAR(3) | ISO 4217 code |
| `is_active` | BOOLEAN | Soft-delete flag |
| `two_factor_*` | — | TOTP 2FA fields (Phase 8+) |

---

### 2. `accounts`

> Financial accounts (bank, credit card, investment, crypto, cash).

```sql
CREATE TABLE accounts (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id               BIGINT        NOT NULL,
    name                  VARCHAR(100)  NOT NULL,
    account_type          ENUM('CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT', 'CRYPTO', 'CASH') NOT NULL,
    currency              VARCHAR(3)    NOT NULL DEFAULT 'USD',
    balance               DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    institution           VARCHAR(100),
    account_number_masked VARCHAR(20),
    is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_accounts_user (user_id),
    INDEX idx_accounts_type (user_id, account_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `balance` | DECIMAL(15,2) | Recalculated on every transaction change |
| `account_number_masked` | VARCHAR(20) | Last 4 digits only (e.g., `****1234`) |
| `is_active` | BOOLEAN | Soft-delete — keeps transaction history |

---

### 3. `categories`

> Income/expense classification. Supports system defaults + user custom + subcategories.

```sql
CREATE TABLE categories (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT,                                        -- NULL = system default
    name            VARCHAR(50)   NOT NULL,
    icon            VARCHAR(50)   NOT NULL DEFAULT '📦',
    color           VARCHAR(7)    NOT NULL DEFAULT '#6B7280',      -- hex color
    category_type   ENUM('INCOME', 'EXPENSE') NOT NULL,
    parent_id       BIGINT,                                        -- self-ref for subcategories
    is_system       BOOLEAN       NOT NULL DEFAULT FALSE,
    sort_order      INT           NOT NULL DEFAULT 0,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_user (user_id),
    INDEX idx_categories_type (user_id, category_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `user_id` | BIGINT NULL | `NULL` → system-wide default category |
| `parent_id` | BIGINT NULL | Self-referencing FK for subcategory hierarchy |
| `is_system` | BOOLEAN | `TRUE` → cannot be deleted by user |
| `icon` | VARCHAR(50) | Emoji or icon identifier |
| `color` | VARCHAR(7) | Hex color for UI display |

---

### 4. `transactions`

> The core financial data table. Every income/expense/transfer is a row here.

```sql
CREATE TABLE transactions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id          BIGINT        NOT NULL,
    category_id         BIGINT,
    user_id             BIGINT        NOT NULL,
    amount              DECIMAL(15,2) NOT NULL,
    currency            VARCHAR(3)    NOT NULL,
    converted_amount    DECIMAL(15,2),                              -- in user's default currency
    transaction_type    ENUM('INCOME', 'EXPENSE', 'TRANSFER') NOT NULL,
    merchant            VARCHAR(200),
    description         VARCHAR(500),
    transaction_date    DATE          NOT NULL,
    is_recurring        BOOLEAN       NOT NULL DEFAULT FALSE,
    recurring_group_id  BIGINT,
    is_auto_categorized BOOLEAN       NOT NULL DEFAULT FALSE,
    tags                JSON,                                       -- ["travel", "business"]
    receipt_url         VARCHAR(500),
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_txn_user_date (user_id, transaction_date),
    INDEX idx_txn_account (account_id, transaction_date),
    INDEX idx_txn_category (user_id, category_id, transaction_date),
    INDEX idx_txn_type (user_id, transaction_type, transaction_date),
    INDEX idx_txn_merchant (user_id, merchant(50)),
    FULLTEXT idx_txn_search (merchant, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `converted_amount` | DECIMAL(15,2) | Auto-filled using FX rate at time of entry |
| `tags` | JSON | Flexible tagging (no join table needed) |
| `receipt_url` | VARCHAR(500) | OCR receipt scanner (Phase 8+) |
| `is_auto_categorized` | BOOLEAN | `TRUE` if AI assigned the category |
| `FULLTEXT` | merchant, description | Powers transaction search |

**Index Strategy**:
- `idx_txn_user_date` — Dashboard queries: "show my transactions this month"
- `idx_txn_account` — Account detail page: transactions for one account
- `idx_txn_category` — Reports: spending per category in a date range
- `idx_txn_type` — Income vs. expense trend queries
- `idx_txn_merchant` — Prefix search on merchant name (50 chars)
- `idx_txn_search` — FULLTEXT search across merchant + description

---

### 5. `budgets`

> Monthly spending limits per category.

```sql
CREATE TABLE budgets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    category_id     BIGINT        NOT NULL,
    month_year      VARCHAR(7)    NOT NULL,                -- '2026-03'
    limit_amount    DECIMAL(15,2) NOT NULL,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'USD',
    alert_at_80     BOOLEAN       NOT NULL DEFAULT TRUE,
    alert_at_100    BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY uk_budget (user_id, category_id, month_year),
    INDEX idx_budget_month (user_id, month_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `month_year` | VARCHAR(7) | Format `YYYY-MM` — e.g., `2026-03` |
| `uk_budget` | UNIQUE | One budget per user per category per month |
| `alert_at_80/100` | BOOLEAN | Controls whether 80%/100% notifications fire |

---

### 6. `recurring_transactions`

> Detected or user-defined recurring payments (subscriptions, rent, salary).

```sql
CREATE TABLE recurring_transactions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT        NOT NULL,
    merchant_pattern    VARCHAR(200)  NOT NULL,
    category_id         BIGINT,
    estimated_amount    DECIMAL(15,2) NOT NULL,
    currency            VARCHAR(3)    NOT NULL DEFAULT 'USD',
    frequency           ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL,
    next_due_date       DATE          NOT NULL,
    last_charged_date   DATE,
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    is_auto_detected    BOOLEAN       NOT NULL DEFAULT TRUE,
    alert_days_before   INT           NOT NULL DEFAULT 3,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_recurring_user (user_id),
    INDEX idx_recurring_due (user_id, next_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `merchant_pattern` | VARCHAR(200) | Pattern matched against transaction merchants |
| `is_auto_detected` | BOOLEAN | `TRUE` if the system detected this subscription |
| `alert_days_before` | INT | Days before `next_due_date` to send notification |
| `frequency` | ENUM | Includes BIWEEKLY and QUARTERLY beyond basic set |

---

### 7. `shared_wallets`

> Shared expense groups (roommates, couples, families).

```sql
CREATE TABLE shared_wallets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    description     VARCHAR(500),
    created_by      BIGINT        NOT NULL,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'USD',
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 8. `shared_wallet_members`

> Membership and roles within shared wallets.

```sql
CREATE TABLE shared_wallet_members (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    wallet_id       BIGINT        NOT NULL,
    user_id         BIGINT        NOT NULL,
    role            ENUM('OWNER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    joined_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (wallet_id) REFERENCES shared_wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_wallet_member (wallet_id, user_id),
    INDEX idx_wallet_members (wallet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `uk_wallet_member` | UNIQUE | Prevents duplicate membership |
| `role` | ENUM | `OWNER` can manage members; `MEMBER` can add transactions |

---

### 9. `assets`

> User-owned assets for net worth tracking.

```sql
CREATE TABLE assets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    name            VARCHAR(100)  NOT NULL,
    asset_type      ENUM('CASH', 'INVESTMENT', 'CRYPTO', 'PROPERTY', 'OTHER') NOT NULL,
    current_value   DECIMAL(15,2) NOT NULL,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'USD',
    institution     VARCHAR(100),
    notes           VARCHAR(500),
    last_updated    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assets_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 10. `liabilities`

> Debts, loans, and obligations for net worth tracking.

```sql
CREATE TABLE liabilities (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    name            VARCHAR(100)  NOT NULL,
    liability_type  ENUM('LOAN', 'CREDIT_CARD', 'MORTGAGE', 'OTHER') NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL,
    interest_rate   DECIMAL(5,2),
    currency        VARCHAR(3)    NOT NULL DEFAULT 'USD',
    due_date        DATE,
    notes           VARCHAR(500),
    last_updated    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_liabilities_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 11. `net_worth_snapshots`

> Monthly point-in-time snapshot for net worth growth chart.

```sql
CREATE TABLE net_worth_snapshots (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT        NOT NULL,
    snapshot_date     DATE          NOT NULL,
    cash_total        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    investment_total  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    crypto_total      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    property_total    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_assets      DECIMAL(15,2) NOT NULL,
    total_liabilities DECIMAL(15,2) NOT NULL,
    net_worth         DECIMAL(15,2) NOT NULL,
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_snapshot (user_id, snapshot_date),
    INDEX idx_snapshot_date (user_id, snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `uk_snapshot` | UNIQUE | One snapshot per user per date |
| `cash/investment/crypto/property_total` | DECIMAL | Breakdown by asset type for stacked area chart |

---

### 12. `notifications`

> In-app alerts for budget warnings, subscription reminders, anomalies.

```sql
CREATE TABLE notifications (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT         NOT NULL,
    notification_type ENUM('BUDGET_WARNING', 'BUDGET_EXCEEDED', 'SUBSCRIPTION_DUE',
                           'ANOMALY_DETECTED', 'CASH_FLOW_ALERT', 'SYSTEM') NOT NULL,
    title             VARCHAR(200)   NOT NULL,
    message           VARCHAR(1000)  NOT NULL,
    reference_id      BIGINT,                               -- ID of related entity
    reference_type    VARCHAR(50),                           -- 'BUDGET', 'TRANSACTION', 'SUBSCRIPTION'
    is_read           BOOLEAN        NOT NULL DEFAULT FALSE,
    is_email_sent     BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `reference_id/type` | BIGINT + VARCHAR | Polymorphic reference to the entity that triggered the notification |
| `is_email_sent` | BOOLEAN | Tracks whether the email dispatch job has processed this notification |

---

### 13. `merchant_category_mappings`

> AI auto-categorization rules. Maps merchant names to categories.

```sql
CREATE TABLE merchant_category_mappings (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT,                               -- NULL = global/system mapping
    merchant_pattern  VARCHAR(200)  NOT NULL,                -- keyword or regex pattern
    category_id       BIGINT        NOT NULL,
    confidence        DECIMAL(3,2)  NOT NULL DEFAULT 1.00,   -- 0.00 to 1.00
    usage_count       INT           NOT NULL DEFAULT 0,
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_merchant_user (user_id, merchant_pattern(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `user_id` | BIGINT NULL | `NULL` → global system mapping; otherwise user-specific override |
| `confidence` | DECIMAL(3,2) | ML confidence score; user corrections = `1.00` |
| `usage_count` | INT | Tracks how often this mapping was applied |

---

### 14. `currency_rates`

> Foreign exchange rates for multi-currency support.

```sql
CREATE TABLE currency_rates (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    base_currency     VARCHAR(3)     NOT NULL,
    target_currency   VARCHAR(3)     NOT NULL,
    rate              DECIMAL(12,6)  NOT NULL,
    fetched_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_rate (base_currency, target_currency),
    INDEX idx_rate_base (base_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `rate` | DECIMAL(12,6) | 6 decimal places for FX precision |
| `uk_rate` | UNIQUE | One rate per currency pair; upserted daily |

---

### 15. `audit_log`

> Immutable change log for security and compliance.

```sql
CREATE TABLE audit_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    action          VARCHAR(50)   NOT NULL,                  -- 'CREATE', 'UPDATE', 'DELETE'
    entity_type     VARCHAR(50)   NOT NULL,                  -- 'TRANSACTION', 'ACCOUNT', 'BUDGET'
    entity_id       BIGINT        NOT NULL,
    old_value       JSON,
    new_value       JSON,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_audit_user (user_id, created_at),
    INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
|---|---|---|
| `old_value / new_value` | JSON | Full before/after snapshot of the changed entity |
| `ip_address` | VARCHAR(45) | Supports IPv6 (max 45 chars) |

---

## Default Category Seed Data

> Inserted by migration `V3__create_categories_with_defaults.sql`.
> `user_id = NULL` + `is_system = TRUE` → available to all users.

```sql
-- ── Expense Categories ──────────────────────────────────────────────────────
INSERT INTO categories (user_id, name, icon, color, category_type, is_system, sort_order) VALUES
(NULL, 'Dining',          '🍽️', '#EF4444', 'EXPENSE', TRUE, 1),
(NULL, 'Groceries',       '🛒', '#F97316', 'EXPENSE', TRUE, 2),
(NULL, 'Rent / Housing',  '🏠', '#F59E0B', 'EXPENSE', TRUE, 3),
(NULL, 'Utilities',       '💡', '#EAB308', 'EXPENSE', TRUE, 4),
(NULL, 'Transport',       '🚗', '#84CC16', 'EXPENSE', TRUE, 5),
(NULL, 'Healthcare',      '🏥', '#22C55E', 'EXPENSE', TRUE, 6),
(NULL, 'Entertainment',   '🎬', '#14B8A6', 'EXPENSE', TRUE, 7),
(NULL, 'Shopping',        '🛍️', '#06B6D4', 'EXPENSE', TRUE, 8),
(NULL, 'Education',       '📚', '#3B82F6', 'EXPENSE', TRUE, 9),
(NULL, 'Insurance',       '🛡️', '#6366F1', 'EXPENSE', TRUE, 10),
(NULL, 'Subscriptions',   '📱', '#8B5CF6', 'EXPENSE', TRUE, 11),
(NULL, 'Travel',          '✈️', '#A855F7', 'EXPENSE', TRUE, 12),
(NULL, 'Personal Care',   '💇', '#D946EF', 'EXPENSE', TRUE, 13),
(NULL, 'Gifts & Donations','🎁','#EC4899', 'EXPENSE', TRUE, 14),
(NULL, 'Taxes',           '🏛️', '#F43F5E', 'EXPENSE', TRUE, 15),
(NULL, 'Other Expense',   '📦', '#6B7280', 'EXPENSE', TRUE, 99);

-- ── Income Categories ───────────────────────────────────────────────────────
INSERT INTO categories (user_id, name, icon, color, category_type, is_system, sort_order) VALUES
(NULL, 'Salary',          '💰', '#22C55E', 'INCOME', TRUE, 1),
(NULL, 'Freelance',       '💻', '#14B8A6', 'INCOME', TRUE, 2),
(NULL, 'Investments',     '📈', '#3B82F6', 'INCOME', TRUE, 3),
(NULL, 'Business',        '🏢', '#6366F1', 'INCOME', TRUE, 4),
(NULL, 'Rental Income',   '🏘️', '#8B5CF6', 'INCOME', TRUE, 5),
(NULL, 'Refunds',         '↩️', '#06B6D4', 'INCOME', TRUE, 6),
(NULL, 'Other Income',    '📦', '#6B7280', 'INCOME', TRUE, 99);
```

---

## Flyway Migration Plan

### Execution Order & Dependencies

```
V1  users                              ← no dependencies
 ├──► V2  accounts                     ← depends on V1 (users.id)
 ├──► V3  categories + seed data       ← depends on V1 (users.id)
 │     ├──► V4  transactions           ← depends on V2 (accounts.id) + V3 (categories.id)
 │     ├──► V5  budgets                ← depends on V1 + V3 (categories.id)
 │     ├──► V6  recurring_transactions ← depends on V1 + V3 (categories.id)
 │     └──► V10 merchant_cat_mappings  ← depends on V1 + V3 (categories.id)
 ├──► V7  shared_wallets + members     ← depends on V1 (users.id)
 ├──► V8  assets, liabilities, snapshots ← depends on V1 (users.id)
 ├──► V9  notifications                ← depends on V1 (users.id)
 ├──► V12 audit_log                    ← depends on V1 (users.id)
V11 currency_rates                     ← no dependencies (standalone)
```

### Migration File Mapping

| Migration | Tables Created | Depends On | Status |
|---|---|---|---|
| `V1__create_users.sql` | `users` | — | ✅ Done |
| `V2__create_accounts.sql` | `accounts` | V1 | ❌ Pending |
| `V3__create_categories_with_defaults.sql` | `categories` + seed INSERTs | V1 | ❌ Pending |
| `V4__create_transactions.sql` | `transactions` | V2, V3 | ❌ Pending |
| `V5__create_budgets.sql` | `budgets` | V1, V3 | ❌ Pending |
| `V6__create_recurring_transactions.sql` | `recurring_transactions` | V1, V3 | ❌ Pending |
| `V7__create_shared_wallets.sql` | `shared_wallets`, `shared_wallet_members` | V1 | ❌ Pending |
| `V8__create_assets_liabilities_networth.sql` | `assets`, `liabilities`, `net_worth_snapshots` | V1 | ❌ Pending |
| `V9__create_notifications.sql` | `notifications` | V1 | ❌ Pending |
| `V10__create_merchant_category_mappings.sql` | `merchant_category_mappings` | V1, V3 | ❌ Pending |
| `V11__create_currency_rates.sql` | `currency_rates` | — | ❌ Pending |
| `V12__create_audit_log.sql` | `audit_log` | V1 | ❌ Pending |

---

## Index Strategy

| Index | Table | Type | Query Pattern |
|---|---|---|---|
| `idx_users_email` | users | B-Tree | Login lookup by email |
| `idx_accounts_user` | accounts | B-Tree | List accounts for a user |
| `idx_accounts_type` | accounts | Composite | Filter accounts by type |
| `idx_categories_user` | categories | B-Tree | List categories for a user |
| `idx_categories_type` | categories | Composite | Filter INCOME vs EXPENSE |
| `idx_txn_user_date` | transactions | Composite | Dashboard: recent transactions |
| `idx_txn_account` | transactions | Composite | Account detail page |
| `idx_txn_category` | transactions | Composite | Spending per category for reports |
| `idx_txn_type` | transactions | Composite | Income vs expense trend |
| `idx_txn_merchant` | transactions | Prefix(50) | Merchant name prefix search |
| `idx_txn_search` | transactions | FULLTEXT | Free-text search (merchant + description) |
| `uk_budget` | budgets | UNIQUE | One budget per user+category+month |
| `idx_budget_month` | budgets | Composite | Budget summary for a month |
| `idx_recurring_due` | recurring_transactions | Composite | Upcoming subscriptions query |
| `uk_wallet_member` | shared_wallet_members | UNIQUE | Prevent duplicate membership |
| `idx_wallet_members` | shared_wallet_members | B-Tree | List members of a wallet |
| `idx_assets_user` | assets | B-Tree | List assets for a user |
| `idx_liabilities_user` | liabilities | B-Tree | List liabilities for a user |
| `uk_snapshot` | net_worth_snapshots | UNIQUE | One snapshot per user per date |
| `idx_snapshot_date` | net_worth_snapshots | Composite | Net worth chart date range |
| `idx_notif_user` | notifications | Composite | Unread notifications (most recent first) |
| `idx_merchant_user` | merchant_category_mappings | Prefix(50) | AI categorization lookup |
| `uk_rate` | currency_rates | UNIQUE | One rate per currency pair |
| `idx_rate_base` | currency_rates | B-Tree | All rates from one base currency |
| `idx_audit_user` | audit_log | Composite | User's activity log |
| `idx_audit_entity` | audit_log | Composite | Change history for one entity |

---

## Quick Setup

```sql
-- 1. Create the database
CREATE DATABASE IF NOT EXISTS moneymanager
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE moneymanager;

-- 2. Tables are created automatically by Flyway on application startup.
--    Flyway reads migration files from:
--    src/main/resources/db/migration/V1__create_users.sql
--                                    V2__create_accounts.sql
--                                    ... through V12__create_audit_log.sql
--
-- 3. To apply manually (without Flyway), run the CREATE TABLE
--    statements above in order: V1 → V2 → V3 → ... → V12.
```
