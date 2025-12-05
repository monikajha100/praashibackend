-- Migration: Add offer_id column to orders table
-- Run this SQL in your MySQL database

ALTER TABLE `orders` 
ADD COLUMN `offer_id` INT(11) DEFAULT NULL COMMENT 'Special offer ID if this order used a special offer' AFTER `razorpay_order_id`,
ADD KEY `idx_offer_id` (`offer_id`),
ADD CONSTRAINT `orders_ibfk_offer` FOREIGN KEY (`offer_id`) REFERENCES `special_offers` (`id`) ON DELETE SET NULL;

