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
