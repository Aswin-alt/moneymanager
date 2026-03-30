# Money Manager — Intelligent Financial Assistant: Project Plan

## Overview

Build an AI-powered **Intelligent Financial Assistant** on a Spring Boot 4.1.0-M2 backend with a React frontend. The system goes beyond basic transaction tracking — it auto-categorizes spending with ML, predicts cash flow, detects anomalies, and presents rich interactive visualizations.

**Tech Stack**:
- **Backend**: Spring Boot 4.1.0-M2, Java 21, MySQL 8, Redis, Flyway, Spring Security + JWT
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Recharts/D3.js
- **Caching**: Redis (session tokens, FX rates, report aggregations, user preferences)
- **AI/ML**: Rule-based categorization → ML classifier (Smile / Python microservice)

---

## Current State

| Item | Status |
|---|---|
| Framework | Spring Boot 4.1.0-M2 (Java 21, Maven) |
| Existing code | Bare scaffold — `MoneymanagerApplication.java` + empty `application.properties` |
| Web / JPA / Security | Not yet added |
| Frontend | Not yet created — React 19 SPA planned |
| Database | MySQL 8 (local) — `moneymanager` database required |
| Next milestone | **Phase 1+2 Implementation** — Home page, Login, Signup, User entity |

---

## Java Class Structure (Layered Architecture)

```
src/main/java/com/aswin/moneymanager/
│
├── MoneymanagerApplication.java                  # Spring Boot entry point
│
├── config/                                        # Configuration layer
│   ├── SecurityConfig.java                       # Spring Security filter chain, CORS, CSRF
│   ├── RedisConfig.java                          # Redis connection, cache manager, TTL policies
│   ├── SwaggerConfig.java                        # OpenAPI / Swagger UI configuration
│   ├── WebConfig.java                            # CORS mappings, interceptors
│   └── FlywayConfig.java                         # Flyway migration settings (if needed beyond auto)
│
├── security/                                      # Security layer
│   ├── JwtTokenProvider.java                     # Generate, parse, validate JWT tokens
│   ├── JwtAuthenticationFilter.java              # OncePerRequestFilter — extract JWT from header
│   ├── JwtAuthenticationEntryPoint.java          # Handle 401 Unauthorized responses
│   └── CustomUserDetailsService.java             # Load user from DB for Spring Security
│
├── entity/                                        # JPA Entity layer (Database models)
│   ├── User.java
│   ├── Account.java
│   ├── Transaction.java
│   ├── Category.java
│   ├── Budget.java
│   ├── RecurringTransaction.java
│   ├── SharedWallet.java
│   ├── SharedWalletMember.java
│   ├── Asset.java
│   ├── Liability.java
│   ├── NetWorthSnapshot.java
│   ├── Notification.java
│   ├── MerchantCategoryMapping.java
│   ├── CurrencyRate.java
│   └── AuditLog.java
│
├── enums/                                         # Enum types
│   ├── AccountType.java                          # CHECKING, SAVINGS, CREDIT, INVESTMENT, CRYPTO
│   ├── TransactionType.java                      # INCOME, EXPENSE, TRANSFER
│   ├── CategoryType.java                         # INCOME, EXPENSE
│   ├── Frequency.java                            # DAILY, WEEKLY, MONTHLY, YEARLY
│   ├── AssetType.java                            # CASH, INVESTMENT, CRYPTO, PROPERTY
│   ├── LiabilityType.java                        # LOAN, CREDIT_CARD, MORTGAGE
│   ├── WalletRole.java                           # OWNER, MEMBER
│   ├── NotificationType.java                     # BUDGET_WARNING, SUBSCRIPTION_DUE, ANOMALY
│   └── BudgetStatus.java                         # UNDER, NEAR, OVER
│
├── repository/                                    # Data Access layer (Spring Data JPA)
│   ├── UserRepository.java
│   ├── AccountRepository.java
│   ├── TransactionRepository.java                # Custom: findByFilters(), sumByCategory()
│   ├── CategoryRepository.java
│   ├── BudgetRepository.java
│   ├── RecurringTransactionRepository.java
│   ├── SharedWalletRepository.java
│   ├── SharedWalletMemberRepository.java
│   ├── AssetRepository.java
│   ├── LiabilityRepository.java
│   ├── NetWorthSnapshotRepository.java
│   ├── NotificationRepository.java
│   ├── MerchantCategoryMappingRepository.java
│   └── CurrencyRateRepository.java
│
├── dto/                                           # Data Transfer Objects
│   ├── request/                                  # Incoming request bodies
│   │   ├── RegisterRequest.java                  # email, password, displayName
│   │   ├── LoginRequest.java                     # email, password
│   │   ├── TransactionRequest.java
│   │   ├── AccountRequest.java
│   │   ├── CategoryRequest.java
│   │   ├── BudgetRequest.java
│   │   ├── SharedWalletRequest.java
│   │   └── AssetLiabilityRequest.java
│   └── response/                                 # Outgoing response bodies
│       ├── AuthResponse.java                     # accessToken, refreshToken, tokenType, expiresIn
│       ├── UserResponse.java
│       ├── TransactionResponse.java
│       ├── AccountResponse.java
│       ├── CategoryResponse.java
│       ├── BudgetSummaryResponse.java
│       ├── SubscriptionResponse.java
│       ├── SafeToSpendResponse.java
│       ├── CashFlowForecastResponse.java
│       ├── AnomalyResponse.java
│       ├── SpendingDistributionResponse.java
│       ├── IncomeExpenseTrendResponse.java
│       ├── BudgetVsActualResponse.java
│       ├── SankeyDataResponse.java
│       ├── NetWorthResponse.java
│       ├── HeatmapResponse.java
│       └── ApiErrorResponse.java
│
├── mapper/                                        # Entity ↔ DTO mapping
│   ├── UserMapper.java
│   ├── TransactionMapper.java
│   ├── AccountMapper.java
│   ├── CategoryMapper.java
│   └── BudgetMapper.java
│
├── service/                                       # Business Logic layer
│   ├── AuthService.java                          # Register, login, refresh token logic
│   ├── UserService.java                          # Profile CRUD
│   ├── AccountService.java                       # Account CRUD, balance recalculation
│   ├── TransactionService.java                   # Transaction CRUD, filtering, pagination
│   ├── CategoryService.java                      # Category CRUD, seed defaults
│   ├── BudgetService.java                        # Budget CRUD, summary, threshold alerts
│   ├── currency/
│   │   └── CurrencyConversionService.java        # FX rate fetching, conversion, caching in Redis
│   ├── subscription/
│   │   └── SubscriptionDetectionService.java     # Recurring transaction detection, upcoming alerts
│   ├── insights/
│   │   ├── SafeToSpendService.java               # "In My Pocket" calculation
│   │   ├── CashFlowForecastService.java          # Predictive cash flow
│   │   └── AnomalyDetectionService.java          # Z-score / IQR anomaly flagging
│   ├── ai/
│   │   ├── AutoCategorizationService.java        # Rule-based → ML categorization
│   │   └── SpendingInsightsService.java          # Natural language spending summaries
│   ├── report/
│   │   ├── SpendingDistributionService.java      # Pie/Donut data
│   │   ├── IncomeExpenseTrendService.java        # Dual line graph data
│   │   ├── BudgetVsActualService.java            # Grouped bar chart data
│   │   ├── SankeyService.java                    # Cash flow sankey data
│   │   ├── NetWorthService.java                  # Stacked area chart data + snapshot jobs
│   │   ├── HeatmapService.java                   # Daily spending heatmap
│   │   └── CategoryTrendService.java             # Per-category monthly trend
│   ├── wallet/
│   │   └── SharedWalletService.java              # Shared wallet CRUD, member management
│   └── notification/
│       └── NotificationService.java              # In-app + email alert dispatch
│
├── controller/                                    # REST API layer
│   ├── AuthController.java                       # /api/auth/** (register, login, refresh)
│   ├── UserController.java                       # /api/users/me
│   ├── AccountController.java                    # /api/accounts/**
│   ├── TransactionController.java                # /api/transactions/**
│   ├── CategoryController.java                   # /api/categories/**
│   ├── BudgetController.java                     # /api/budgets/**
│   ├── SubscriptionController.java               # /api/subscriptions/**
│   ├── InsightsController.java                   # /api/insights/**
│   ├── ReportController.java                     # /api/reports/**
│   ├── SharedWalletController.java               # /api/wallets/**
│   └── NotificationController.java               # /api/notifications/**
│
├── exception/                                     # Exception Handling layer
│   ├── GlobalExceptionHandler.java               # @RestControllerAdvice
│   ├── ResourceNotFoundException.java
│   ├── BadRequestException.java
│   ├── UnauthorizedException.java
│   └── DuplicateResourceException.java
│
├── scheduler/                                     # Scheduled Jobs
│   ├── CurrencyRateScheduler.java                # Daily FX rate refresh
│   ├── SubscriptionAlertScheduler.java           # Check upcoming subscriptions, send alerts
│   ├── NetWorthSnapshotScheduler.java            # Monthly net worth snapshot
│   └── RedisCacheWarmupScheduler.java            # Pre-warm frequently accessed cache entries
│
└── util/                                          # Utility classes
    ├── DateUtils.java
    ├── CurrencyUtils.java
    └── SlugUtils.java
```

---

## Phase 1: Foundation & Data Model

### 1.1 Add Maven Dependencies

Add to `pom.xml`:

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-web` | REST API |
| `spring-boot-starter-data-jpa` | ORM / Repositories |
| `spring-boot-starter-validation` | Bean validation |
| `spring-boot-starter-security` | Authentication |
| `spring-boot-starter-data-redis` | Redis caching |
| `spring-boot-starter-cache` | Spring Cache abstraction |
| `spring-boot-starter-mail` | Email notifications |
| `mysql-connector-j` (runtime) | MySQL 8 driver |
| `flyway-core` + `flyway-mysql` | Database migrations |
| `lombok` | Boilerplate reduction |
| `springdoc-openapi-starter-webmvc-ui` | Swagger / OpenAPI docs |
| `jjwt-api`, `jjwt-impl`, `jjwt-jackson` | JWT token handling |
| `mapstruct` + `mapstruct-processor` | Entity ↔ DTO mapping |

### 1.2 Configure `application.properties`

```properties
# Server
server.port=8080
server.servlet.context-path=/api

# MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/moneymanager?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.show-sql=false

# Flyway
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=${REDIS_PASSWORD:}
spring.cache.type=redis
spring.cache.redis.time-to-live=3600000

# JWT
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-ms=86400000
app.jwt.refresh-expiration-ms=604800000

# Mail (optional)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME:}
spring.mail.password=${MAIL_PASSWORD:}
```

### 1.3 Design & Create Entity Classes

Package: `com.aswin.moneymanager.entity`

| Entity | Key Fields | Relationships |
|---|---|---|
| `User` | id, email, passwordHash, displayName, defaultCurrency, createdAt | → Accounts, Categories, Budgets |
| `Account` | id, userId, name, type (CHECKING / SAVINGS / CREDIT / INVESTMENT / CRYPTO), currency, balance, institution, isActive | → Transactions |
| `Transaction` | id, accountId, categoryId, amount, currency, convertedAmount, type (INCOME / EXPENSE / TRANSFER), merchant, description, transactionDate, isRecurring, recurringGroupId | → Category, Account |
| `Category` | id, userId, name, icon, color, type (INCOME / EXPENSE), parentCategoryId, isSystem | → Subcategories (self-referencing) |
| `Budget` | id, userId, categoryId, monthYear, limitAmount, currency | → Category |
| `RecurringTransaction` | id, userId, merchantPattern, amount, frequency (WEEKLY / MONTHLY / YEARLY), nextDueDate, isActive | → Transactions |
| `SharedWallet` | id, name, createdBy | → SharedWalletMember, Account |
| `SharedWalletMember` | id, walletId, userId, role (OWNER / MEMBER), joinedAt | → User, SharedWallet |
| `Asset` | id, userId, name, type (CASH / INVESTMENT / CRYPTO / PROPERTY), currentValue, currency, lastUpdated | — |
| `Liability` | id, userId, name, type (LOAN / CREDIT_CARD / MORTGAGE), currentBalance, interestRate, currency | — |
| `NetWorthSnapshot` | id, userId, snapshotDate, totalAssets, totalLiabilities, netWorth | — |

### 1.4 Redis Caching Strategy

| Cache Name | Key Pattern | TTL | Use Case |
|---|---|---|---|
| `fx_rates` | `fx:{base}:{target}` | 24 hours | Currency conversion rates |
| `budget_summary` | `budget:{userId}:{month}` | 15 minutes | Budget vs spend calculations |
| `report_spending` | `report:spending:{userId}:{from}:{to}` | 30 minutes | Spending distribution data |
| `report_trend` | `report:trend:{userId}:{from}:{to}` | 30 minutes | Income/expense trend data |
| `safe_to_spend` | `safe:{userId}` | 10 minutes | Safe-to-spend amount |
| `user_prefs` | `user:prefs:{userId}` | 1 hour | User preferences / default currency |
| `categories` | `categories:{userId}` | 1 hour | User's category list |

Cache invalidation: Evict relevant cache keys on write operations (transaction create/update/delete, budget change, etc.) using `@CacheEvict`.

### 1.5 Create Flyway Migrations

Directory: `src/main/resources/db/migration/`

- `V1__create_users.sql`
- `V2__create_accounts.sql`
- `V3__create_categories_with_defaults.sql`
- `V4__create_transactions.sql`
- `V5__create_budgets.sql`
- `V6__create_recurring_transactions.sql`
- `V7__create_shared_wallets.sql`
- `V8__create_assets_liabilities_networth.sql`
- `V9__create_notifications.sql`
- `V10__create_merchant_category_mappings.sql`
- `V11__create_currency_rates.sql`
- `V12__create_audit_log.sql`

### 1.6 Repository Interfaces

Package: `com.aswin.moneymanager.repository`

- One Spring Data JPA repository per entity
- Custom query methods (e.g., `TransactionRepository.findByAccountIdAndTransactionDateBetween()`)

### ✅ Verification

Application starts, Flyway runs all migrations, tables exist in MySQL, Redis connection established.

---

## Database Schema (MySQL 8)

### `users`

```sql
CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `accounts`

```sql
CREATE TABLE accounts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    account_type    ENUM('CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT', 'CRYPTO', 'CASH') NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance         DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    institution     VARCHAR(100),
    account_number_masked VARCHAR(20),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_accounts_user (user_id),
    INDEX idx_accounts_type (user_id, account_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `categories`

```sql
CREATE TABLE categories (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT,                              -- NULL for system-default categories
    name            VARCHAR(50) NOT NULL,
    icon            VARCHAR(50) NOT NULL DEFAULT '📦',
    color           VARCHAR(7) NOT NULL DEFAULT '#6B7280', -- hex color
    category_type   ENUM('INCOME', 'EXPENSE') NOT NULL,
    parent_id       BIGINT,                              -- self-referencing for subcategories
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_user (user_id),
    INDEX idx_categories_type (user_id, category_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `transactions`

```sql
CREATE TABLE transactions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id          BIGINT NOT NULL,
    category_id         BIGINT,
    user_id             BIGINT NOT NULL,
    amount              DECIMAL(15,2) NOT NULL,
    currency            VARCHAR(3) NOT NULL,
    converted_amount    DECIMAL(15,2),                    -- amount in user's default currency
    transaction_type    ENUM('INCOME', 'EXPENSE', 'TRANSFER') NOT NULL,
    merchant            VARCHAR(200),
    description         VARCHAR(500),
    transaction_date    DATE NOT NULL,
    is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_group_id  BIGINT,
    is_auto_categorized BOOLEAN NOT NULL DEFAULT FALSE,
    tags                JSON,                              -- flexible tagging: ["travel", "business"]
    receipt_url         VARCHAR(500),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_txn_user_date (user_id, transaction_date),
    INDEX idx_txn_account (account_id, transaction_date),
    INDEX idx_txn_category (user_id, category_id, transaction_date),
    INDEX idx_txn_type (user_id, transaction_type, transaction_date),
    INDEX idx_txn_merchant (user_id, merchant(50)),
    FULLTEXT idx_txn_search (merchant, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `budgets`

```sql
CREATE TABLE budgets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    category_id     BIGINT NOT NULL,
    month_year      VARCHAR(7) NOT NULL,                  -- '2026-03'
    limit_amount    DECIMAL(15,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    alert_at_80     BOOLEAN NOT NULL DEFAULT TRUE,
    alert_at_100    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY uk_budget (user_id, category_id, month_year),
    INDEX idx_budget_month (user_id, month_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `recurring_transactions`

```sql
CREATE TABLE recurring_transactions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    merchant_pattern    VARCHAR(200) NOT NULL,
    category_id         BIGINT,
    estimated_amount    DECIMAL(15,2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    frequency           ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL,
    next_due_date       DATE NOT NULL,
    last_charged_date   DATE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_auto_detected    BOOLEAN NOT NULL DEFAULT TRUE,
    alert_days_before   INT NOT NULL DEFAULT 3,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_recurring_user (user_id),
    INDEX idx_recurring_due (user_id, next_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `shared_wallets`

```sql
CREATE TABLE shared_wallets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    created_by      BIGINT NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `shared_wallet_members`

```sql
CREATE TABLE shared_wallet_members (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    wallet_id       BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    role            ENUM('OWNER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    joined_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (wallet_id) REFERENCES shared_wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_wallet_member (wallet_id, user_id),
    INDEX idx_wallet_members (wallet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `assets`

```sql
CREATE TABLE assets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    asset_type      ENUM('CASH', 'INVESTMENT', 'CRYPTO', 'PROPERTY', 'OTHER') NOT NULL,
    current_value   DECIMAL(15,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    institution     VARCHAR(100),
    notes           VARCHAR(500),
    last_updated    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assets_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `liabilities`

```sql
CREATE TABLE liabilities (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    liability_type  ENUM('LOAN', 'CREDIT_CARD', 'MORTGAGE', 'OTHER') NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL,
    interest_rate   DECIMAL(5,2),
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    due_date        DATE,
    notes           VARCHAR(500),
    last_updated    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_liabilities_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `net_worth_snapshots`

```sql
CREATE TABLE net_worth_snapshots (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    snapshot_date   DATE NOT NULL,
    cash_total      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    investment_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    crypto_total    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    property_total  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_assets    DECIMAL(15,2) NOT NULL,
    total_liabilities DECIMAL(15,2) NOT NULL,
    net_worth       DECIMAL(15,2) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_snapshot (user_id, snapshot_date),
    INDEX idx_snapshot_date (user_id, snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `notifications`

```sql
CREATE TABLE notifications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    notification_type ENUM('BUDGET_WARNING', 'BUDGET_EXCEEDED', 'SUBSCRIPTION_DUE',
                           'ANOMALY_DETECTED', 'CASH_FLOW_ALERT', 'SYSTEM') NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         VARCHAR(1000) NOT NULL,
    reference_id    BIGINT,                              -- ID of related entity
    reference_type  VARCHAR(50),                         -- 'BUDGET', 'TRANSACTION', 'SUBSCRIPTION'
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    is_email_sent   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `merchant_category_mappings`

```sql
CREATE TABLE merchant_category_mappings (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT,                              -- NULL for global/system mappings
    merchant_pattern VARCHAR(200) NOT NULL,              -- regex or keyword pattern
    category_id     BIGINT NOT NULL,
    confidence      DECIMAL(3,2) NOT NULL DEFAULT 1.00,  -- 0.00 to 1.00
    usage_count     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_merchant_user (user_id, merchant_pattern(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `currency_rates`

```sql
CREATE TABLE currency_rates (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    base_currency   VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate            DECIMAL(12,6) NOT NULL,
    fetched_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_rate (base_currency, target_currency),
    INDEX idx_rate_base (base_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### `audit_log`

```sql
CREATE TABLE audit_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    action          VARCHAR(50) NOT NULL,                -- 'CREATE', 'UPDATE', 'DELETE'
    entity_type     VARCHAR(50) NOT NULL,                -- 'TRANSACTION', 'ACCOUNT', 'BUDGET'
    entity_id       BIGINT NOT NULL,
    old_value       JSON,
    new_value       JSON,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_audit_user (user_id, created_at),
    INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Entity-Relationship Summary

```
users ─────┬──── accounts ──── transactions
           │                        │
           ├──── categories ────────┘ (+ self-ref parent_id)
           │         │
           ├──── budgets ───────────── categories
           │
           ├──── recurring_transactions
           │
           ├──── assets
           │
           ├──── liabilities
           │
           ├──── net_worth_snapshots
           │
           ├──── notifications
           │
           ├──── merchant_category_mappings
           │
           └──── shared_wallet_members ──── shared_wallets
```

---

## Phase 2: Authentication, Login & Signup

### 2.1 JWT Authentication (Backend)

Package: `com.aswin.moneymanager.security`

- `JwtTokenProvider` — generate access + refresh tokens, validate, extract claims
- `JwtAuthenticationFilter` — intercept requests, extract JWT from `Authorization: Bearer <token>`
- `JwtAuthenticationEntryPoint` — return `401` JSON error for unauthenticated requests
- `CustomUserDetailsService` — load `User` entity by email for Spring Security context
- `SecurityConfig` — configure filter chain, CORS, CSRF, public vs. protected endpoints

### 2.2 Auth Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Create user account | No |
| POST | `/api/auth/login` | Authenticate, return JWT pair | No |
| POST | `/api/auth/refresh` | Refresh expired access token | No (refresh token) |
| POST | `/api/auth/logout` | Blacklist token in Redis | Yes |
| POST | `/api/auth/forgot-password` | Send password reset email | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| GET | `/api/users/me` | Get current user profile | Yes |
| PUT | `/api/users/me` | Update display name, default currency, avatar | Yes |
| PUT | `/api/users/me/password` | Change password | Yes |
| DELETE | `/api/users/me` | Soft-delete account | Yes |

### 2.3 Auth Flow Details

**Registration** (`POST /api/auth/register`):
- Input: `{ email, password, displayName, defaultCurrency? }`
- Validate: email format, password strength (min 8 chars, upper + lower + digit + special)
- Hash with BCrypt (strength 12)
- Seed default categories for the new user
- Return: `{ accessToken, refreshToken, user: { id, email, displayName } }`

**Login** (`POST /api/auth/login`):
- Input: `{ email, password }`
- Verify credentials via `AuthenticationManager`
- Generate JWT access token (24h) + refresh token (7 days)
- Store refresh token hash in Redis for validation / blacklisting
- Return: `{ accessToken, refreshToken, tokenType: "Bearer", expiresIn: 86400 }`

**Token Refresh** (`POST /api/auth/refresh`):
- Input: `{ refreshToken }`
- Validate refresh token exists in Redis and is not blacklisted
- Issue new access + refresh token pair (token rotation)
- Blacklist old refresh token
- Return: new `{ accessToken, refreshToken }`

**Logout** (`POST /api/auth/logout`):
- Blacklist current access token and refresh token in Redis (TTL = remaining expiry)

### 2.4 Redis Token Storage

| Key | Value | TTL |
|---|---|---|
| `auth:refresh:{userId}:{tokenId}` | `valid` or `blacklisted` | 7 days |
| `auth:blacklist:{tokenHash}` | `1` | Remaining token expiry |

### 2.5 DTOs & Validation

Package: `com.aswin.moneymanager.dto.request` / `dto.response`

- `RegisterRequest`: `@NotBlank email`, `@Email`, `@Size(min=8) password`, `@NotBlank displayName`
- `LoginRequest`: `@NotBlank email`, `@NotBlank password`
- `AuthResponse`: `accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `user`
- `UserResponse`: `id`, `email`, `displayName`, `defaultCurrency`, `avatarUrl`, `createdAt`
- `ApiErrorResponse`: `timestamp`, `status`, `error`, `message`, `path`

### 2.6 Login & Signup Pages (Frontend)

**Signup Page** (`/register`):
- Fields: Display Name, Email, Password, Confirm Password
- Password strength indicator (real-time: weak / medium / strong)
- Client-side validation: email format, password match, min length
- Show/hide password toggle
- "Already have an account? Log in" link
- On success: auto-login → redirect to Dashboard
- On error: inline field-level error messages (email taken, weak password)

**Login Page** (`/login`):
- Fields: Email, Password
- "Remember me" checkbox (extends token expiry)
- Show/hide password toggle
- "Forgot password?" link → password reset flow
- "Don't have an account? Sign up" link
- On success: store tokens in `httpOnly` cookie or secure localStorage → redirect to Dashboard
- On error: "Invalid email or password" (never reveal which field is wrong)
- Rate limiting: lock after 5 failed attempts (15 min cooldown, tracked in Redis)

**Password Reset Flow**:
- Enter email → receive reset link with time-limited token (15 min, stored in Redis)
- Click link → enter new password → token consumed → redirect to login

**Protected Route Guard** (Frontend):
- `AuthGuard` / `ProtectedRoute` component wraps all authenticated pages
- If no valid token → redirect to `/login`
- If token expired → attempt silent refresh → if fails → redirect to `/login`
- Store auth state in Zustand: `{ user, accessToken, isAuthenticated, login(), logout(), refresh() }`

### ✅ Verification

Register → login → access protected endpoints → refresh token → logout → verify token blacklisted in Redis.

---

## Phase 3: Core Transaction & Budget CRUD

### 3.1 Account Management

- `POST / GET / PUT / DELETE /api/accounts`
- Balance recalculated on transaction create/update/delete
- Cache account list per user in Redis; evict on change

### 3.2 Category Management

- `POST / GET / PUT / DELETE /api/categories`
- Seed default system categories on user registration (Dining, Groceries, Rent, Transport, Entertainment, Salary, Freelance, etc.)
- Support parent/child (subcategory) hierarchy
- Cache categories per user in Redis; evict on change

### 3.3 Transaction Management

- `POST /api/transactions` — manual entry
- `GET /api/transactions` — paginated, filterable (date range, category, account, type, amount range, search text)
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`
- On create/update: update account balance, check budget thresholds, evict report caches

### 3.4 Multi-Currency Support

Package: `com.aswin.moneymanager.service.currency`

- `CurrencyConversionService` — fetch rates from free API (e.g., exchangerate.host or Open Exchange Rates)
- Store rates in `currency_rates` table AND cache in Redis (`fx:{base}:{target}`, 24h TTL)
- Store `convertedAmount` in user's default currency on every transaction
- Scheduled job to refresh rates daily (`@Scheduled`)

### 3.5 Budgeting Engine

- `POST / GET / PUT / DELETE /api/budgets`
- `GET /api/budgets/summary?month=2026-03` — returns each budget with:
  - `limitAmount`, `spentAmount`, `remainingAmount`, `percentUsed`
- Trigger alert (stored in `Notification` table) when spending hits **80%** and **100%**
- Cache budget summaries in Redis (15 min TTL); evict on transaction or budget change

### ✅ Verification

Create accounts, categories, transactions; verify balances update; create budgets and confirm summary math; verify Redis cache hit on repeated requests.

---

## Phase 4: Smart Features

> *Can partially run in parallel with late Phase 3*

### 4.1 Subscription Tracker

Package: `com.aswin.moneymanager.service.subscription`

- `RecurringTransactionDetector` — analyze transaction history, group by merchant + similar amounts at regular intervals
- `GET /api/subscriptions` — list detected recurring payments
- `GET /api/subscriptions/upcoming` — next 30 days of expected charges
- Notification **3 days before** each upcoming charge

### 4.2 "Safe to Spend" / Smart In-My-Pocket

- `GET /api/insights/safe-to-spend`
- **Formula**: `currentBalance - upcomingBills(next N days) - savingsGoalContribution - pendingTransfers`
- Returns a single clear number + breakdown
- Cache result in Redis (10 min TTL); evict on transaction change

### 4.3 Shared Wallets

- `POST /api/wallets` — create shared wallet
- `POST /api/wallets/{id}/members` — invite by email
- `GET /api/wallets/{id}/transactions` — shared transaction feed
- Each member sees shared wallet alongside personal accounts
- Role-based: OWNER can add/remove members, MEMBER can add transactions

### ✅ Verification

Create recurring transactions → confirm subscription detection; test safe-to-spend calculation; create shared wallet, add member, add transactions.

---

## Phase 5: AI & Machine Learning

> *Depends on transaction data from Phase 3*

### 5.1 AI Auto-Categorization

Package: `com.aswin.moneymanager.service.ai`

- **Option A (Start here)**: Rule-based + keyword matching with a merchant-to-category mapping table. Users correct mistakes → system learns per-user overrides.
- **Option B (Graduate to)**: ML classifier using Smile library (Java) or Python microservice. Features: merchant name tokens, amount range, time of day.
- `POST /api/transactions` auto-assigns `categoryId` if not provided; user can override.

### 5.2 Predictive Cash Flow

- `GET /api/insights/cash-flow-forecast?months=3`
- **Algorithm**: average daily spend rate (last 30/60/90 days) + known recurring income − known recurring expenses
- Returns projected balance per day for the next N months
- Trigger alert if projected balance goes **negative**

### 5.3 Anomaly Detection *(Extra Feature)*

- Flag transactions unusually large compared to user's history for that category
- `GET /api/insights/anomalies` — recent flagged transactions
- Uses simple **z-score or IQR-based** detection

### 5.4 Spending Insights *(Extra Feature)*

- `GET /api/insights/weekly-summary`
- Natural language summary: *"You spent 23% more on dining this week compared to your average."*
- Template-based generation (or integrate LLM API for richer language)

### ✅ Verification

Add transactions without category → verify auto-categorization; check forecast returns plausible projections; insert outlier → verify anomaly flag.

---

## Phase 6: Reporting & Statistics API

All report endpoints use Redis caching (30 min TTL) to avoid expensive aggregation queries on every request.

### 6.1 Spending Distribution (Pie / Donut Chart)

- `GET /api/reports/spending-distribution?from=2026-01-01&to=2026-03-31`
- Returns: `[{ category, amount, percentage, color, icon }]`
- **Drill-down**: `GET /api/reports/spending-distribution/{categoryId}/transactions?from=...&to=...`

### 6.2 Income vs. Expense Trend (Dual Line Graph)

- `GET /api/reports/income-expense-trend?from=2025-01-01&to=2026-03-15&granularity=MONTHLY`
- Returns: `[{ period, totalIncome, totalExpense, gap }]`
- Includes `gapTrend` (WIDENING / NARROWING / CLOSING) + **warning flag**

### 6.3 Budget vs. Actual (Grouped Bar Chart)

- `GET /api/reports/budget-vs-actual?month=2026-03`
- Returns: `[{ category, budgetAmount, actualAmount, status: UNDER | OVER }]`
- Visual cue: 🟢 Green for under budget, 🔴 Red for overspent

### 6.4 Cash Flow Sankey Data (Sankey Diagram)

- `GET /api/reports/cash-flow-sankey?month=2026-03`
- Returns: `{ nodes: [...], links: [{ source, target, value }] }`
- Shows income sources → expense categories + savings buckets

### 6.5 Net Worth Growth (Stacked Area Chart)

- Scheduled monthly job (`NetWorthSnapshotService`) captures asset/liability totals
- `GET /api/reports/net-worth?from=2024-01-01&to=2026-03-15`
- Returns: `[{ date, cash, investments, crypto, property, totalAssets, totalLiabilities, netWorth }]`

### 6.6 Spending Heatmap *(Extra Feature)*

- `GET /api/reports/spending-heatmap?year=2026`
- Returns spending amount per day — visualized as a **GitHub-contribution-style heatmap**

### 6.7 Category Trend Over Time *(Extra Feature)*

- `GET /api/reports/category-trend?categoryId=5&months=12`
- Monthly spend for one category — spot **seasonal patterns**

### ✅ Verification

Seed test data for 6+ months; hit each report endpoint; validate math against manual calculation; verify Redis cache hit on second request.

---

## Phase 7: Frontend (React SPA)

> *Can start in parallel with Phase 4+ (build against API contracts)*

### 7.1 Tech Stack

| Tool | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite | Build tool |
| TailwindCSS + shadcn/ui | Styling + components |
| Recharts or D3.js | Chart visualizations |
| TanStack Query (React Query) | API state management |
| React Router | Client-side routing |
| Zustand | Global state (auth, user prefs) |

### 7.2 Pages & Components

| Page | Route | Key Components |
|---|---|---|
| **Signup** | `/register` | Name/email/password form, password strength meter, validation, link to login |
| **Login** | `/login` | Email/password form, remember me, forgot password link, link to signup |
| **Forgot Password** | `/forgot-password` | Email input → confirmation message |
| **Reset Password** | `/reset-password?token=` | New password + confirm, token validation |
| **Dashboard** | `/dashboard` | Summary cards (balance, safe-to-spend, month spend), Spending Donut, Income vs Expense mini-line, upcoming bills |
| **Transactions** | `/transactions` | Filterable/searchable table, add/edit modal, category badge with color/icon |
| **Accounts** | `/accounts` | Account cards with balances, link to transactions |
| **Budgets** | `/budgets` | Category budget cards with progress bars (green → yellow → red) |
| **Subscriptions** | `/subscriptions` | Recurring payment list, upcoming charges calendar |
| **Reports** | `/reports` | Full-page charts: Pie, Dual Line, Grouped Bar, Sankey, Stacked Area, Heatmap |
| **Shared Wallets** | `/wallets` | Wallet dashboard, member management, shared transaction feed |
| **Settings** | `/settings` | Profile, currency preference, category management, notification preferences, change password |

### 7.3 Chart Interactions

- **Pie/Donut**: click slice → drill into transactions for that category
- **Line/Bar charts**: hover tooltips with exact values
- **Sankey**: hover highlights flow path
- **All charts**: date range selector, export as PNG

### ✅ Verification

Manual walkthrough of all pages; responsive design check (mobile / tablet / desktop); Lighthouse performance audit; auth flow end-to-end (register → login → dashboard → logout).

---

## Extra Features (Beyond Core Requirements)

| # | Feature | Description |
|---|---|---|
| 1 | **Data Export** | CSV / PDF export of transactions and reports |
| 2 | **Notifications System** | In-app + optional email (Spring Mail) for budget alerts, upcoming bills, anomalies |
| 3 | **Goal Tracking** | Savings goals with target amount, deadline, auto-contribution suggestions |
| 4 | **Receipt Scanner (OCR)** | Upload receipt image → extract merchant, amount, date (Tesseract OCR or cloud API) |
| 5 | **Dark Mode** | Full dark theme support across the UI |
| 6 | **PWA Support** | Progressive Web App — installable on mobile devices |
| 7 | **Audit Log** | Track all financial data changes for security |
| 8 | **Two-Factor Auth (2FA)** | TOTP-based two-factor authentication |
| 9 | **Bank Sync Abstraction** | Interface ready for Plaid/Finicity integration (mock data initially) |

---

## Architecture

```
┌─────────────────┐         ┌──────────────────────────────────────────────┐
│   React SPA     │ ──────► │        REST API (Spring Boot 4.1)           │
│  (Vite + TS)    │         │                                              │
└─────────────────┘         │  ┌─────────────────────────────────────┐     │
                            │  │  Security Filter (JWT)              │     │
                            │  └─────────────────────────────────────┘     │
                            │  ┌─────────────────────────────────────┐     │
                            │  │  Controllers (REST endpoints)       │     │
                            │  └─────────────────────────────────────┘     │
                            │  ┌─────────────────────────────────────┐     │
                            │  │  Services (Business Logic)          │     │
                            │  │   ├── AuthService                   │     │
                            │  │   ├── Currency Service ──► FX API   │     │
                            │  │   ├── AI Categorization Service     │     │
                            │  │   ├── Subscription Detection        │     │
                            │  │   ├── Cash Flow Forecast            │     │
                            │  │   └── Report Aggregation            │     │
                            │  └─────────────────────────────────────┘     │
                            │  ┌─────────────────────────────────────┐     │
                            │  │  Repositories (Spring Data JPA)     │     │
                            │  └─────────────────────────────────────┘     │
                            │          │                   │               │
                            └──────────┼───────────────────┼───────────────┘
                                       ▼                   ▼
                                ┌──────────────┐    ┌──────────────┐
                                │   MySQL 8    │    │    Redis     │
                                │  (Primary)   │    │   (Cache)    │
                                └──────────────┘    └──────────────┘
```

---

## Phase Dependency Graph

```
Phase 1 (Foundation) ──► Phase 2 (Auth + Login/Signup) ──► Phase 3 (Core CRUD)
                                                    │
                                    ┌───────────────┼───────────────┐
                                    ▼               │               ▼
                          Phase 4 (Smart)           │     Phase 7 (Frontend)
                                    │               │       can start here
                                    ▼               │
                          Phase 5 (AI/ML)           │
                                    │               │
                                    ▼               │
                          Phase 6 (Reports) ◄───────┘
```

---

## Implementation Plan: Home Page, Login/Signup & User Management

> **Goal**: Build the authentication foundation — Spring Boot backend with JWT auth, User entity with MySQL persistence, and a React 19 SPA with landing page, login, and signup screens. This covers **Phase 1 (partial) + Phase 2 + Phase 7 (partial)**.

### Prerequisites

- **MySQL 8** running locally — create the database before starting:
  ```sql
  CREATE DATABASE moneymanager;
  ```
- **Node.js 18+** installed (for React frontend)
- **JDK 21** (already installed at `~/.gradle/jdks/eclipse_adoptium-21-aarch64-os_x/jdk-21.0.8+9/Contents/Home`)
- **Environment variables** (can use defaults for development, override in production):
  - `DB_PASSWORD` — MySQL root password
  - `JWT_SECRET` — Secret key for JWT signing (min 256-bit)

### Phase A: Backend Foundation (sequential — each step builds on the previous)

1. **Add Maven dependencies to `pom.xml`**
   - `spring-boot-starter-web` (REST API)
   - `spring-boot-starter-data-jpa` (ORM)
   - `spring-boot-starter-validation` (bean validation)
   - `spring-boot-starter-security` (auth framework)
   - `mysql-connector-j` (MySQL driver, runtime scope)
   - `flyway-core` + `flyway-mysql` (migrations)
   - `lombok` (boilerplate reduction, provided scope)
   - `jjwt-api` + `jjwt-impl` + `jjwt-jackson` (JWT handling)
   - Reference: Phase 1.1 in this document

2. **Configure `application.properties`** *depends on step 1*
   - MySQL datasource (url, username, password via env var)
   - JPA/Hibernate settings (ddl-auto=validate, MySQL dialect)
   - Flyway enabled, migration location
   - JWT secret + expiration settings (via env vars)
   - Server port 8080
   - Reference: Phase 1.2 in this document

3. **Create User entity + enums** *depends on step 1*
   - `entity/User.java` — JPA entity with id, email, passwordHash, displayName, defaultCurrency, isActive, createdAt, updatedAt
   - Follow the schema from the `users` table definition in Database Schema section
   - Use Lombok `@Data`, `@Entity`, `@Table`

4. **Create Flyway migration for `users` table** *depends on step 2*
   - `src/main/resources/db/migration/V1__create_users.sql`
   - Use the exact schema from the Database Schema section of this document

5. **Create UserRepository** *depends on step 3*
   - `repository/UserRepository.java` — Spring Data JPA
   - Custom methods: `findByEmail(String email)`, `existsByEmail(String email)`

6. **Create DTOs** *depends on step 3*
   - `dto/request/RegisterRequest.java` — email, password, displayName, defaultCurrency (with validation annotations)
   - `dto/request/LoginRequest.java` — email, password
   - `dto/response/AuthResponse.java` — accessToken, refreshToken, tokenType, expiresIn, user
   - `dto/response/UserResponse.java` — id, email, displayName, defaultCurrency, createdAt
   - `dto/response/ApiErrorResponse.java` — timestamp, status, error, message, path

7. **Create JWT security layer** *depends on steps 5, 6*
   - `security/JwtTokenProvider.java` — generate/validate/parse JWT tokens using jjwt
   - `security/JwtAuthenticationFilter.java` — OncePerRequestFilter, extract JWT from Authorization header
   - `security/JwtAuthenticationEntryPoint.java` — return 401 JSON for unauthenticated
   - `security/CustomUserDetailsService.java` — load User by email for Spring Security
   - `config/SecurityConfig.java` — filter chain: permit auth endpoints, secure rest; CORS config for React frontend on localhost:5173; disable CSRF for stateless API

8. **Create AuthService + AuthController** *depends on step 7*
   - `service/AuthService.java` — register (hash password with BCrypt, save user), login (authenticate, generate JWT pair)
   - `controller/AuthController.java`:
     - `POST /api/auth/register` — create user, return tokens
     - `POST /api/auth/login` — authenticate, return tokens
     - `GET /api/users/me` — return current user profile (secured)

9. **Create exception handling** *depends on step 8*
   - `exception/GlobalExceptionHandler.java` — @RestControllerAdvice
   - `exception/ResourceNotFoundException.java`
   - `exception/BadRequestException.java`
   - `exception/DuplicateResourceException.java`
   - Handle validation errors, auth errors, and return consistent ApiErrorResponse

### Phase B: React Frontend (can start in parallel with Phase A after step 1)

10. **Initialize React project** *parallel with steps 2–9*
    - Create `frontend/` directory at project root
    - `npm create vite@latest` with React + TypeScript template
    - Install: `tailwindcss`, `@tailwindcss/vite`, `react-router-dom`, `axios`, `zustand`
    - Configure Vite proxy to forward `/api` requests to `localhost:8080`

11. **Set up project structure + auth store** *depends on step 10*
    - Create directory structure: `src/pages/`, `src/components/`, `src/services/`, `src/store/`, `src/types/`
    - `src/types/auth.ts` — TypeScript interfaces for User, AuthResponse, LoginRequest, RegisterRequest
    - `src/services/api.ts` — Axios instance with base URL + interceptor for JWT token
    - `src/store/authStore.ts` — Zustand store: user, accessToken, isAuthenticated, login(), register(), logout()

12. **Build Landing/Home Page** *depends on step 11*
    - `src/pages/HomePage.tsx` — Public landing page with:
      - Hero section: app name, tagline, CTA buttons ("Get Started" → signup, "Log In" → login)
      - Feature highlights (3–4 cards: track spending, budget management, insights, multi-currency)
      - Clean, modern design with TailwindCSS
    - Route: `/`

13. **Build Login Page** *depends on step 11*
    - `src/pages/LoginPage.tsx`:
      - Email + password form fields
      - Show/hide password toggle
      - Form validation (email format, required fields)
      - Error display (inline field errors + top-level API error)
      - "Don't have an account? Sign up" link
      - On success: store token → redirect to `/dashboard`
    - Route: `/login`

14. **Build Signup Page** *depends on step 11*
    - `src/pages/SignupPage.tsx`:
      - Display name, email, password, confirm password fields
      - Password strength indicator
      - Form validation (email format, password min 8 chars, passwords match)
      - "Already have an account? Log in" link
      - On success: auto-login → redirect to `/dashboard`
    - Route: `/register`

15. **Build Dashboard placeholder + routing** *depends on steps 12–14*
    - `src/pages/DashboardPage.tsx` — Simple authenticated page with user greeting + logout button
    - `src/components/ProtectedRoute.tsx` — Route guard: if not authenticated → redirect to `/login`
    - `src/components/Navbar.tsx` — Navigation bar (show login/signup when unauthenticated, show user name + logout when authenticated)
    - `src/App.tsx` — React Router setup with all routes

### Phase C: Integration & Verification

16. **End-to-end verification** *depends on steps 9, 15*
    - Backend compiles: `./mvnw clean test-compile -q` with JDK 21 succeeds
    - Flyway runs: Application starts and creates `users` table in MySQL
    - Register API: `POST /api/auth/register` returns 200 with tokens
    - Login API: `POST /api/auth/login` returns 200 with tokens
    - Protected endpoint: `GET /api/users/me` with Bearer token returns user profile
    - Frontend builds: `cd frontend && npm run build` succeeds
    - E2E flow: Landing page → Signup → Dashboard → Logout → Login → Dashboard
    - Validation errors display on forms (duplicate email, wrong password, missing fields)

### Implementation Decisions (This Phase)

| Decision | Choice | Rationale |
|---|---|---|
| JWT storage | localStorage | Simplicity for this phase; can migrate to httpOnly cookies later |
| Logout mechanism | Client-side token clear only | No Redis yet; token blacklisting deferred to Phase 3+ |
| Token rotation | Simple access + refresh pair | No Redis-backed rotation yet |
| Password hashing | BCrypt (10 rounds) | Secure default; adjustable later |
| CORS | Allow `localhost:5173` | Vite dev server during development |
| 2FA | Deferred | Per project plan — future phase |
| Users table | Full schema from plan | Includes 2FA fields, avatar_url etc. to avoid future migration |
| Scope boundary | User entity + auth + basic UI only | No accounts, transactions, categories, or other entities |

### Files Created (This Phase)

**Backend (21 new files):**

| File | Purpose |
|---|---|
| `pom.xml` *(edit)* | Add web, JPA, security, JWT, Flyway, Lombok, validation dependencies |
| `application.properties` *(edit)* | MySQL, JPA, Flyway, JWT configuration |
| `db/migration/V1__create_users.sql` | Users table DDL |
| `entity/User.java` | JPA entity matching plan's users table |
| `repository/UserRepository.java` | findByEmail(), existsByEmail() |
| `dto/request/RegisterRequest.java` | Validated registration DTO |
| `dto/request/LoginRequest.java` | Validated login DTO |
| `dto/response/AuthResponse.java` | Token response DTO |
| `dto/response/UserResponse.java` | User profile DTO |
| `dto/response/ApiErrorResponse.java` | Error response DTO |
| `security/JwtTokenProvider.java` | JWT generate/validate using jjwt |
| `security/JwtAuthenticationFilter.java` | Extract JWT from header |
| `security/JwtAuthenticationEntryPoint.java` | 401 handler |
| `security/CustomUserDetailsService.java` | Load user by email |
| `config/SecurityConfig.java` | Filter chain, CORS, CSRF |
| `service/AuthService.java` | Register/login business logic |
| `controller/AuthController.java` | /api/auth/** endpoints |
| `exception/GlobalExceptionHandler.java` | @RestControllerAdvice |
| `exception/ResourceNotFoundException.java` | 404 exception |
| `exception/BadRequestException.java` | 400 exception |
| `exception/DuplicateResourceException.java` | 409 exception |

**Frontend (new `frontend/` project, ~12 key files):**

| File | Purpose |
|---|---|
| `frontend/vite.config.ts` | Proxy /api → localhost:8080 |
| `frontend/src/types/auth.ts` | TypeScript interfaces |
| `frontend/src/services/api.ts` | Axios instance + JWT interceptor |
| `frontend/src/store/authStore.ts` | Zustand auth state |
| `frontend/src/pages/HomePage.tsx` | Landing page with hero + features |
| `frontend/src/pages/LoginPage.tsx` | Login form |
| `frontend/src/pages/SignupPage.tsx` | Registration form |
| `frontend/src/pages/DashboardPage.tsx` | Authenticated placeholder |
| `frontend/src/components/ProtectedRoute.tsx` | Auth guard |
| `frontend/src/components/Navbar.tsx` | Navigation bar |
| `frontend/src/App.tsx` | Router setup |

---

## Key Decisions & Scope

| Decision | Choice | Rationale |
|---|---|---|
| Database | MySQL 8 | Widely supported, FULLTEXT search, JSON columns, mature ecosystem |
| Caching | Redis | Fast in-memory cache for tokens, FX rates, report data, rate limiting |
| Authentication | Stateless JWT + Redis blacklist | Scalable auth with logout/revocation support |
| AI Categorization | Rule-based first → ML later | Ship fast, iterate with data |
| Bank Sync | Interface + mock data | Plaid integration deferred to reduce scope |
| Frontend | React 19 | Richest chart/component ecosystem |
| Deployment | Out of scope | Docker/K8s phase can be added later |
| Mobile app | Out of scope | PWA covers basic mobile needs |

---

## Relevant Files

| Path | Purpose |
|---|---|
| `pom.xml` | Add all Maven dependencies (Phase 1.1) |
| `src/main/resources/application.properties` | MySQL, Redis, JWT, Mail config (Phase 1.2) |
| `src/main/resources/db/migration/` | Flyway SQL migrations — all CREATE TABLE scripts (Phase 1.5) |
| `src/main/java/com/aswin/moneymanager/entity/` | JPA entities (Phase 1.3) |
| `src/main/java/com/aswin/moneymanager/enums/` | Enum types for account, transaction, category, etc. |
| `src/main/java/com/aswin/moneymanager/repository/` | Spring Data JPA repos (Phase 1.6) |
| `src/main/java/com/aswin/moneymanager/security/` | JWT + Spring Security (Phase 2) |
| `src/main/java/com/aswin/moneymanager/controller/` | REST controllers including AuthController (Phases 2–6) |
| `src/main/java/com/aswin/moneymanager/service/` | Business logic — AuthService and all domain services (Phases 2–6) |
| `src/main/java/com/aswin/moneymanager/dto/` | Request/Response DTOs (Phase 2+) |
| `src/main/java/com/aswin/moneymanager/mapper/` | Entity ↔ DTO mappers (MapStruct) |
| `src/main/java/com/aswin/moneymanager/config/` | SecurityConfig, RedisConfig, SwaggerConfig (Phase 1+) |
| `src/main/java/com/aswin/moneymanager/exception/` | Global exception handler (Phase 2+) |
| `src/main/java/com/aswin/moneymanager/scheduler/` | Scheduled jobs — FX rates, subscriptions, snapshots |
| `src/main/java/com/aswin/moneymanager/util/` | Utility classes |
| `frontend/` | React SPA — login, signup, dashboard, all pages (Phase 7) |
