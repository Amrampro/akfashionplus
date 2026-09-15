-- ============================================================
-- AK FASHION PLUS
-- DATABASE.SQL
-- ============================================================
--
-- Compatible:
--   MySQL 8+
--   MariaDB 10.6+
--
-- Architecture:
--   Frontend : React + Vite + TypeScript
--   Backend  : Node.js + Express.js + ESM
--   Mobile   : React Native + Expo + TypeScript
--
-- Languages:
--   fr = Français
--   en = English
--   pt = Português
--
-- Main currency:
--   EUR
--
-- Secondary display / Angola payout currency:
--   AOA
--
-- IMPORTANT:
-- Stripe keys MUST NOT be stored in this database.
--
-- Web .env:
--   VITE_STRIPE_PUBLISHABLE_KEY=
--
-- API .env:
--   STRIPE_SECRET_KEY=
--   STRIPE_WEBHOOK_SECRET=
--
-- Mobile .env:
--   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
--
-- ============================================================


SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- DROP TABLES
-- ============================================================

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS favorites;

DROP TABLE IF EXISTS gift_card_transactions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS stripe_webhook_events;

DROP TABLE IF EXISTS company_resales;
DROP TABLE IF EXISTS order_pickups;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;

DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;

DROP TABLE IF EXISTS gift_cards;
DROP TABLE IF EXISTS gift_card_types;

DROP TABLE IF EXISTS inventory_movements;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS second_hand_proposal_images;
DROP TABLE IF EXISTS second_hand_proposals;
DROP TABLE IF EXISTS categories;

DROP TABLE IF EXISTS exchange_rates;
DROP TABLE IF EXISTS delivery_countries;
DROP TABLE IF EXISTS settings;

DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS branches;


SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 1. BRANCHES / GUICHETS
-- ============================================================
--
-- Physical AK Fashion Plus locations.
-- Cashiers can be attached directly to one branch.
--
-- ============================================================

CREATE TABLE branches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,

    phone VARCHAR(50) NULL,
    email VARCHAR(190) NULL,

    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255) NULL,

    city VARCHAR(150) NOT NULL,
    province VARCHAR(150) NULL,
    postal_code VARCHAR(30) NULL,

    country_code CHAR(2) NOT NULL DEFAULT 'AO',

    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,

    opening_hours TEXT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_branches_status (status),
    INDEX idx_branches_city (city)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. USERS
-- ============================================================
--
-- No separate roles table.
--
-- user    = customer
-- cashier = counter employee
-- admin   = administrator
--
-- branch_id is mainly used for cashiers.
-- A normal customer/admin can have branch_id = NULL.
--
-- ============================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    role ENUM(
        'user',
        'cashier',
        'admin'
    ) NOT NULL DEFAULT 'user',

    branch_id BIGINT UNSIGNED NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(190) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,

    password_hash VARCHAR(255) NOT NULL,

    preferred_language ENUM(
        'fr',
        'en',
        'pt'
    ) NOT NULL DEFAULT 'fr',

    country_code CHAR(2) NULL,

    avatar_url VARCHAR(500) NULL,
    referral_code VARCHAR(40) NULL UNIQUE,
    referred_by_user_id BIGINT UNSIGNED NULL,

    status ENUM(
        'active',
        'inactive',
        'blocked',
        'pending'
    ) NOT NULL DEFAULT 'active',

    email_verified_at DATETIME NULL,

    last_login_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_users_referred_by
        FOREIGN KEY (referred_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_users_role (role),
    INDEX idx_users_branch (branch_id),
    INDEX idx_users_status (status),
    INDEX idx_users_phone (phone),
    INDEX idx_users_referred_by (referred_by_user_id)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. USER ADDRESSES
-- ============================================================

CREATE TABLE user_addresses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    label VARCHAR(100) NULL,

    recipient_name VARCHAR(200) NOT NULL,
    recipient_phone VARCHAR(50) NULL,

    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255) NULL,

    city VARCHAR(150) NOT NULL,
    province VARCHAR(150) NULL,
    postal_code VARCHAR(30) NULL,

    country_code CHAR(2) NOT NULL,

    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_addresses_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_user_addresses_user (user_id)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. SETTINGS
-- ============================================================
--
-- Simple global configuration table.
--
-- Examples:
-- company_name
-- support_email
-- support_phone
-- rental_late_fee_per_day_eur
-- gift_card_expiration_enabled
--
-- ============================================================

CREATE TABLE settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    setting_key VARCHAR(100) NOT NULL UNIQUE,

    setting_value TEXT NULL,

    description VARCHAR(500) NULL,

    updated_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_settings_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


INSERT INTO settings (
    setting_key,
    setting_value,
    description
)
VALUES
(
    'company_name',
    'AK Fashion Plus',
    'Platform/company name'
),
(
    'default_currency',
    'EUR',
    'Main commercial currency'
),
(
    'display_currency',
    'AOA',
    'Secondary currency displayed under EUR prices'
),
(
    'default_language',
    'fr',
    'Default application language'
),
(
    'rental_late_fee_per_day_eur',
    '0',
    'Default late return fee per day'
),
(
    'gift_card_expiration_enabled',
    'false',
    'Whether gift cards can expire'
);


-- ============================================================
-- 5. DELIVERY COUNTRIES
-- ============================================================
--
-- Delivery fees are configured by country and applied server-side
-- during checkout.
--
-- ============================================================

CREATE TABLE delivery_countries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    country_code CHAR(2) NOT NULL UNIQUE,
    country_name VARCHAR(150) NOT NULL,

    delivery_price_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    status ENUM('active', 'inactive')
        NOT NULL DEFAULT 'active',

    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_delivery_countries_status (status),
    INDEX idx_delivery_countries_sort (sort_order)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


INSERT INTO delivery_countries (
    country_code,
    country_name,
    delivery_price_eur,
    status,
    sort_order
)
VALUES
('AO', 'Angola', 5.00, 'active', 1);


-- ============================================================
-- 6. EXCHANGE RATES
-- ============================================================
--
-- The admin manages EUR -> AOA here.
--
-- IMPORTANT:
-- Orders store their own rate snapshot.
-- Changing today's rate must NEVER modify old orders.
--
-- ============================================================

CREATE TABLE exchange_rates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    base_currency CHAR(3) NOT NULL DEFAULT 'EUR',
    quote_currency CHAR(3) NOT NULL DEFAULT 'AOA',

    rate DECIMAL(18, 6) NOT NULL,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    created_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exchange_rates_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_exchange_rates_current (
        base_currency,
        quote_currency,
        is_current
    ),

    INDEX idx_exchange_rates_created (
        created_at
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- Initial placeholder rate.
-- Admin can change it immediately.

INSERT INTO exchange_rates (
    base_currency,
    quote_currency,
    rate,
    is_current
)
VALUES (
    'EUR',
    'AOA',
    1000.000000,
    TRUE
);


-- ============================================================
-- 6. CATEGORIES
-- ============================================================
--
-- Only 3 languages are currently required.
-- We keep them directly here instead of creating
-- extra translation tables.
--
-- ============================================================

CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    parent_id BIGINT UNSIGNED NULL,

    slug VARCHAR(180) NOT NULL UNIQUE,

    name_fr VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    name_pt VARCHAR(150) NOT NULL,

    description_fr TEXT NULL,
    description_en TEXT NULL,
    description_pt TEXT NULL,

    image_url VARCHAR(500) NULL,

    sort_order INT NOT NULL DEFAULT 0,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id)
        REFERENCES categories(id)
        ON DELETE SET NULL,

    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_status (status)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. SECOND HAND SALE PROPOSALS
-- ============================================================
--
-- Customer-owned clothes proposed to AK Fashion Plus.
-- This is intentionally separate from company_resales.
--
-- ============================================================

CREATE TABLE second_hand_proposals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    proposal_number VARCHAR(100) NOT NULL UNIQUE,

    user_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NULL,

    item_type VARCHAR(120) NOT NULL,
    brand VARCHAR(150) NOT NULL,
    size VARCHAR(80) NULL,
    color VARCHAR(100) NULL,

    condition_state ENUM(
        'new_never_worn',
        'excellent',
        'very_good',
        'good',
        'fair'
    ) NOT NULL,

    description TEXT NULL,

    desired_price_eur DECIMAL(12, 2) NOT NULL,
    offered_price_eur DECIMAL(12, 2) NULL,
    final_price_eur DECIMAL(12, 2) NULL,

    status ENUM(
        'submitted',
        'under_review',
        'offer_sent',
        'accepted',
        'rejected',
        'awaiting_item',
        'item_received',
        'verified',
        'verification_failed',
        'payment_pending',
        'paid',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'submitted',

    bank_account_holder VARCHAR(190) NOT NULL,
    bank_account_number TEXT NOT NULL,
    bank_name VARCHAR(190) NOT NULL,

    evaluated_by BIGINT UNSIGNED NULL,
    evaluated_at DATETIME NULL,
    admin_notes TEXT NULL,

    handover_method ENUM('dropoff', 'shipping') NULL,
    handover_instructions TEXT NULL,

    user_responded_at DATETIME NULL,
    accepted_at DATETIME NULL,
    rejected_at DATETIME NULL,
    item_received_at DATETIME NULL,
    verified_at DATETIME NULL,
    paid_at DATETIME NULL,
    payment_reference VARCHAR(190) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_second_hand_proposals_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_second_hand_proposals_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_second_hand_proposals_evaluator
        FOREIGN KEY (evaluated_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_second_hand_proposals_user (user_id),
    INDEX idx_second_hand_proposals_status (status),
    INDEX idx_second_hand_proposals_created (created_at),
    INDEX idx_second_hand_proposals_number (proposal_number),
    INDEX idx_second_hand_proposals_category (category_id)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


CREATE TABLE second_hand_proposal_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    proposal_id BIGINT UNSIGNED NOT NULL,

    image_url VARCHAR(500) NOT NULL,

    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_second_hand_proposal_images_proposal
        FOREIGN KEY (proposal_id)
        REFERENCES second_hand_proposals(id)
        ON DELETE CASCADE,

    INDEX idx_second_hand_proposal_images_proposal (proposal_id)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. PRODUCTS
-- ============================================================
--
-- A product can:
--
-- - be sold
-- - be rented
-- - be sold AND rented
--
-- condition_type:
-- - new
-- - second_hand
--
-- ============================================================

CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    category_id BIGINT UNSIGNED NOT NULL,

    sku VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(200) NOT NULL UNIQUE,

    name_fr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,

    description_fr LONGTEXT NULL,
    description_en LONGTEXT NULL,
    description_pt LONGTEXT NULL,

    condition_type ENUM(
        'new',
        'second_hand'
    ) NOT NULL DEFAULT 'new',

    sale_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rental_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    sale_price_eur DECIMAL(12, 2) NULL,

    rental_price_per_day_eur DECIMAL(12, 2) NULL,

    rental_deposit_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    minimum_rental_days INT UNSIGNED
        NOT NULL DEFAULT 1,

    maximum_rental_days INT UNSIGNED NULL,

    featured BOOLEAN NOT NULL DEFAULT FALSE,

    status ENUM(
        'draft',
        'active',
        'inactive',
        'archived'
    ) NOT NULL DEFAULT 'draft',

    created_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_products_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_products_category (category_id),
    INDEX idx_products_condition (condition_type),
    INDEX idx_products_status (status),
    INDEX idx_products_featured (featured),
    INDEX idx_products_sale (sale_enabled),
    INDEX idx_products_rental (rental_enabled)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. PRODUCT VARIANTS
-- ============================================================
--
-- Example:
--
-- Product:
--   T-shirt AK
--
-- Variants:
--   Black / M
--   Black / L
--   Blue / M
--
-- Stock is managed here.
--
-- ============================================================

CREATE TABLE product_variants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_id BIGINT UNSIGNED NOT NULL,

    sku VARCHAR(100) NOT NULL UNIQUE,

    size VARCHAR(50) NULL,

    color_name VARCHAR(100) NULL,
    color_hex VARCHAR(20) NULL,

    barcode VARCHAR(100) NULL UNIQUE,

    sale_price_eur DECIMAL(12, 2) NULL,

    rental_price_per_day_eur DECIMAL(12, 2) NULL,

    rental_deposit_eur DECIMAL(12, 2) NULL,

    stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,

    reserved_quantity INT UNSIGNED NOT NULL DEFAULT 0,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_variants_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    INDEX idx_product_variants_product (product_id),
    INDEX idx_product_variants_status (status),
    INDEX idx_product_variants_size (size),
    INDEX idx_product_variants_color (color_name)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. PRODUCT IMAGES
-- ============================================================

CREATE TABLE product_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_id BIGINT UNSIGNED NOT NULL,

    image_url VARCHAR(500) NOT NULL,

    alt_text VARCHAR(255) NULL,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    INDEX idx_product_images_product (product_id)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. INVENTORY MOVEMENTS
-- ============================================================
--
-- Keeps historical stock changes.
--
-- The current quantity remains directly in product_variants,
-- making everyday code simple.
--
-- ============================================================

CREATE TABLE inventory_movements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_variant_id BIGINT UNSIGNED NOT NULL,

    movement_type ENUM(
        'stock_in',
        'sale',
        'sale_cancelled',
        'rental_out',
        'rental_return',
        'damage',
        'lost',
        'adjustment',
        'company_resale'
    ) NOT NULL,

    quantity_change INT NOT NULL,

    quantity_before INT UNSIGNED NOT NULL,
    quantity_after INT UNSIGNED NOT NULL,

    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,

    notes TEXT NULL,

    created_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_variant
        FOREIGN KEY (product_variant_id)
        REFERENCES product_variants(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_inventory_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_inventory_variant (product_variant_id),

    INDEX idx_inventory_reference (
        reference_type,
        reference_id
    ),

    INDEX idx_inventory_created (
        created_at
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. GIFT CARD TYPES
-- ============================================================
--
-- These are models/templates.
--
-- Example:
--
-- Kavula  = 1000 EUR
-- Leticia = 500 EUR
-- Senga   = 300 EUR
-- Kimolo  = 200 EUR
-- Mwanza  = 100 EUR
--
-- Admin can edit or create new types.
--
-- ============================================================

CREATE TABLE gift_card_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL UNIQUE,

    code VARCHAR(50) NOT NULL UNIQUE,

    value_eur DECIMAL(12, 2) NOT NULL,

    description_fr TEXT NULL,
    description_en TEXT NULL,
    description_pt TEXT NULL,

    image_url VARCHAR(500) NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_gift_card_types_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_gift_card_types_status (status)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


INSERT INTO gift_card_types (
    name,
    code,
    value_eur
)
VALUES
(
    'Kavula',
    'KAVULA',
    1000.00
),
(
    'Leticia',
    'LETICIA',
    500.00
),
(
    'Senga',
    'SENGA',
    300.00
),
(
    'Kimolo',
    'KIMOLO',
    200.00
),
(
    'Mwanza',
    'MWANZA',
    100.00
);


-- ============================================================
-- 12. REAL GIFT CARDS
-- ============================================================
--
-- VERY IMPORTANT:
--
-- ONE USER CAN OWN MANY GIFT CARDS.
--
-- owner_user_id is NOT UNIQUE.
--
--
-- purchased_by:
-- User who paid for the card.
--
-- owner_user_id:
-- User who owns/received the card.
--
-- They can be different.
--
--
-- Example:
--
-- Paul purchases Kavula.
-- Paul chooses Marie as beneficiary.
--
-- purchased_by  = Paul
-- owner_user_id = Marie
--
--
-- Admin can also generate a card with:
--
-- owner_user_id = NULL
--
-- and assign it later.
--
-- ============================================================

CREATE TABLE gift_cards (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    gift_card_type_id BIGINT UNSIGNED NOT NULL,

    serial_number VARCHAR(100) NOT NULL UNIQUE,

    purchased_by BIGINT UNSIGNED NULL,

    owner_user_id BIGINT UNSIGNED NULL,

    initial_balance_eur DECIMAL(12, 2) NOT NULL,

    current_balance_eur DECIMAL(12, 2) NOT NULL,

    reserved_balance_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    source ENUM(
        'customer_purchase',
        'admin_created'
    ) NOT NULL,

    status ENUM(
        'pending_payment',
        'unassigned',
        'active',
        'blocked',
        'fully_used',
        'expired',
        'cancelled'
    ) NOT NULL DEFAULT 'unassigned',

    expires_at DATETIME NULL,

    activated_at DATETIME NULL,
    assigned_at DATETIME NULL,

    created_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_gift_cards_type
        FOREIGN KEY (gift_card_type_id)
        REFERENCES gift_card_types(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_gift_cards_purchased_by
        FOREIGN KEY (purchased_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_gift_cards_owner
        FOREIGN KEY (owner_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_gift_cards_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_gift_cards_owner (
        owner_user_id
    ),

    INDEX idx_gift_cards_purchased_by (
        purchased_by
    ),

    INDEX idx_gift_cards_status (
        status
    ),

    INDEX idx_gift_cards_owner_status (
        owner_user_id,
        status
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 13. CARTS
-- ============================================================

CREATE TABLE carts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    status ENUM(
        'active',
        'converted',
        'abandoned'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_carts_user (
        user_id,
        status
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 14. CART ITEMS
-- ============================================================

CREATE TABLE cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    cart_id BIGINT UNSIGNED NOT NULL,

    product_variant_id BIGINT UNSIGNED NOT NULL,

    item_type ENUM(
        'purchase',
        'rental'
    ) NOT NULL,

    quantity INT UNSIGNED NOT NULL DEFAULT 1,

    rental_start_date DATE NULL,
    rental_end_date DATE NULL,
    rental_days INT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id)
        REFERENCES carts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cart_items_variant
        FOREIGN KEY (product_variant_id)
        REFERENCES product_variants(id)
        ON DELETE RESTRICT,

    INDEX idx_cart_items_cart (cart_id),
    INDEX idx_cart_items_variant (product_variant_id)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 15. ORDERS
-- ============================================================
--
-- One order can contain:
--
-- purchase items
-- rental items
-- or both
--
--
-- exchange_rate_eur_to_aoa stores the rate
-- at the exact moment the order was confirmed.
--
-- ============================================================

CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_number VARCHAR(50) NOT NULL UNIQUE,

    user_id BIGINT UNSIGNED NOT NULL,

    fulfillment_type ENUM(
        'delivery',
        'pickup'
    ) NOT NULL,

    branch_id BIGINT UNSIGNED NULL,

    -- ========================================================
    -- BENEFICIARY
    -- ========================================================
    --
    -- The person paying can be different
    -- from the person collecting in Angola.
    --
    -- ========================================================

    beneficiary_name VARCHAR(200) NULL,
    beneficiary_phone VARCHAR(50) NULL,

    -- Secure pickup reference.
    pickup_code_hash VARCHAR(255) NULL,
    pickup_qr_token_hash VARCHAR(255) NULL,

    -- ========================================================
    -- SHIPPING SNAPSHOT
    -- ========================================================

    shipping_name VARCHAR(200) NULL,
    shipping_phone VARCHAR(50) NULL,

    shipping_address_line_1 VARCHAR(255) NULL,
    shipping_address_line_2 VARCHAR(255) NULL,

    shipping_city VARCHAR(150) NULL,
    shipping_province VARCHAR(150) NULL,
    shipping_postal_code VARCHAR(30) NULL,
    shipping_country_code CHAR(2) NULL,

    -- ========================================================
    -- SHIPPING TRACKING
    -- ========================================================

    shipping_carrier VARCHAR(150) NULL,
    shipping_tracking_number VARCHAR(255) NULL,

    -- ========================================================
    -- AMOUNTS
    -- ========================================================

    subtotal_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    rental_deposit_total_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    shipping_total_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    discount_total_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    total_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    paid_total_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    refunded_total_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    -- ========================================================
    -- EUR -> AOA SNAPSHOT
    -- ========================================================

    exchange_rate_eur_to_aoa DECIMAL(18, 6) NOT NULL,

    total_aoa DECIMAL(18, 2) NOT NULL,

    -- ========================================================
    -- COMPANY RESALE
    -- ========================================================

    resell_to_company BOOLEAN NOT NULL DEFAULT FALSE,

    -- ========================================================
    -- PAYMENT STATUS
    -- ========================================================

    payment_status ENUM(
        'unpaid',
        'partially_paid',
        'paid',
        'partially_refunded',
        'refunded',
        'failed'
    ) NOT NULL DEFAULT 'unpaid',

    -- ========================================================
    -- ORDER STATUS
    -- ========================================================

    status ENUM(
        'pending_payment',
        'confirmed',
        'processing',
        'ready_for_pickup',
        'shipped',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending_payment',

    customer_notes TEXT NULL,
    admin_notes TEXT NULL,

    paid_at DATETIME NULL,
    shipped_at DATETIME NULL,
    completed_at DATETIME NULL,
    cancelled_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_orders_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE SET NULL,

    INDEX idx_orders_user (user_id),
    INDEX idx_orders_branch (branch_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_created (created_at)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 16. ORDER ITEMS
-- ============================================================
--
-- This table handles BOTH purchases and rentals.
--
-- No separate rentals table is necessary.
--
-- ============================================================

CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT UNSIGNED NOT NULL,

    product_id BIGINT UNSIGNED NOT NULL,

    product_variant_id BIGINT UNSIGNED NOT NULL,

    item_type ENUM(
        'purchase',
        'rental'
    ) NOT NULL,

    -- ========================================================
    -- SNAPSHOTS
    -- ========================================================
    --
    -- Even if the product changes later,
    -- the old order must remain exactly the same.
    --
    -- ========================================================

    product_name VARCHAR(255) NOT NULL,

    sku VARCHAR(100) NOT NULL,

    size VARCHAR(50) NULL,
    color VARCHAR(100) NULL,

    condition_type ENUM(
        'new',
        'second_hand'
    ) NOT NULL,

    quantity INT UNSIGNED NOT NULL DEFAULT 1,

    unit_price_eur DECIMAL(12, 2) NOT NULL,

    line_total_eur DECIMAL(12, 2) NOT NULL,

    -- ========================================================
    -- PURCHASE / COMPANY RESALE
    -- ========================================================

    resell_to_company BOOLEAN NOT NULL DEFAULT FALSE,

    -- ========================================================
    -- RENTAL INFORMATION
    -- ========================================================

    rental_start_date DATE NULL,
    rental_end_date DATE NULL,

    rental_days INT UNSIGNED NULL,

    rental_price_per_day_eur DECIMAL(12, 2) NULL,

    rental_deposit_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    rental_status ENUM(
        'not_applicable',
        'reserved',
        'ready_for_pickup',
        'active',
        'return_due',
        'overdue',
        'returned',
        'damaged',
        'lost',
        'cancelled'
    ) NOT NULL DEFAULT 'not_applicable',

    rental_picked_up_at DATETIME NULL,

    rental_returned_at DATETIME NULL,

    rental_late_fee_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    rental_damage_fee_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    rental_return_notes TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_order_items_variant
        FOREIGN KEY (product_variant_id)
        REFERENCES product_variants(id)
        ON DELETE RESTRICT,

    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id),
    INDEX idx_order_items_variant (product_variant_id),

    INDEX idx_order_items_rental_dates (
        product_variant_id,
        rental_start_date,
        rental_end_date
    ),

    INDEX idx_order_items_rental_status (
        rental_status
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 17. ORDER STATUS HISTORY
-- ============================================================
--
-- We retain this because tracking important order changes
-- is useful to customers, cashiers and administrators.
--
-- ============================================================

CREATE TABLE order_status_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT UNSIGNED NOT NULL,

    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,

    notes TEXT NULL,

    changed_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_status_history_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_status_history_user
        FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_order_status_history_order (
        order_id
    ),

    INDEX idx_order_status_history_created (
        created_at
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 18. ORDER PICKUPS
-- ============================================================
--
-- Physical clothing/rental handovers at a branch.
--
-- This is NOT for cash payouts from company resales.
-- Those are handled in company_resales.
--
-- ============================================================

CREATE TABLE order_pickups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT UNSIGNED NOT NULL,

    branch_id BIGINT UNSIGNED NOT NULL,

    cashier_id BIGINT UNSIGNED NOT NULL,

    pickup_type ENUM(
        'purchase',
        'rental',
        'rental_return'
    ) NOT NULL,

    beneficiary_name VARCHAR(200) NOT NULL,

    beneficiary_phone VARCHAR(50) NULL,

    notes TEXT NULL,

    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_pickups_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_order_pickups_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_order_pickups_cashier
        FOREIGN KEY (cashier_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    INDEX idx_order_pickups_order (order_id),
    INDEX idx_order_pickups_branch (branch_id),
    INDEX idx_order_pickups_cashier (cashier_id),
    INDEX idx_order_pickups_completed (completed_at)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 19. COMPANY RESALES
-- ============================================================
--
-- Customer buys a product, but chooses:
--
-- "Resell to AK Fashion Plus"
--
-- The clothing is NOT handed to the customer.
--
-- Instead, the beneficiary can collect the equivalent
-- amount in AOA at an AK Fashion Plus branch.
--
--
-- Example:
--
-- item = 200 EUR
--
-- exchange rate snapshot:
-- 1 EUR = 1,200 AOA
--
-- payout:
-- 240,000 AOA
--
-- ============================================================

CREATE TABLE company_resales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_item_id BIGINT UNSIGNED NOT NULL UNIQUE,

    user_id BIGINT UNSIGNED NOT NULL,

    branch_id BIGINT UNSIGNED NOT NULL,

    amount_eur DECIMAL(12, 2) NOT NULL,

    exchange_rate_eur_to_aoa DECIMAL(18, 6) NOT NULL,

    payout_amount_aoa DECIMAL(18, 2) NOT NULL,

    beneficiary_name VARCHAR(200) NOT NULL,

    beneficiary_phone VARCHAR(50) NULL,

    status ENUM(
        'pending',
        'approved',
        'ready_for_payout',
        'paid',
        'rejected',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    cashier_id BIGINT UNSIGNED NULL,

    identity_document_type VARCHAR(100) NULL,

    identity_document_number VARCHAR(150) NULL,

    notes TEXT NULL,

    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    approved_at DATETIME NULL,

    paid_at DATETIME NULL,

    approved_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_company_resales_order_item
        FOREIGN KEY (order_item_id)
        REFERENCES order_items(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_company_resales_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_company_resales_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_company_resales_cashier
        FOREIGN KEY (cashier_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_company_resales_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_company_resales_user (user_id),
    INDEX idx_company_resales_branch (branch_id),
    INDEX idx_company_resales_status (status),
    INDEX idx_company_resales_cashier (cashier_id),
    INDEX idx_company_resales_created (created_at)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 20. STRIPE WEBHOOK EVENTS
-- ============================================================
--
-- Essential.
--
-- Stripe may send the same webhook several times.
--
-- stripe_event_id UNIQUE prevents us from:
--
-- - confirming an order twice
-- - generating a gift card twice
-- - recording payment twice
--
-- ============================================================

CREATE TABLE stripe_webhook_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,

    event_type VARCHAR(150) NOT NULL,

    status ENUM(
        'received',
        'processed',
        'failed',
        'ignored'
    ) NOT NULL DEFAULT 'received',

    payload JSON NULL,

    error_message TEXT NULL,

    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    processed_at DATETIME NULL,

    INDEX idx_stripe_webhooks_type (event_type),
    INDEX idx_stripe_webhooks_status (status)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 21. PAYMENTS
-- ============================================================
--
-- SIMPLIFIED PAYMENT MODEL
--
-- One order can have MANY payment rows.
--
--
-- Example:
--
-- Order total = 700 EUR
--
-- Payment row #1:
--   method = gift_card
--   amount = 500
--
-- Payment row #2:
--   method = stripe
--   amount = 200
--
--
-- There is therefore NO need for:
--
-- payments
-- + payment_allocations
-- + payment_sources
--
-- ============================================================

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    payment_reference VARCHAR(100) NOT NULL UNIQUE,

    user_id BIGINT UNSIGNED NOT NULL,

    order_id BIGINT UNSIGNED NULL,

    gift_card_id BIGINT UNSIGNED NULL,

    purpose ENUM(
        'order',
        'gift_card_purchase',
        'rental_fee',
        'rental_deposit',
        'rental_late_fee',
        'rental_damage_fee',
        'other'
    ) NOT NULL,

    method ENUM(
        'stripe',
        'gift_card'
    ) NOT NULL,

    amount_eur DECIMAL(12, 2) NOT NULL,

    status ENUM(
        'pending',
        'reserved',
        'requires_action',
        'succeeded',
        'failed',
        'cancelled',
        'refunded'
    ) NOT NULL DEFAULT 'pending',

    -- ========================================================
    -- STRIPE
    -- ========================================================

    stripe_payment_intent_id VARCHAR(255) NULL UNIQUE,

    stripe_checkout_session_id VARCHAR(255) NULL UNIQUE,

    stripe_charge_id VARCHAR(255) NULL,

    stripe_refund_id VARCHAR(255) NULL,

    failure_message TEXT NULL,

    metadata JSON NULL,

    succeeded_at DATETIME NULL,
    refunded_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_payments_gift_card
        FOREIGN KEY (gift_card_id)
        REFERENCES gift_cards(id)
        ON DELETE SET NULL,

    INDEX idx_payments_user (user_id),
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_gift_card (gift_card_id),
    INDEX idx_payments_method (method),
    INDEX idx_payments_purpose (purpose),
    INDEX idx_payments_status (status),
    INDEX idx_payments_created (created_at)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- IMPORTANT PAYMENT EXAMPLES
-- ============================================================
--
-- CASE 1
-- ==========================================================
--
-- Buying a gift card:
--
-- purpose = gift_card_purchase
-- method  = stripe
-- gift_card_id = generated card
--
--
-- Gift cards themselves can ONLY be purchased by Stripe.
-- This rule will be enforced by the API.
--
--
-- CASE 2
-- ==========================================================
--
-- Order = 700 EUR
--
-- Gift card has 500 EUR.
--
--
-- payments:
--
-- row 1
-- method       = gift_card
-- amount       = 500
-- gift_card_id = customer's card
-- status       = reserved
--
-- row 2
-- method       = stripe
-- amount       = 200
-- status       = pending
--
--
-- Once Stripe succeeds:
--
-- gift card payment -> succeeded
-- stripe payment    -> succeeded
-- order             -> paid
--
--
-- If Stripe fails:
--
-- gift card reservation is released.
--
-- ============================================================


-- ============================================================
-- 22. GIFT CARD TRANSACTIONS
-- ============================================================
--
-- Financial ledger.
--
-- EVERY gift card balance change must be recorded here.
--
-- ============================================================

CREATE TABLE gift_card_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    transaction_reference VARCHAR(100) NOT NULL UNIQUE,

    gift_card_id BIGINT UNSIGNED NOT NULL,

    payment_id BIGINT UNSIGNED NULL,

    order_id BIGINT UNSIGNED NULL,

    type ENUM(
        'created',
        'activated',
        'assigned',

        'payment_reserved',
        'payment_completed',
        'payment_released',

        'refund',

        'admin_credit',
        'admin_debit',

        'blocked',
        'unblocked',

        'expired',
        'cancelled'
    ) NOT NULL,

    amount_eur DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

    balance_before_eur DECIMAL(12, 2) NOT NULL,

    balance_after_eur DECIMAL(12, 2) NOT NULL,

    reserved_before_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    reserved_after_eur DECIMAL(12, 2)
        NOT NULL DEFAULT 0.00,

    description TEXT NULL,

    created_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_gift_card_transactions_card
        FOREIGN KEY (gift_card_id)
        REFERENCES gift_cards(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_gift_card_transactions_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_gift_card_transactions_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_gift_card_transactions_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_gift_card_transactions_card (
        gift_card_id
    ),

    INDEX idx_gift_card_transactions_payment (
        payment_id
    ),

    INDEX idx_gift_card_transactions_order (
        order_id
    ),

    INDEX idx_gift_card_transactions_created (
        created_at
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 23. FAVORITES
-- ============================================================
--
-- Simple wishlist system without separate wishlist table.
--
-- Each user has effectively one list of favorites.
--
-- ============================================================

CREATE TABLE favorites (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    product_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_favorites_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_favorites_user_product (
        user_id,
        product_id
    ),

    INDEX idx_favorites_user (user_id)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 24. PRODUCT REVIEWS
-- ============================================================
--
-- Customer must be logged in.
--
-- average rating can simply be calculated using:
--
-- AVG(rating)
--
-- ============================================================

CREATE TABLE product_reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_id BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,

    order_item_id BIGINT UNSIGNED NULL,

    rating TINYINT UNSIGNED NOT NULL,

    title VARCHAR(255) NULL,

    comment TEXT NULL,

    verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,

    status ENUM(
        'pending',
        'published',
        'rejected',
        'hidden'
    ) NOT NULL DEFAULT 'pending',

    admin_reply TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_reviews_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_product_reviews_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_product_reviews_order_item
        FOREIGN KEY (order_item_id)
        REFERENCES order_items(id)
        ON DELETE SET NULL,

    UNIQUE KEY uq_product_reviews_order_item (
        user_id,
        order_item_id
    ),

    INDEX idx_product_reviews_product (
        product_id,
        status
    ),

    INDEX idx_product_reviews_user (
        user_id
    ),

    INDEX idx_product_reviews_rating (
        rating
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 25. NOTIFICATIONS
-- ============================================================
--
-- Used by web/mobile:
--
-- - order ready
-- - gift card received
-- - rental due
-- - payment successful
-- - company resale ready
--
-- ============================================================

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    type VARCHAR(100) NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    data JSON NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_notifications_user (
        user_id
    ),

    INDEX idx_notifications_unread (
        user_id,
        is_read
    ),

    INDEX idx_notifications_created (
        created_at
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 26. AUDIT LOGS
-- ============================================================
--
-- Important administrative actions.
--
-- Examples:
--
-- exchange_rate.updated
-- gift_card.created
-- gift_card.balance_adjusted
-- company_resale.paid
-- product.updated
-- cashier.created
-- order.cancelled
--
-- ============================================================

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    action VARCHAR(150) NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id BIGINT UNSIGNED NULL,

    old_data JSON NULL,

    new_data JSON NULL,

    ip_address VARCHAR(45) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_audit_logs_user (
        user_id
    ),

    INDEX idx_audit_logs_entity (
        entity_type,
        entity_id
    ),

    INDEX idx_audit_logs_action (
        action
    ),

    INDEX idx_audit_logs_created (
        created_at
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- VIEWS
-- ============================================================
--
-- Views are used only for useful calculations.
-- They do NOT create additional business complexity.
--
-- ============================================================


-- ============================================================
-- CURRENT EUR -> AOA EXCHANGE RATE
-- ============================================================

CREATE OR REPLACE VIEW v_current_exchange_rate AS

SELECT
    id,
    base_currency,
    quote_currency,
    rate,
    created_at

FROM exchange_rates

WHERE
    base_currency = 'EUR'
    AND quote_currency = 'AOA'
    AND is_current = TRUE

ORDER BY id DESC

LIMIT 1;


-- ============================================================
-- PRODUCT RATINGS
-- ============================================================

CREATE OR REPLACE VIEW v_product_ratings AS

SELECT
    product_id,

    COUNT(*) AS total_reviews,

    ROUND(
        AVG(rating),
        2
    ) AS average_rating

FROM product_reviews

WHERE status = 'published'

GROUP BY product_id;


-- ============================================================
-- USER GIFT CARDS
-- ============================================================
--
-- One user can appear many times because
-- one user can own many cards.
--
-- ============================================================

CREATE OR REPLACE VIEW v_user_gift_cards AS

SELECT
    gc.id,

    gc.owner_user_id,

    gc.serial_number,

    gct.name AS card_name,

    gct.code AS card_code,

    gc.initial_balance_eur,

    gc.current_balance_eur,

    gc.reserved_balance_eur,

    (
        gc.current_balance_eur
        - gc.reserved_balance_eur
    ) AS available_balance_eur,

    gc.status,

    gc.expires_at,

    gc.created_at

FROM gift_cards gc

INNER JOIN gift_card_types gct
    ON gct.id = gc.gift_card_type_id;


-- ============================================================
-- TOTAL GIFT CARD BALANCE PER USER
-- ============================================================

CREATE OR REPLACE VIEW v_user_gift_card_totals AS

SELECT
    owner_user_id,

    COUNT(*) AS total_cards,

    SUM(
        current_balance_eur
    ) AS current_balance_eur,

    SUM(
        reserved_balance_eur
    ) AS reserved_balance_eur,

    SUM(
        current_balance_eur
        - reserved_balance_eur
    ) AS available_balance_eur

FROM gift_cards

WHERE
    owner_user_id IS NOT NULL
    AND status = 'active'

GROUP BY owner_user_id;


-- ============================================================
-- GIFT CARD GLOBAL LIABILITY
-- ============================================================
--
-- Total amount AK Fashion Plus still owes
-- through active gift card balances.
--
-- ============================================================

CREATE OR REPLACE VIEW v_gift_card_liability AS

SELECT
    COUNT(*) AS active_cards,

    COALESCE(
        SUM(current_balance_eur),
        0
    ) AS total_balance_eur,

    COALESCE(
        SUM(reserved_balance_eur),
        0
    ) AS total_reserved_eur,

    COALESCE(
        SUM(
            current_balance_eur
            - reserved_balance_eur
        ),
        0
    ) AS total_available_eur

FROM gift_cards

WHERE status = 'active';


-- ============================================================
-- COMPANY RESALE CASH LIABILITY BY BRANCH
-- ============================================================
--
-- Amount of cash branches need to prepare.
--
-- ============================================================

CREATE OR REPLACE VIEW v_company_resale_liability AS

SELECT
    cr.branch_id,

    b.name AS branch_name,

    COUNT(*) AS total_operations,

    COALESCE(
        SUM(cr.amount_eur),
        0
    ) AS total_eur,

    COALESCE(
        SUM(cr.payout_amount_aoa),
        0
    ) AS total_aoa

FROM company_resales cr

INNER JOIN branches b
    ON b.id = cr.branch_id

WHERE cr.status IN (
    'approved',
    'ready_for_payout'
)

GROUP BY
    cr.branch_id,
    b.name;


-- ============================================================
-- DAILY SALES
-- ============================================================

CREATE OR REPLACE VIEW v_daily_sales AS

SELECT
    DATE(created_at) AS sale_date,

    COUNT(*) AS total_orders,

    COALESCE(
        SUM(
            CASE
                WHEN payment_status = 'paid'
                THEN total_eur
                ELSE 0
            END
        ),
        0
    ) AS revenue_eur

FROM orders

GROUP BY DATE(created_at);


-- ============================================================
-- MONTHLY SALES
-- ============================================================

CREATE OR REPLACE VIEW v_monthly_sales AS

SELECT
    YEAR(created_at) AS sale_year,

    MONTH(created_at) AS sale_month,

    COUNT(*) AS total_orders,

    COALESCE(
        SUM(
            CASE
                WHEN payment_status = 'paid'
                THEN total_eur
                ELSE 0
            END
        ),
        0
    ) AS revenue_eur

FROM orders

GROUP BY
    YEAR(created_at),
    MONTH(created_at);


-- ============================================================
-- ACTIVE RENTALS
-- ============================================================

CREATE OR REPLACE VIEW v_active_rentals AS

SELECT
    oi.id AS order_item_id,

    oi.order_id,

    o.order_number,

    o.user_id,

    oi.product_id,

    oi.product_variant_id,

    oi.product_name,

    oi.rental_start_date,

    oi.rental_end_date,

    oi.rental_days,

    oi.rental_status,

    oi.rental_price_per_day_eur,

    oi.line_total_eur

FROM order_items oi

INNER JOIN orders o
    ON o.id = oi.order_id

WHERE
    oi.item_type = 'rental'
    AND oi.rental_status IN (
        'reserved',
        'ready_for_pickup',
        'active',
        'return_due',
        'overdue'
    );


-- ============================================================
-- END OF AK FASHION PLUS DATABASE
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;
