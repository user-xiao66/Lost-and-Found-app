-- =============================================================
-- 失物招领 APP — 数据库初始化脚本
-- 使用前请先创建数据库：CREATE DATABASE lost_and_found;
-- =============================================================

-- 切换到目标数据库
USE lost_and_found;

-- =============================================================
-- 1. 用户表（user）
-- 存储注册用户的基本信息
-- =============================================================
DROP TABLE IF EXISTS `notification`;
DROP TABLE IF EXISTS `match`;
DROP TABLE IF EXISTS `item`;
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
  `nickname` VARCHAR(50) NOT NULL COMMENT '用户昵称',
  `phone` VARCHAR(11) NOT NULL COMMENT '手机号，唯一，用于登录',
  `password` VARCHAR(255) NOT NULL COMMENT '加密存储的密码',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像 URL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- =============================================================
-- 2. 物品信息表（item）
-- 存储失物和招领信息，通过 type 字段区分
-- =============================================================
CREATE TABLE `item` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
  `user_id` INT NOT NULL COMMENT '外键，发布者 ID，关联 user 表',
  `type` ENUM('lost', 'found') NOT NULL COMMENT '类型：lost=失物 / found=招领',
  `name` VARCHAR(100) NOT NULL COMMENT '物品名称',
  `category` VARCHAR(50) DEFAULT '其他' COMMENT '物品分类（电子产品/证件/书籍/衣物/其他）',
  `location` VARCHAR(200) NOT NULL COMMENT '丢失或捡拾地点',
  `occur_time` DATETIME NOT NULL COMMENT '丢失或捡拾时间',
  `contact` VARCHAR(100) NOT NULL COMMENT '联系方式',
  `description` TEXT DEFAULT NULL COMMENT '详细描述',
  `images` TEXT DEFAULT NULL COMMENT '图片 URL 列表，JSON 数组格式，最多 4 张',
  `status` ENUM('active', 'found', 'closed') NOT NULL DEFAULT 'active' COMMENT '状态：active=寻找中 / found=已找到 / closed=已关闭',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_type_status` (`type`, `status`),
  KEY `idx_name` (`name`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_item_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品信息表';

-- =============================================================
-- 3. 匹配记录表（match）
-- 存储系统自动匹配的结果
-- =============================================================
CREATE TABLE `match` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
  `lost_item_id` INT NOT NULL COMMENT '外键，失物 ID，关联 item 表',
  `found_item_id` INT NOT NULL COMMENT '外键，招领 ID，关联 item 表',
  `match_score` INT NOT NULL DEFAULT 0 COMMENT '匹配度评分（基于关键词重合数）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '匹配生成时间',
  PRIMARY KEY (`id`),
  KEY `idx_lost_item` (`lost_item_id`),
  KEY `idx_found_item` (`found_item_id`),
  CONSTRAINT `fk_match_lost` FOREIGN KEY (`lost_item_id`) REFERENCES `item` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_match_found` FOREIGN KEY (`found_item_id`) REFERENCES `item` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='匹配记录表';

-- =============================================================
-- 4. 通知表（notification）
-- 存储站内通知，告知用户匹配结果
-- =============================================================
CREATE TABLE `notification` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
  `user_id` INT NOT NULL COMMENT '外键，接收通知的用户 ID，关联 user 表',
  `type` ENUM('match') NOT NULL COMMENT '通知类型：match=匹配通知',
  `match_id` INT NOT NULL COMMENT '外键，关联的匹配记录 ID',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读：0=未读 / 1=已读',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知生成时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_read` (`user_id`, `is_read`),
  KEY `idx_match_id` (`match_id`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notification_match` FOREIGN KEY (`match_id`) REFERENCES `match` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';

-- =============================================================
-- 种子数据：插入 2 条测试用户
-- 密码均为 "123456" 使用 bcrypt 加密后的值
-- =============================================================
INSERT INTO `user` (`nickname`, `phone`, `password`, `created_at`) VALUES
('张同学', '13800001111', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW()),
('李同学', '13800002222', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW());
