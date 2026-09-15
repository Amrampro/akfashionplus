CREATE TABLE IF NOT EXISTS second_hand_proposals (
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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_second_hand_proposals_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_second_hand_proposals_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_second_hand_proposals_evaluator
        FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_second_hand_proposals_user (user_id),
    INDEX idx_second_hand_proposals_status (status),
    INDEX idx_second_hand_proposals_created (created_at),
    INDEX idx_second_hand_proposals_number (proposal_number),
    INDEX idx_second_hand_proposals_category (category_id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS second_hand_proposal_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    proposal_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_second_hand_proposal_images_proposal
        FOREIGN KEY (proposal_id) REFERENCES second_hand_proposals(id) ON DELETE CASCADE,
    INDEX idx_second_hand_proposal_images_proposal (proposal_id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
