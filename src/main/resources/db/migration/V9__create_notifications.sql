CREATE TABLE notifications (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT         NOT NULL,
    notification_type ENUM('BUDGET_WARNING', 'BUDGET_EXCEEDED', 'SUBSCRIPTION_DUE',
                           'ANOMALY_DETECTED', 'CASH_FLOW_ALERT', 'SYSTEM') NOT NULL,
    title             VARCHAR(200)   NOT NULL,
    message           VARCHAR(1000)  NOT NULL,
    reference_id      BIGINT,
    reference_type    VARCHAR(50),
    is_read           BOOLEAN        NOT NULL DEFAULT FALSE,
    is_email_sent     BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
