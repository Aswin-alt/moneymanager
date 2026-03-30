CREATE TABLE budgets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    category_id     BIGINT        NOT NULL,
    month_year      VARCHAR(7)    NOT NULL,
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
