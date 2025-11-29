-- Special Offers Table Migration
-- Run this SQL in your MySQL database
-- Optimized for direct server upload

-- Drop table if exists (optional - remove if you want to keep existing data)
-- DROP TABLE IF EXISTS `special_offers`;

-- Create the special_offers table with all columns and constraints
CREATE TABLE IF NOT EXISTS `special_offers` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `icon` VARCHAR(50) NOT NULL DEFAULT '🎁',
  `discount_percentage` INT(11) DEFAULT NULL COMMENT 'Discount percentage (0-100)',
  `discount_text` VARCHAR(100) DEFAULT NULL COMMENT 'e.g., "Up to 70% OFF"',
  `highlight_text` VARCHAR(255) DEFAULT NULL COMMENT 'Additional highlight text',
  `badge_text` VARCHAR(100) DEFAULT NULL COMMENT 'Badge or tag text',
  `timer_enabled` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Show countdown timer',
  `timer_text` VARCHAR(100) DEFAULT NULL COMMENT 'e.g., "Ends in 24 hours!"',
  `start_date` DATETIME DEFAULT NULL COMMENT 'Offer start date/time',
  `end_date` DATETIME DEFAULT NULL COMMENT 'Offer end date/time',
  `link_url` VARCHAR(500) NOT NULL DEFAULT '/products',
  `button_text` VARCHAR(50) NOT NULL DEFAULT 'Shop Now',
  `background_color` VARCHAR(50) DEFAULT NULL COMMENT 'CSS color value',
  `text_color` VARCHAR(50) DEFAULT NULL COMMENT 'CSS color value',
  `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT 'Display order (lower first)',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `views_count` INT(11) NOT NULL DEFAULT 0 COMMENT 'Number of times viewed',
  `clicks_count` INT(11) NOT NULL DEFAULT 0 COMMENT 'Number of times clicked',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (only if table is empty)
INSERT INTO `special_offers` (`title`, `description`, `icon`, `discount_percentage`, `discount_text`, `highlight_text`, `timer_enabled`, `timer_text`, `link_url`, `button_text`, `sort_order`, `is_active`) 
SELECT * FROM (SELECT 
  'Flash Sale' as title,
  'Up to 70% OFF on selected Victorian sets' as description,
  '🔥' as icon,
  70 as discount_percentage,
  'Up to 70% OFF' as discount_text,
  NULL as highlight_text,
  1 as timer_enabled,
  '⏰ Ends in 24 hours!' as timer_text,
  '/products?category=victorian&sale=true' as link_url,
  'Shop Now' as button_text,
  1 as sort_order,
  1 as is_active
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `special_offers` WHERE `title` = 'Flash Sale'
) LIMIT 1;

INSERT INTO `special_offers` (`title`, `description`, `icon`, `discount_percentage`, `discount_text`, `highlight_text`, `timer_enabled`, `timer_text`, `link_url`, `button_text`, `sort_order`, `is_active`) 
SELECT * FROM (SELECT 
  'Buy 2 Get 1 Free' as title,
  'Color changing jewelry collection' as description,
  '🎁' as icon,
  NULL as discount_percentage,
  'Buy 2 Get 1 Free' as discount_text,
  '✨ Mix & Match Any 3 Items' as highlight_text,
  0 as timer_enabled,
  NULL as timer_text,
  '/products?category=color-changing&offer=b2g1' as link_url,
  'Shop Now' as button_text,
  2 as sort_order,
  1 as is_active
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `special_offers` WHERE `title` = 'Buy 2 Get 1 Free'
) LIMIT 1;

INSERT INTO `special_offers` (`title`, `description`, `icon`, `discount_percentage`, `discount_text`, `highlight_text`, `timer_enabled`, `timer_text`, `link_url`, `button_text`, `sort_order`, `is_active`) 
SELECT * FROM (SELECT 
  'New Arrival' as title,
  'Exclusive bridal collection with 50% OFF' as description,
  '💎' as icon,
  50 as discount_percentage,
  '50% OFF' as discount_text,
  '👑 Premium Quality Guaranteed' as highlight_text,
  0 as timer_enabled,
  NULL as timer_text,
  '/products?category=bridal&new=true' as link_url,
  'Shop Now' as button_text,
  3 as sort_order,
  1 as is_active
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM `special_offers` WHERE `title` = 'New Arrival'
) LIMIT 1;
