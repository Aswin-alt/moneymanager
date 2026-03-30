CREATE TABLE currency_rates (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    base_currency     VARCHAR(3)     NOT NULL,
    target_currency   VARCHAR(3)     NOT NULL,
    rate              DECIMAL(12,6)  NOT NULL,
    fetched_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_rate (base_currency, target_currency),
    INDEX idx_rate_base (base_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
