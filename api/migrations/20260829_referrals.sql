ALTER TABLE users
  ADD COLUMN referral_code VARCHAR(40) NULL AFTER avatar_url,
  ADD COLUMN referred_by_user_id BIGINT UNSIGNED NULL AFTER referral_code,
  ADD UNIQUE INDEX uq_users_referral_code (referral_code),
  ADD INDEX idx_users_referred_by (referred_by_user_id),
  ADD CONSTRAINT fk_users_referred_by
    FOREIGN KEY (referred_by_user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

UPDATE users
SET referral_code = CONCAT(
  'AK',
  id,
  UPPER(SUBSTRING(SHA1(CONCAT(id, ':ak-fashion-plus')), 1, 8))
)
WHERE referral_code IS NULL;
