-- Upgrade existing databases for the match confirmation and item expiry flow.
-- Run these statements manually after checking the current schema.

USE lost_and_found;

ALTER TABLE `item`
  MODIFY COLUMN `status` ENUM('active', 'found', 'closed', 'expired') NOT NULL DEFAULT 'active',
  ADD COLUMN `expires_at` DATETIME DEFAULT NULL COMMENT '信息有效期，超过后自动过期' AFTER `images`;

ALTER TABLE `match`
  ADD COLUMN `status` ENUM('pending', 'contacted', 'rejected', 'confirmed', 'completed') NOT NULL DEFAULT 'pending' COMMENT '匹配处理状态' AFTER `match_score`,
  ADD COLUMN `lost_confirmed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '失主是否确认' AFTER `status`,
  ADD COLUMN `found_confirmed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '拾主是否确认' AFTER `lost_confirmed`,
  ADD COLUMN `completed_at` DATETIME DEFAULT NULL COMMENT '双方确认完成时间' AFTER `found_confirmed`;

UPDATE `item`
SET `expires_at` = DATE_ADD(`created_at`, INTERVAL 30 DAY)
WHERE `expires_at` IS NULL AND `status` = 'active';
