UPDATE settings
SET value = 'pt'
WHERE `key` = 'default_language';

ALTER TABLE users
    MODIFY preferred_language ENUM('fr', 'en', 'pt') NOT NULL DEFAULT 'pt';
