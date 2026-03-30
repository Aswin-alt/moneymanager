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
