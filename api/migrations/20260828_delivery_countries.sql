CREATE TABLE IF NOT EXISTS delivery_countries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    country_code CHAR(2) NOT NULL UNIQUE,
    country_name VARCHAR(150) NOT NULL,
    delivery_price_eur DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_delivery_countries_status (status),
    INDEX idx_delivery_countries_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO delivery_countries (
    country_code,
    country_name,
    delivery_price_eur,
    status,
    sort_order
)
VALUES ('AO', 'Angola', 5.00, 'active', 1)
ON DUPLICATE KEY UPDATE
    country_name = VALUES(country_name),
    delivery_price_eur = VALUES(delivery_price_eur),
    status = VALUES(status),
    sort_order = VALUES(sort_order);
