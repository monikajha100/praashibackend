-- Migration: Add item-level discount columns to order_items table
-- This allows storing which items received discounts (e.g., from BOGO offers)
-- Run this SQL in your MySQL database
-- Note: Remove IF NOT EXISTS if your MySQL version doesn't support it

ALTER TABLE `order_items`
ADD COLUMN `discounted_quantity` INT(11) DEFAULT NULL COMMENT 'Number of units that received discount',
ADD COLUMN `discount_per_unit` DECIMAL(10,2) DEFAULT NULL COMMENT 'Discount amount per unit',
ADD COLUMN `discount_percentage` DECIMAL(5,2) DEFAULT NULL COMMENT 'Discount percentage applied (e.g., 50 for 50% off)';

