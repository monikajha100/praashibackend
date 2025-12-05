-- Migration: Add offer type fields to special_offers table
-- This migration adds support for multiple offer types:
-- - Buy X Get Y (BOGO)
-- - Percentage discount
-- - Fixed amount discount
-- - Minimum purchase amount discount
-- - Referral link offers
-- - Product-specific offers

ALTER TABLE `special_offers`
ADD COLUMN IF NOT EXISTS `offer_type` ENUM('percentage', 'fixed_amount', 'buy_x_get_y', 'minimum_purchase', 'referral') NOT NULL DEFAULT 'percentage' COMMENT 'Type of offer',
ADD COLUMN IF NOT EXISTS `discount_amount` DECIMAL(10,2) DEFAULT NULL COMMENT 'Fixed discount amount (for fixed_amount type)',
ADD COLUMN IF NOT EXISTS `minimum_purchase_amount` DECIMAL(10,2) DEFAULT NULL COMMENT 'Minimum order amount required for offer',
ADD COLUMN IF NOT EXISTS `buy_quantity` INT(11) DEFAULT NULL COMMENT 'Buy quantity for BOGO offers (e.g., buy 2)',
ADD COLUMN IF NOT EXISTS `get_quantity` INT(11) DEFAULT NULL COMMENT 'Get quantity for BOGO offers (e.g., get 1)',
ADD COLUMN IF NOT EXISTS `product_ids` TEXT DEFAULT NULL COMMENT 'Comma-separated product IDs (NULL for all products)',
ADD COLUMN IF NOT EXISTS `category_ids` TEXT DEFAULT NULL COMMENT 'Comma-separated category IDs',
ADD COLUMN IF NOT EXISTS `referral_code` VARCHAR(50) DEFAULT NULL COMMENT 'Referral code for referral offers',
ADD COLUMN IF NOT EXISTS `max_discount_amount` DECIMAL(10,2) DEFAULT NULL COMMENT 'Maximum discount amount for percentage offers',
ADD COLUMN IF NOT EXISTS `priority` INT(11) NOT NULL DEFAULT 0 COMMENT 'Offer priority (higher = applied first if multiple eligible)',
ADD COLUMN IF NOT EXISTS `stackable` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Can this offer be combined with others';

-- Update existing offers to have type 'percentage' if they have discount_percentage
UPDATE `special_offers`
SET `offer_type` = 'percentage'
WHERE `discount_percentage` IS NOT NULL AND `discount_percentage` > 0
AND (`offer_type` IS NULL OR `offer_type` = '');

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS `idx_offer_type` ON `special_offers` (`offer_type`);
CREATE INDEX IF NOT EXISTS `idx_priority` ON `special_offers` (`priority`);
CREATE INDEX IF NOT EXISTS `idx_referral_code` ON `special_offers` (`referral_code`);












