-- phpMyAdmin SQL Dump
-- ============================================================================
-- IMPORTANT INSTRUCTIONS FOR HEIDISQL/LIVE DATABASE:
-- ============================================================================
-- If you get "Data truncated for column 'offer_type' at row 1" error:
-- 1. Run the ALTER statements (lines 158-174) SEPARATELY first
-- 2. Verify with: SHOW COLUMNS FROM `special_offers` LIKE 'offer_type';
-- 3. The ENUM should show: flash_sale, buy_x_get_y, new_arrival, etc.
-- 4. Then run the INSERT statements
-- ============================================================================

-- version 5.2.1

-- https://www.phpmyadmin.net/

--

-- Host: 127.0.0.1

-- Generation Time: Nov 09, 2025 at 03:43 AM

-- Server version: 10.4.32-MariaDB

-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;

/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;

/*!40101 SET NAMES utf8mb4 */;

--

-- Database: `praashibysupal_db`

--

-- --------------------------------------------------------

--

-- Table structure for table `special_offers`

--

CREATE TABLE IF NOT EXISTS `special_offers` (

  `id` int(11) NOT NULL AUTO_INCREMENT,

  `title` varchar(255) NOT NULL,

  `description` text DEFAULT NULL,

  `offer_type` enum('flash_sale','buy_x_get_y','new_arrival','discount_percentage','discount_fixed','free_shipping') NOT NULL,

  `discount_amount` decimal(10,2) DEFAULT NULL COMMENT 'Fixed discount amount (for fixed_amount type)',

  `minimum_purchase_amount` decimal(10,2) DEFAULT NULL COMMENT 'Minimum order amount required for offer',

  `discount_value` decimal(10,2) DEFAULT 0.00,

  `discount_type` enum('percentage','fixed') DEFAULT 'percentage',

  `minimum_amount` decimal(10,2) DEFAULT 0.00,

  `maximum_discount` decimal(10,2) DEFAULT NULL,

  `buy_quantity` int(11) DEFAULT 1,

  `get_quantity` int(11) DEFAULT 1,

  `product_ids` text DEFAULT NULL COMMENT 'Comma-separated product IDs (NULL for all products)',

  `category_ids` text DEFAULT NULL COMMENT 'Comma-separated category IDs',

  `referral_code` varchar(50) DEFAULT NULL COMMENT 'Referral code for referral offers',

  `max_discount_amount` decimal(10,2) DEFAULT NULL COMMENT 'Maximum discount amount for percentage offers',

  `priority` int(11) NOT NULL DEFAULT 0 COMMENT 'Offer priority (higher = applied first if multiple eligible)',

  `stackable` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Can this offer be combined with others',

  `icon` varchar(50) DEFAULT '?',

  `icon_color` varchar(7) DEFAULT '#FF6B6B',

  `card_background_color` varchar(7) DEFAULT '#F5F5DC',

  `text_color` varchar(7) DEFAULT '#2C2C2C',

  `button_text` varchar(50) DEFAULT 'Shop Now',

  `button_color` varchar(7) DEFAULT '#FFB6C1',

  `button_text_color` varchar(7) DEFAULT '#2C2C2C',

  `expiry_text` varchar(100) DEFAULT NULL,

  `condition_text` varchar(100) DEFAULT NULL,

  `guarantee_text` varchar(100) DEFAULT NULL,

  `is_active` tinyint(1) DEFAULT 1,

  `sort_order` int(11) DEFAULT 0,

  `starts_at` datetime DEFAULT NULL,

  `expires_at` datetime DEFAULT NULL,

  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),

  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),

  `discount_percentage` int(11) DEFAULT NULL COMMENT 'Discount percentage (0-100)',

  `discount_text` varchar(100) DEFAULT NULL COMMENT 'e.g., "Up to 70% OFF"',

  `highlight_text` varchar(255) DEFAULT NULL COMMENT 'Additional highlight text',

  `badge_text` varchar(100) DEFAULT NULL COMMENT 'Badge or tag text',

  `timer_enabled` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Show countdown timer',

  `timer_text` varchar(100) DEFAULT NULL COMMENT 'e.g., "Ends in 24 hours!"',

  `start_date` datetime DEFAULT NULL COMMENT 'Offer start date/time',

  `end_date` datetime DEFAULT NULL COMMENT 'Offer end date/time',

  `link_url` varchar(500) NOT NULL DEFAULT '/products',

  `background_color` varchar(50) DEFAULT NULL COMMENT 'CSS color value',

  `views_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of times viewed',

  `clicks_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of times clicked',

  PRIMARY KEY (`id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=5;

-- ============================================================================
-- CRITICAL: Fix offer_type ENUM before inserting data
-- ============================================================================
-- The live database may have a different ENUM definition, causing "Data truncated" errors
-- This section MUST execute successfully before the INSERT statements below
-- ============================================================================

-- Delete existing rows with these IDs first to avoid primary key conflicts
DELETE FROM `special_offers` WHERE `id` IN (1, 2, 3);

-- IMPORTANT: In HeidiSQL, make sure to run each ALTER statement separately if needed
-- Step 1: Convert to VARCHAR temporarily (allows any value, bypasses ENUM restrictions)
-- If this fails, check: Does the table exist? Do you have ALTER permissions?
ALTER TABLE `special_offers` 
  MODIFY `offer_type` VARCHAR(50) NOT NULL DEFAULT 'flash_sale';

-- Step 2: Clean up any invalid values in existing data (if any rows exist)
UPDATE `special_offers` 
  SET `offer_type` = 'flash_sale' 
  WHERE `offer_type` = '' OR `offer_type` IS NULL OR TRIM(`offer_type`) = '';

UPDATE `special_offers` 
  SET `offer_type` = 'flash_sale' 
  WHERE `offer_type` NOT IN ('flash_sale','buy_x_get_y','new_arrival','discount_percentage','discount_fixed','free_shipping');

-- Step 3: Convert back to ENUM with ALL required values - MUST happen before INSERT
-- This ensures the ENUM accepts 'flash_sale', 'buy_x_get_y', 'new_arrival', etc.
-- VERIFY: After this runs, check: SHOW COLUMNS FROM `special_offers` LIKE 'offer_type';
ALTER TABLE `special_offers` 
  MODIFY `offer_type` enum('flash_sale','buy_x_get_y','new_arrival','discount_percentage','discount_fixed','free_shipping') NOT NULL DEFAULT 'flash_sale';

-- IMPORTANT: Commit the ALTER changes before INSERT (for HeidiSQL/live database)
-- This ensures the ENUM change is saved and visible to subsequent queries
COMMIT;

-- Start a new transaction for the INSERT
START TRANSACTION;

-- ============================================================================
-- VERIFICATION: Uncomment the line below to verify the ENUM was updated correctly
-- ============================================================================
-- SHOW COLUMNS FROM `special_offers` LIKE 'offer_type';

--

-- Dumping data for table `special_offers`

--

INSERT IGNORE INTO `special_offers` (`id`, `title`, `description`, `offer_type`, `discount_amount`, `minimum_purchase_amount`, `discount_value`, `discount_type`, `minimum_amount`, `maximum_discount`, `buy_quantity`, `get_quantity`, `product_ids`, `category_ids`, `referral_code`, `max_discount_amount`, `priority`, `stackable`, `icon`, `icon_color`, `card_background_color`, `text_color`, `button_text`, `button_color`, `button_text_color`, `expiry_text`, `condition_text`, `guarantee_text`, `is_active`, `sort_order`, `starts_at`, `expires_at`, `created_at`, `updated_at`, `discount_percentage`, `discount_text`, `highlight_text`, `badge_text`, `timer_enabled`, `timer_text`, `start_date`, `end_date`, `link_url`, `background_color`, `views_count`, `clicks_count`) VALUES

(1, 'Flash Sale', 'Up to 70% OFF on selected sets', 'flash_sale', NULL, NULL, 70.00, 'percentage', 0.00, NULL, 1, 1, NULL, NULL, NULL, NULL, 0, 0, '🔥', '#FF6B6B', '#F5F5DC', '#2C2C2C', 'Shop Now', '#FFB6C1', '#2C2C2C', 'Ends in 24 hours!', NULL, NULL, 1, 1, NULL, '2025-10-06 12:03:57', '2025-10-05 06:33:57', '2025-11-09 02:32:24', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '/products', NULL, 0, 0),

(2, 'Buy One Get Other in 50%', 'Buy One Get Other in 50%', 'buy_x_get_y', NULL, NULL, 0.00, 'percentage', 0.00, NULL, 2, 1, NULL, NULL, NULL, NULL, 0, 0, '🎁', '#FFD93D', '#F5F5DC', '#2C2C2C', 'Shop Now', '#FFB6C1', '#2C2C2C', NULL, 'Mix & Match Any 3 Items', NULL, 1, 2, NULL, '2025-10-12 12:03:57', '2025-10-05 06:33:57', '2025-11-09 02:33:56', 50, NULL, NULL, NULL, 0, NULL, '2025-11-01 00:00:00', '2025-12-31 00:00:00', '/products', NULL, 0, 0),

(3, 'New Arrival', 'Exclusive bridal collection with 50% OFF', 'new_arrival', NULL, NULL, 50.00, 'percentage', 0.00, NULL, 1, 1, NULL, NULL, NULL, NULL, 0, 0, '💎', '#4ECDC4', '#F5F5DC', '#2C2C2C', 'Shop Now', '#FFB6C1', '#2C2C2C', NULL, NULL, 'Premium Quality Guaranteed', 1, 3, NULL, '2025-10-19 12:03:57', '2025-10-05 06:33:57', '2025-10-05 06:33:57', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '/products', NULL, 0, 0),

(4, 'Earring Mania', 'Buy two Pair, Get one Pair Off (of equal or lesser value)', 'buy_x_get_y', NULL, NULL, 0.00, 'percentage', 0.00, NULL, 2, 1, NULL, NULL, NULL, NULL, 0, 0, '💍', '#FF6B9D', '#F5F5DC', '#2C2C2C', 'Shop Now', '#FFB6C1', '#2C2C2C', NULL, 'Buy 2 Get 1 Free', 'Lowest-priced pair free', 1, 4, NULL, '2025-12-31 23:59:59', NOW(), NOW(), 0, 'Buy 2 Get 1 Free', 'Earring Mania Special', 'BOGO', 0, NULL, NULL, '2025-12-31 23:59:59', '/products', NULL, 0, 0);

--

-- Indexes for dumped tables

--

--

-- Indexes for table `special_offers`

--

ALTER TABLE `special_offers`

  ADD KEY `idx_active` (`is_active`),

  ADD KEY `idx_expires_at` (`expires_at`),

  ADD KEY `idx_sort_order` (`sort_order`),

  ADD KEY `idx_offer_type` (`offer_type`),

  ADD KEY `idx_priority` (`priority`),

  ADD KEY `idx_referral_code` (`referral_code`),

  ADD KEY `idx_dates` (`start_date`,`end_date`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;

/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
