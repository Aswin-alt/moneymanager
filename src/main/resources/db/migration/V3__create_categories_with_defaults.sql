SET NAMES utf8mb4;

CREATE TABLE categories (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT,
    name            VARCHAR(50)   NOT NULL,
    icon            VARCHAR(50)   NOT NULL DEFAULT '📦',
    color           VARCHAR(7)    NOT NULL DEFAULT '#6B7280',
    category_type   ENUM('INCOME', 'EXPENSE') NOT NULL,
    parent_id       BIGINT,
    is_system       BOOLEAN       NOT NULL DEFAULT FALSE,
    sort_order      INT           NOT NULL DEFAULT 0,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_user (user_id),
    INDEX idx_categories_type (user_id, category_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Expense Categories ──────────────────────────────────────────────────────
INSERT INTO categories (user_id, name, icon, color, category_type, is_system, sort_order) VALUES
(NULL, 'Dining',           '🍽️', '#EF4444', 'EXPENSE', TRUE, 1),
(NULL, 'Groceries',        '🛒', '#F97316', 'EXPENSE', TRUE, 2),
(NULL, 'Rent / Housing',   '🏠', '#F59E0B', 'EXPENSE', TRUE, 3),
(NULL, 'Utilities',        '💡', '#EAB308', 'EXPENSE', TRUE, 4),
(NULL, 'Transport',        '🚗', '#84CC16', 'EXPENSE', TRUE, 5),
(NULL, 'Healthcare',       '🏥', '#22C55E', 'EXPENSE', TRUE, 6),
(NULL, 'Entertainment',    '🎬', '#14B8A6', 'EXPENSE', TRUE, 7),
(NULL, 'Shopping',         '🛍️', '#06B6D4', 'EXPENSE', TRUE, 8),
(NULL, 'Education',        '📚', '#3B82F6', 'EXPENSE', TRUE, 9),
(NULL, 'Insurance',        '🛡️', '#6366F1', 'EXPENSE', TRUE, 10),
(NULL, 'Subscriptions',    '📱', '#8B5CF6', 'EXPENSE', TRUE, 11),
(NULL, 'Travel',           '✈️', '#A855F7', 'EXPENSE', TRUE, 12),
(NULL, 'Personal Care',    '💇', '#D946EF', 'EXPENSE', TRUE, 13),
(NULL, 'Gifts & Donations','🎁', '#EC4899', 'EXPENSE', TRUE, 14),
(NULL, 'Taxes',            '🏛️', '#F43F5E', 'EXPENSE', TRUE, 15),
(NULL, 'Other Expense',    '📦', '#6B7280', 'EXPENSE', TRUE, 99);

-- ── Income Categories ───────────────────────────────────────────────────────
INSERT INTO categories (user_id, name, icon, color, category_type, is_system, sort_order) VALUES
(NULL, 'Salary',         '💰', '#22C55E', 'INCOME', TRUE, 1),
(NULL, 'Freelance',      '💻', '#14B8A6', 'INCOME', TRUE, 2),
(NULL, 'Investments',    '📈', '#3B82F6', 'INCOME', TRUE, 3),
(NULL, 'Business',       '🏢', '#6366F1', 'INCOME', TRUE, 4),
(NULL, 'Rental Income',  '🏘️', '#8B5CF6', 'INCOME', TRUE, 5),
(NULL, 'Refunds',        '↩️', '#06B6D4', 'INCOME', TRUE, 6),
(NULL, 'Other Income',   '📦', '#6B7280', 'INCOME', TRUE, 99);
