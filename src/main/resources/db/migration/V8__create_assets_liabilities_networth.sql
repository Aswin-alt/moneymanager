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
