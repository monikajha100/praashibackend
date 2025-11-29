-- Praashi by Supal - Complete Database (Final Topological Order)
-- Generated: 2025-10-12T04:37:11.010Z
-- Database: praashibysupal
-- Total Tables: 45
-- Ready for HeidiSQL Import (with correct topological order)
-- Based on deep foreign key analysis - handles all 58 FK relationships

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Database: `praashibysupal`

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `stock_movements`;
DROP TABLE IF EXISTS `stock_levels`;
DROP TABLE IF EXISTS `stock_adjustments`;
DROP TABLE IF EXISTS `product_videos`;
DROP TABLE IF EXISTS `product_reviews`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `product_colors`;
DROP TABLE IF EXISTS `partner_storefronts`;
DROP TABLE IF EXISTS `partner_orders`;
DROP TABLE IF EXISTS `partner_inventory_sharing`;
DROP TABLE IF EXISTS `partner_analytics`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `low_stock_alerts`;
DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `subcategories`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `contract_signatures`;
DROP TABLE IF EXISTS `contract_renewals`;
DROP TABLE IF EXISTS `contract_reminders`;
DROP TABLE IF EXISTS `contract_analytics`;
DROP TABLE IF EXISTS `coupon_usage`;
DROP TABLE IF EXISTS `contracts`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `contract_templates`;
DROP TABLE IF EXISTS `support_tickets`;
DROP TABLE IF EXISTS `contact_responses`;
DROP TABLE IF EXISTS `chat_sessions`;
DROP TABLE IF EXISTS `warehouses`;
DROP TABLE IF EXISTS `partner_widgets`;
DROP TABLE IF EXISTS `partner_themes`;
DROP TABLE IF EXISTS `special_offers`;
DROP TABLE IF EXISTS `site_settings`;
DROP TABLE IF EXISTS `promotional_offers`;
DROP TABLE IF EXISTS `promotional_banners`;
DROP TABLE IF EXISTS `coupon_campaigns`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `partners`;
DROP TABLE IF EXISTS `company_settings`;
DROP TABLE IF EXISTS `contacts`;
DROP TABLE IF EXISTS `category_icons`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `banners`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `subtitle` varchar(300) DEFAULT NULL,
  `image` text DEFAULT NULL,
  `link_url` varchar(300) DEFAULT NULL,
  `button_text` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `title`, `subtitle`, `image`, `link_url`, `button_text`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(4, 'Exclusive Collection', '', 'https://api.praashibysupal.com/uploads/banners/b1-1759477017588-533462894.jpg', '/products', 'Shop Now', 1, 1, '2025-10-03 07:29:39', '2025-10-11 17:18:53'),
(9, 'New Collection', '', 'https://api.praashibysupal.com/uploads/banners/banner11-1759667364273-529448503.jpg', '', 'Shop Now', 1, 0, '2025-10-05 12:29:24', '2025-10-11 17:18:53'),
(10, 'Collection', '', 'https://api.praashibysupal.com/uploads/banners/img07-1760119119787-761735851.jpg', '', 'Shop Now', 1, 0, '2025-10-10 17:58:27', '2025-10-11 17:18:53');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Rings', 'rings', 'Beautiful rings for every occasion', NULL, 1, 0, '2025-10-03 05:51:29', '2025-10-04 11:04:57'),
(2, 'Necklaces', 'necklaces', 'Elegant necklaces and chains', NULL, 1, 2, '2025-10-03 05:51:29', '2025-10-03 05:51:29'),
(3, 'Earrings', 'earrings', 'Stylish earrings collection', NULL, 1, 3, '2025-10-03 05:51:29', '2025-10-03 05:51:29'),
(4, 'Bracelets', 'bracelets', 'Charming bracelets and bangles', NULL, 1, 4, '2025-10-03 05:51:29', '2025-10-03 05:51:29'),
(5, 'Watches', 'watches', 'Fashionable watches', NULL, 1, 5, '2025-10-03 05:51:29', '2025-10-03 05:51:29'),
(6, 'Fragrance', 'fragrance', 'Luxury fragrances', NULL, 1, 6, '2025-10-03 05:51:29', '2025-10-03 05:51:29'),
(22, 'samplee', 'samplee', '', NULL, 1, 0, '2025-10-04 13:40:10', '2025-10-04 13:40:24'),
(23, 'test', 'test', '', NULL, 1, 0, '2025-10-06 18:00:48', '2025-10-06 18:00:48'),
(24, 'viraj', 'viraj', '', NULL, 1, 0, '2025-10-06 18:01:18', '2025-10-06 18:01:18');

-- --------------------------------------------------------

--
-- Table structure for table `category_icons`
--

CREATE TABLE `category_icons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_slug` varchar(100) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `icon_type` enum('emoji','image','icon_class') DEFAULT 'emoji',
  `icon_value` varchar(255) NOT NULL,
  `icon_color` varchar(7) DEFAULT '#D4AF37',
  `background_color` varchar(7) DEFAULT '#F5F5DC',
  `text_color` varchar(7) DEFAULT '#2C2C2C',
  `link_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_slug` (`category_slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category_icons`
--

INSERT INTO `category_icons` (`id`, `category_slug`, `category_name`, `subtitle`, `icon_type`, `icon_value`, `icon_color`, `background_color`, `text_color`, `link_url`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'rings', 'Rings', 'Designer Rings', 'emoji', '💍', '#4A90E2', '#F5F5DC', '#2C2C2C', '/products?category=rings', 1, 1, '2025-10-05 09:56:22', '2025-10-05 09:56:22'),
(2, 'necklaces', 'Necklaces', 'Statement Necklaces', 'emoji', '📿', '#FF6B6B', '#F5F5DC', '#2C2C2C', '/products?category=necklaces', 1, 2, '2025-10-05 09:56:22', '2025-10-05 09:56:22'),
(3, 'earrings', 'Earrings', 'Exclusive Earrings', 'emoji', '💎', '#4ECDC4', '#F5F5DC', '#2C2C2C', '/products?category=earrings', 1, 3, '2025-10-05 09:56:22', '2025-10-05 09:56:22'),
(4, 'bracelets', 'Bracelets', 'Complete Range', 'emoji', '🌈', '#FFE66D', '#F5F5DC', '#2C2C2C', '/products?category=bracelets', 1, 4, '2025-10-05 09:56:22', '2025-10-05 09:56:22');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `message` text NOT NULL,
  `type` enum('inquiry','support','complaint','feedback','partnership','other') DEFAULT 'inquiry',
  `status` enum('new','in_progress','resolved','closed') DEFAULT 'new',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `source` varchar(100) DEFAULT 'contact_form',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `response` text DEFAULT NULL,
  `response_date` datetime DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_fields`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_assigned_to` (`assigned_to`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contacts`
--

INSERT INTO `contacts` (`id`, `name`, `email`, `phone`, `subject`, `message`, `type`, `status`, `priority`, `source`, `ip_address`, `user_agent`, `assigned_to`, `response`, `response_date`, `tags`, `custom_fields`, `created_at`, `updated_at`) VALUES
(1, 'John Smith', 'john.smith@example.com', '+91-9876543210', 'Product Inquiry', 'I am interested in your jewelry collection. Can you provide more details about the materials used?', 'inquiry', 'new', 'medium', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:22', '2025-10-05 05:43:22'),
(2, 'Sarah Johnson', 'sarah.j@example.com', '+91-9876543211', 'Order Issue', 'My order #ORD-2025-123456 has not been delivered yet. It was supposed to arrive 3 days ago.', 'support', 'in_progress', 'high', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:22', '2025-10-05 05:43:22'),
(3, 'Mike Wilson', 'mike.wilson@example.com', '+91-9876543212', 'Partnership Opportunity', 'I represent a retail chain and would like to discuss partnership opportunities for your jewelry line.', 'partnership', 'new', 'medium', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:22', '2025-10-05 05:43:22'),
(4, 'Emily Davis', 'emily.davis@example.com', '+91-9876543213', 'Product Feedback', 'I love the earrings I purchased! The quality is excellent and the design is beautiful.', 'feedback', 'resolved', 'low', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:22', '2025-10-05 05:43:22'),
(5, 'David Brown', 'david.brown@example.com', '+91-9876543214', 'Website Issue', 'I am having trouble adding items to my cart. The website seems to be loading slowly.', 'support', 'new', 'high', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:22', '2025-10-05 05:43:22'),
(6, 'John Smith', 'john.smith@example.com', '+91-9876543210', 'Product Inquiry', 'I am interested in your jewelry collection. Can you provide more details about the materials used?', 'inquiry', 'new', 'medium', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:41', '2025-10-05 05:43:41'),
(7, 'Sarah Johnson', 'sarah.j@example.com', '+91-9876543211', 'Order Issue', 'My order #ORD-2025-123456 has not been delivered yet. It was supposed to arrive 3 days ago.', 'support', 'in_progress', 'high', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:41', '2025-10-05 05:43:41'),
(8, 'Mike Wilson', 'mike.wilson@example.com', '+91-9876543212', 'Partnership Opportunity', 'I represent a retail chain and would like to discuss partnership opportunities for your jewelry line.', 'partnership', 'new', 'medium', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:41', '2025-10-05 05:43:41'),
(9, 'Emily Davis', 'emily.davis@example.com', '+91-9876543213', 'Product Feedback', 'I love the earrings I purchased! The quality is excellent and the design is beautiful.', 'feedback', 'resolved', 'low', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:41', '2025-10-05 05:43:41'),
(10, 'David Brown', 'david.brown@example.com', '+91-9876543214', 'Website Issue', 'I am having trouble adding items to my cart. The website seems to be loading slowly.', 'support', 'new', 'high', 'contact_form', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:41', '2025-10-05 05:43:41');

-- --------------------------------------------------------

--
-- Table structure for table `company_settings`
--

CREATE TABLE `company_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('text','number','boolean','json') DEFAULT 'text',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_settings`
--

INSERT INTO `company_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `created_at`, `updated_at`) VALUES
(1, 'company_name', 'Praashibysupal', 'text', 'Company name for invoices', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(2, 'company_address', '123 Business Street, Mumbai, Maharashtra 400001', 'text', 'Company address for invoices', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(3, 'company_phone', '+91 9876543210', 'text', 'Company phone number', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(4, 'company_email', 'info@praashibysupal.com', 'text', 'Company email address', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(5, 'company_gstin', '27AABCU9603R1ZX', 'text', 'Company GSTIN number', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(6, 'company_state', '27-Maharashtra', 'text', 'Company state code and name', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(7, 'company_logo', '/logo.png', 'text', 'Company logo path', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(8, 'invoice_prefix', 'INV', 'text', 'Invoice number prefix', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(9, 'default_tax_rate', '18.00', 'number', 'Default GST rate percentage', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(10, 'invoice_terms', 'Payment due within 30 days of invoice date. Late payments may incur additional charges.', 'text', 'Default terms and conditions', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(11, 'bank_details', '{"bank_name":"HDFC Bank","account_number":"123456789012","ifsc_code":"HDFC0001234","branch":"Mumbai Main Branch"}', 'json', 'Bank details for payment', '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(23, 'razorpay_key_id', 'rzp_live_RN4ytmrL1bQrKR', 'text', 'Razorpay Key ID for payments', '2025-10-04 03:43:37', '2025-10-07 05:05:24'),
(24, 'razorpay_key_secret', 'U3zH2I0hu2vMDPbEyOne29Vt', 'text', 'Razorpay Key Secret for payments', '2025-10-04 03:43:37', '2025-10-07 05:05:24'),
(25, 'cod_enabled', 'false', 'boolean', 'Enable Cash on Delivery payment method', '2025-10-04 03:43:37', '2025-10-07 05:05:24'),
(26, 'razorpay_enabled', 'true', 'boolean', 'Enable Razorpay payment method', '2025-10-04 03:43:37', '2025-10-07 05:05:24'),
(27, 'auto_generate_invoice', 'true', 'boolean', 'Automatically generate invoice after successful payment', '2025-10-04 03:43:37', '2025-10-04 09:06:34'),
(28, 'send_invoice_email', 'true', 'boolean', 'Automatically send invoice email after payment', '2025-10-04 03:43:37', '2025-10-04 03:43:37'),
(73, 'jwt_secret', 'praashibysupal_jwt_secret_2025_1760154378917', '', NULL, '2025-10-11 03:46:18', '2025-10-11 03:46:18');

-- --------------------------------------------------------

--
-- Table structure for table `partners`
--

CREATE TABLE `partners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `business` varchar(255) NOT NULL,
  `partnership_type` enum('franchise','agency','reseller') NOT NULL,
  `experience` text DEFAULT NULL,
  `documents` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `partners`
--

INSERT INTO `partners` (`id`, `name`, `email`, `phone`, `business`, `partnership_type`, `experience`, `documents`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Gold Jewelry Franchise Mumbai', 'mumbai@goldjewelry.com', '+91-9876543210', 'Gold Jewelry Franchise Mumbai', 'franchise', 'Over 10 years in jewelry retail business with multiple store locations in Mumbai.', NULL, 'approved', '2025-10-04 16:57:21', '2025-10-04 16:57:21'),
(2, 'Precious Stones Agency Delhi', 'delhi@preciousstones.com', '+91-9876543211', 'Precious Stones Agency Delhi', 'agency', 'Specialized in precious stones and gemstones distribution across North India.', NULL, 'approved', '2025-10-04 16:57:21', '2025-10-04 16:57:21'),
(3, 'Elegant Jewelry Reseller Bangalore', 'bangalore@elegantjewelry.com', '+91-9876543212', 'Elegant Jewelry Reseller Bangalore', 'reseller', 'Online jewelry retail with strong e-commerce presence and customer base.', NULL, 'pending', '2025-10-04 16:57:21', '2025-10-04 16:57:21'),
(4, 'Royal Gems Franchise Chennai', 'chennai@royalgems.com', '+91-9876543213', 'Royal Gems Franchise Chennai', 'franchise', 'Traditional jewelry business with focus on South Indian gold jewelry designs.', NULL, 'approved', '2025-10-04 16:57:21', '2025-10-04 16:57:21'),
(5, 'Sparkle Agency Pune', 'pune@sparkle.com', '+91-9876543214', 'Sparkle Agency Pune', 'agency', 'Modern jewelry designs and contemporary pieces for young customers.', NULL, 'pending', '2025-10-04 16:57:21', '2025-10-04 16:57:21'),
(6, 'Heritage Jewelry Reseller Kolkata', 'kolkata@heritagejewelry.com', '+91-9876543215', 'Heritage Jewelry Reseller Kolkata', 'reseller', 'Traditional Bengali jewelry and cultural pieces with online presence.', NULL, 'rejected', '2025-10-04 16:57:21', '2025-10-04 16:57:21'),
(7, 'Diamond Dreams Franchise Hyderabad', 'hyderabad@diamonddreams.com', '+91-9876543216', 'Diamond Dreams Franchise Hyderabad', 'franchise', 'Premium diamond jewelry and luxury pieces for high-end customers.', NULL, 'approved', '2025-10-04 16:57:21', '2025-10-04 16:57:21'),
(8, 'Modern Gems Agency Ahmedabad', 'ahmedabad@moderngems.com', '+91-9876543217', 'Modern Gems Agency Ahmedabad', 'agency', 'Wholesale gemstone distribution and jewelry manufacturing support.', NULL, 'pending', '2025-10-04 16:57:21', '2025-10-04 16:57:21'),
(9, 'Test Partner', 'test@partner.com', '+91-9876543218', 'Test Business', 'franchise', 'Test experience', NULL, 'approved', '2025-10-04 17:13:04', '2025-10-04 17:13:04'),
(10, 'dgdg', 'dgdg@gmail.com', '5656556655', 'fghghdg', 'franchise', 'fbgbgfbf', NULL, 'approved', '2025-10-04 18:08:56', '2025-10-04 18:08:56'),
(11, 'dfhdxffh', 'fgg@gmail.com', '8989969669', 'fgws', 'franchise', '', NULL, 'approved', '2025-10-04 18:10:01', '2025-10-04 18:10:01'),
(12, 'Frontend Test Partner', 'frontend@test.com', '+91-9876543219', 'Frontend Test Business', 'agency', 'Testing from frontend', NULL, 'approved', '2025-10-04 18:12:24', '2025-10-04 18:12:24');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `address`, `city`, `state`, `pincode`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@praashibysupal.com', '$2a$12$PYKhe9735AYS6ASA7nBTreT1KzrXFI7qsYG542Qrb0QzQYRxLQQ4q', NULL, NULL, NULL, NULL, NULL, 'admin', 1, '2025-10-03 05:51:29', '2025-10-10 17:41:30'),
(3, 'Test User', 'test@example.com', 'tempo6d940w5', NULL, NULL, NULL, NULL, NULL, 'user', 1, '2025-10-03 18:57:28', '2025-10-03 18:57:28'),
(4, 'Test Customer', 'testcustomer@example.com', 'tempska9p0vk', '9876543210', '123 Test Street', 'Test City', 'Test State', '123456', 'user', 1, '2025-10-03 18:57:49', '2025-10-04 01:20:48');

-- --------------------------------------------------------

--
-- Table structure for table `coupon_campaigns`
--

CREATE TABLE `coupon_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `target_audience` enum('all','new_customers','existing_customers','vip_customers','specific_users') DEFAULT 'all',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `total_budget` decimal(10,2) DEFAULT NULL,
  `used_budget` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_dates` (`start_date`,`end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coupon_campaigns`
--

INSERT INTO `coupon_campaigns` (`id`, `name`, `description`, `target_audience`, `start_date`, `end_date`, `is_active`, `total_budget`, `used_budget`, `created_at`, `updated_at`) VALUES
(1, 'Holiday Sale 2024', 'Special holiday discount campaign', 'all', '2024-12-01 00:00:00', '2024-12-31 23:59:59', 1, '50000.00', '0.00', '2025-10-04 18:30:40', '2025-10-04 18:30:40');

-- --------------------------------------------------------

--
-- Table structure for table `promotional_banners`
--

CREATE TABLE `promotional_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `text` varchar(500) NOT NULL,
  `background_color` varchar(7) DEFAULT '#000000',
  `text_color` varchar(7) DEFAULT '#FFFFFF',
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `display_duration` int(11) DEFAULT 5000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `promotional_banners`
--

INSERT INTO `promotional_banners` (`id`, `text`, `background_color`, `text_color`, `is_active`, `sort_order`, `display_duration`, `created_at`, `updated_at`) VALUES
(1, 'Free Shipping On Orders ₹ 999 & Above', '#000000', '#FFFFFF', 1, 1, 5000, '2025-10-05 04:39:20', '2025-10-05 04:39:20'),
(2, 'New Collection Available Now!', '#D4AF37', '#000000', 1, 2, 4000, '2025-10-05 04:39:20', '2025-10-05 04:39:20'),
(3, 'Limited Time Offer - 20% Off', '#E74C3C', '#FFFFFF', 1, 3, 6000, '2025-10-05 04:39:20', '2025-10-05 04:39:20'),
(4, 'Premium Quality Jewelry', '#2C2C2C', '#D4AF37', 1, 4, 4500, '2025-10-05 04:39:20', '2025-10-05 04:39:20'),
(5, 'Free Shipping On Orders ₹ 999 & Above', '#000000', '#FFFFFF', 1, 1, 5000, '2025-10-05 05:30:58', '2025-10-05 05:30:58'),
(6, 'New Collection Available Now!', '#D4AF37', '#000000', 1, 2, 4000, '2025-10-05 05:30:58', '2025-10-05 05:30:58'),
(7, 'Limited Time Offer - 20% Off', '#E74C3C', '#FFFFFF', 1, 3, 6000, '2025-10-05 05:30:58', '2025-10-05 05:30:58'),
(8, 'Premium Quality Jewelry', '#2C2C2C', '#D4AF37', 1, 4, 4500, '2025-10-05 05:30:58', '2025-10-05 05:30:58');

-- --------------------------------------------------------

--
-- Table structure for table `promotional_offers`
--

CREATE TABLE `promotional_offers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `offer_type` enum('flash_sale','buy_x_get_y','new_arrival','discount_percentage','discount_fixed','free_shipping') NOT NULL,
  `discount_value` decimal(10,2) DEFAULT 0.00,
  `discount_type` enum('percentage','fixed') DEFAULT 'percentage',
  `minimum_amount` decimal(10,2) DEFAULT 0.00,
  `maximum_discount` decimal(10,2) DEFAULT NULL,
  `buy_quantity` int(11) DEFAULT 1,
  `get_quantity` int(11) DEFAULT 1,
  `icon` varchar(50) DEFAULT '?',
  `background_color` varchar(7) DEFAULT '#FF6B6B',
  `text_color` varchar(7) DEFAULT '#FFFFFF',
  `button_color` varchar(7) DEFAULT '#FFB6C1',
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `starts_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `promotional_offers`
--

INSERT INTO `promotional_offers` (`id`, `title`, `description`, `offer_type`, `discount_value`, `discount_type`, `minimum_amount`, `maximum_discount`, `buy_quantity`, `get_quantity`, `icon`, `background_color`, `text_color`, `button_color`, `is_active`, `sort_order`, `starts_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'Flash Sale', 'Up to 70% OFF on selected Victorian sets', 'flash_sale', '70.00', 'percentage', '0.00', NULL, 1, 1, '🔥', '#FF6B6B', '#FFFFFF', '#FFB6C1', 1, 1, NULL, '2025-10-06 11:48:44', '2025-10-05 06:18:44', '2025-10-05 06:18:44'),
(2, 'Buy 2 Get 1 Free', 'Color changing jewelry collection', 'buy_x_get_y', '0.00', 'percentage', '0.00', NULL, 2, 1, '🎁', '#FFD93D', '#000000', '#FFB6C1', 1, 2, NULL, '2025-10-12 11:48:44', '2025-10-05 06:18:44', '2025-10-05 06:18:44'),
(3, 'New Arrival', 'Exclusive bridal collection with 50% OFF', 'new_arrival', '50.00', 'percentage', '0.00', NULL, 1, 1, '💎', '#4ECDC4', '#FFFFFF', '#FFB6C1', 1, 3, NULL, '2025-10-19 11:48:44', '2025-10-05 06:18:44', '2025-10-05 06:18:44');

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES
(1, 'site_name', 'Praashi By Supal', '2025-10-03 15:14:40', '2025-10-03 15:14:40'),
(2, 'site_description', 'Premium Jewelry Collection', '2025-10-03 15:14:40', '2025-10-03 15:14:40'),
(3, 'contact_email', 'admin@praashibysupal.com', '2025-10-03 15:14:40', '2025-10-03 15:14:40'),
(4, 'contact_phone', '+91-9876543210', '2025-10-03 15:14:40', '2025-10-03 15:14:40');

-- --------------------------------------------------------

--
-- Table structure for table `special_offers`
--

CREATE TABLE `special_offers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `offer_type` enum('flash_sale','buy_x_get_y','new_arrival','discount_percentage','discount_fixed','free_shipping') NOT NULL,
  `discount_value` decimal(10,2) DEFAULT 0.00,
  `discount_type` enum('percentage','fixed') DEFAULT 'percentage',
  `minimum_amount` decimal(10,2) DEFAULT 0.00,
  `maximum_discount` decimal(10,2) DEFAULT NULL,
  `buy_quantity` int(11) DEFAULT 1,
  `get_quantity` int(11) DEFAULT 1,
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
  PRIMARY KEY (`id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `special_offers`
--

INSERT INTO `special_offers` (`id`, `title`, `description`, `offer_type`, `discount_value`, `discount_type`, `minimum_amount`, `maximum_discount`, `buy_quantity`, `get_quantity`, `icon`, `icon_color`, `card_background_color`, `text_color`, `button_text`, `button_color`, `button_text_color`, `expiry_text`, `condition_text`, `guarantee_text`, `is_active`, `sort_order`, `starts_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'Flash Sale', 'Up to 70% OFF on selected Victorian sets', 'flash_sale', '70.00', 'percentage', '0.00', NULL, 1, 1, '🔥', '#FF6B6B', '#F5F5DC', '#2C2C2C', 'Shop Now', '#FFB6C1', '#2C2C2C', 'Ends in 24 hours!', NULL, NULL, 1, 1, NULL, '2025-10-06 12:03:57', '2025-10-05 06:33:57', '2025-10-05 06:33:57'),
(2, 'Buy 2 Get 1 Free', 'Color changing jewelry collection', 'buy_x_get_y', '0.00', 'percentage', '0.00', NULL, 2, 1, '🎁', '#FFD93D', '#F5F5DC', '#2C2C2C', 'Shop Now', '#FFB6C1', '#2C2C2C', NULL, 'Mix & Match Any 3 Items', NULL, 1, 2, NULL, '2025-10-12 12:03:57', '2025-10-05 06:33:57', '2025-10-05 06:33:57'),
(3, 'New Arrival', 'Exclusive bridal collection with 50% OFF', 'new_arrival', '50.00', 'percentage', '0.00', NULL, 1, 1, '💎', '#4ECDC4', '#F5F5DC', '#2C2C2C', 'Shop Now', '#FFB6C1', '#2C2C2C', NULL, NULL, 'Premium Quality Guaranteed', 1, 3, NULL, '2025-10-19 12:03:57', '2025-10-05 06:33:57', '2025-10-05 06:33:57');

-- --------------------------------------------------------

--
-- Table structure for table `partner_themes`
--

CREATE TABLE `partner_themes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `theme_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`theme_config`)),
  `preview_image` varchar(500) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `partner_themes`
--

INSERT INTO `partner_themes` (`id`, `name`, `description`, `theme_config`, `preview_image`, `is_default`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Modern Blue', 'Clean and modern theme with blue color scheme', '{"colors": {"primary": "#3B82F6", "secondary": "#1E40AF", "accent": "#60A5FA", "background": "#FFFFFF", "text": "#1F2937", "textLight": "#6B7280"}, "fonts": {"heading": "Inter", "body": "Inter"}, "layout": {"headerStyle": "modern", "footerStyle": "minimal", "productGrid": "4-columns"}}', NULL, 1, 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26'),
(2, 'Elegant Purple', 'Elegant theme with purple and gold accents', '{"colors": {"primary": "#8B5CF6", "secondary": "#7C3AED", "accent": "#A78BFA", "background": "#FAFAFA", "text": "#1F2937", "textLight": "#6B7280"}, "fonts": {"heading": "Playfair Display", "body": "Source Sans Pro"}, "layout": {"headerStyle": "elegant", "footerStyle": "detailed", "productGrid": "3-columns"}}', NULL, 0, 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26'),
(3, 'Minimal Green', 'Minimalist theme with green color palette', '{"colors": {"primary": "#10B981", "secondary": "#059669", "accent": "#34D399", "background": "#FFFFFF", "text": "#111827", "textLight": "#6B7280"}, "fonts": {"heading": "Poppins", "body": "Open Sans"}, "layout": {"headerStyle": "minimal", "footerStyle": "simple", "productGrid": "2-columns"}}', NULL, 0, 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26');

-- --------------------------------------------------------

--
-- Table structure for table `partner_widgets`
--

CREATE TABLE `partner_widgets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('hero_banner','featured_products','testimonials','newsletter','social_links','custom_html','product_carousel','category_grid') NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `partner_widgets`
--

INSERT INTO `partner_widgets` (`id`, `name`, `type`, `config`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Hero Banner', 'hero_banner', '{"title": "Welcome to Our Store", "subtitle": "Discover amazing products", "buttonText": "Shop Now", "buttonLink": "/products", "backgroundImage": "", "overlay": true}', 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26'),
(2, 'Featured Products', 'featured_products', '{"title": "Featured Products", "limit": 8, "showPrice": true, "showDescription": true, "layout": "grid"}', 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26'),
(3, 'Product Carousel', 'product_carousel', '{"title": "Best Sellers", "limit": 6, "autoplay": true, "showDots": true, "showArrows": true}', 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26'),
(4, 'Newsletter Signup', 'newsletter', '{"title": "Stay Updated", "subtitle": "Subscribe to our newsletter", "placeholder": "Enter your email", "buttonText": "Subscribe"}', 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26'),
(5, 'Social Links', 'social_links', '{"title": "Follow Us", "links": [{"platform": "facebook", "url": ""}, {"platform": "instagram", "url": ""}, {"platform": "twitter", "url": ""}]}', 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26'),
(6, 'Category Grid', 'category_grid', '{"title": "Shop by Category", "showCount": true, "layout": "grid", "columns": 4}', 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26');

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `manager_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`id`, `name`, `code`, `address`, `city`, `state`, `pincode`, `phone`, `email`, `manager_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Main Warehouse', 'MAIN', '123 Business Street', 'Mumbai', 'Maharashtra', '400001', NULL, NULL, NULL, 1, '2025-10-04 01:22:55', '2025-10-04 01:22:55'),
(2, 'Test Warehouse', 'TEST001', '123 Test Street', 'Test City', 'Test State', '123456', '9876543210', 'test@warehouse.com', 'Test Manager', 1, '2025-10-04 01:28:44', '2025-10-04 01:28:44');

-- --------------------------------------------------------

--
-- Table structure for table `chat_sessions`
--

CREATE TABLE `chat_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `contact_id` int(11) DEFAULT NULL,
  `visitor_name` varchar(255) DEFAULT NULL,
  `visitor_email` varchar(255) DEFAULT NULL,
  `visitor_phone` varchar(20) DEFAULT NULL,
  `status` enum('active','waiting','in_progress','ended') DEFAULT 'active',
  `assigned_to` int(11) DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ended_at` datetime DEFAULT NULL,
  `messages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`messages`)),
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  KEY `contact_id` (`contact_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_status` (`status`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_started_at` (`started_at`),
  CONSTRAINT `chat_sessions_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `chat_sessions`
--

-- --------------------------------------------------------

--
-- Table structure for table `contact_responses`
--

CREATE TABLE `contact_responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contact_id` int(11) NOT NULL,
  `response_type` enum('email','phone','chat','ticket') DEFAULT 'email',
  `response_text` text NOT NULL,
  `responded_by` int(11) DEFAULT NULL,
  `response_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_internal` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_contact_id` (`contact_id`),
  KEY `idx_response_date` (`response_date`),
  CONSTRAINT `contact_responses_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `contact_responses`
--

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(50) NOT NULL,
  `contact_id` int(11) DEFAULT NULL,
  `title` varchar(500) NOT NULL,
  `description` text NOT NULL,
  `category` enum('technical','billing','general','feature_request','bug_report') DEFAULT 'general',
  `status` enum('open','in_progress','pending_customer','resolved','closed') DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `assigned_to` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `resolution` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `contact_id` (`contact_id`),
  KEY `idx_ticket_number` (`ticket_number`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `support_tickets`
--

INSERT INTO `support_tickets` (`id`, `ticket_number`, `contact_id`, `title`, `description`, `category`, `status`, `priority`, `assigned_to`, `customer_id`, `order_id`, `attachments`, `resolution`, `resolved_at`, `created_at`, `updated_at`) VALUES
(1, 'TKT-2025-001', 2, 'Order Delivery Issue', 'Customer order #ORD-2025-123456 has not been delivered as expected.', 'general', 'in_progress', 'high', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:22', '2025-10-05 05:43:22'),
(2, 'TKT-2025-002', 5, 'Website Performance Issue', 'Customer experiencing slow loading times and cart issues.', 'technical', 'open', 'high', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 05:43:22', '2025-10-05 05:43:22');

-- --------------------------------------------------------

--
-- Table structure for table `contract_templates`
--

CREATE TABLE `contract_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `template_type` enum('franchise','agency','reseller','custom') NOT NULL,
  `content` longtext NOT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variables`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `contract_templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contract_templates`
--

INSERT INTO `contract_templates` (`id`, `name`, `description`, `template_type`, `content`, `variables`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Franchise Agreement Template', 'Standard franchise agreement template', 'franchise', 'FRANCHISE AGREEMENT

This Franchise Agreement ("Agreement") is entered into on [DATE] between [COMPANY_NAME] ("Franchisor") and [PARTNER_NAME] ("Franchisee").

1. FRANCHISE GRANT
Franchisor grants Franchisee the right to operate a franchise business under the [BRAND_NAME] system.

2. TERM
This Agreement shall commence on [START_DATE] and continue for a period of [TERM_YEARS] years.

3. FRANCHISE FEE
Franchisee shall pay a franchise fee of [FRANCHISE_FEE] upon execution of this Agreement.

4. ROYALTIES
Franchisee shall pay ongoing royalties of [ROYALTY_PERCENTAGE]% of gross sales.

5. TERRITORY
Franchisee''s exclusive territory shall be [TERRITORY_DESCRIPTION].

6. OBLIGATIONS
Both parties agree to fulfill their respective obligations as outlined in this Agreement.

7. TERMINATION
Either party may terminate this Agreement with [NOTICE_PERIOD] days written notice.

IN WITNESS WHEREOF, the parties have executed this Agreement on the date first written above.

Franchisor: _________________ Date: _________
Franchisee: _________________ Date: _________', '{"DATE": "Contract Date", "COMPANY_NAME": "Company Name", "PARTNER_NAME": "Partner Name", "BRAND_NAME": "Brand Name", "START_DATE": "Start Date", "TERM_YEARS": "Term in Years", "FRANCHISE_FEE": "Franchise Fee", "ROYALTY_PERCENTAGE": "Royalty Percentage", "TERRITORY_DESCRIPTION": "Territory Description", "NOTICE_PERIOD": "Notice Period"}', 1, NULL, '2025-10-05 04:44:10', '2025-10-05 04:44:10'),
(2, 'Agency Agreement Template', 'Standard agency agreement template', 'agency', 'AGENCY AGREEMENT

This Agency Agreement ("Agreement") is entered into on [DATE] between [COMPANY_NAME] ("Principal") and [PARTNER_NAME] ("Agent").

1. APPOINTMENT
Principal appoints Agent as its authorized representative for the sale of [PRODUCTS/SERVICES] in [TERRITORY].

2. TERM
This Agreement shall commence on [START_DATE] and continue for [TERM_YEARS] years, renewable by mutual agreement.

3. COMMISSION
Agent shall receive a commission of [COMMISSION_PERCENTAGE]% on all sales made within the assigned territory.

4. OBLIGATIONS
Agent agrees to:
- Promote and sell Principal''s products/services
- Maintain accurate sales records
- Provide regular reports to Principal

5. TERRITORY
Agent''s territory shall be [TERRITORY_DESCRIPTION].

6. TERMINATION
Either party may terminate this Agreement with [NOTICE_PERIOD] days written notice.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Principal: _________________ Date: _________
Agent: _________________ Date: _________', '{"DATE": "Contract Date", "COMPANY_NAME": "Company Name", "PARTNER_NAME": "Partner Name", "PRODUCTS/SERVICES": "Products/Services", "TERRITORY": "Territory", "START_DATE": "Start Date", "TERM_YEARS": "Term in Years", "COMMISSION_PERCENTAGE": "Commission Percentage", "TERRITORY_DESCRIPTION": "Territory Description", "NOTICE_PERIOD": "Notice Period"}', 1, NULL, '2025-10-05 04:44:10', '2025-10-05 04:44:10'),
(3, 'Reseller Agreement Template', 'Standard reseller agreement template', 'reseller', 'RESELLER AGREEMENT

This Reseller Agreement ("Agreement") is entered into on [DATE] between [COMPANY_NAME] ("Supplier") and [PARTNER_NAME] ("Reseller").

1. APPOINTMENT
Supplier appoints Reseller as an authorized reseller of [PRODUCTS] in [TERRITORY].

2. TERM
This Agreement shall commence on [START_DATE] and continue for [TERM_YEARS] years.

3. PRICING
Reseller shall purchase products at [DISCOUNT_PERCENTAGE]% discount from the standard retail price.

4. MINIMUM PURCHASES
Reseller agrees to maintain minimum annual purchases of [MINIMUM_AMOUNT].

5. TERRITORY
Reseller''s territory shall be [TERRITORY_DESCRIPTION].

6. MARKETING
Reseller agrees to actively market and promote Supplier''s products.

7. TERMINATION
Either party may terminate this Agreement with [NOTICE_PERIOD] days written notice.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Supplier: _________________ Date: _________
Reseller: _________________ Date: _________', '{"DATE": "Contract Date", "COMPANY_NAME": "Company Name", "PARTNER_NAME": "Partner Name", "PRODUCTS": "Products", "TERRITORY": "Territory", "START_DATE": "Start Date", "TERM_YEARS": "Term in Years", "DISCOUNT_PERCENTAGE": "Discount Percentage", "MINIMUM_AMOUNT": "Minimum Amount", "TERRITORY_DESCRIPTION": "Territory Description", "NOTICE_PERIOD": "Notice Period"}', 1, NULL, '2025-10-05 04:44:10', '2025-10-05 04:44:10');

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('percentage','fixed','free_shipping','buy_x_get_y') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(10,2) DEFAULT 0.00,
  `max_discount_amount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `usage_count` int(11) DEFAULT 0,
  `user_limit` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `applicable_products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_products`)),
  `applicable_categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_categories`)),
  `applicable_users` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_users`)),
  `campaign_id` int(11) DEFAULT NULL,
  `qr_code_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_active` (`is_active`),
  KEY `idx_dates` (`start_date`,`end_date`),
  KEY `idx_campaign` (`campaign_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `name`, `description`, `type`, `value`, `min_order_amount`, `max_discount_amount`, `usage_limit`, `usage_count`, `user_limit`, `is_active`, `start_date`, `end_date`, `applicable_products`, `applicable_categories`, `applicable_users`, `campaign_id`, `qr_code_url`, `created_at`, `updated_at`) VALUES
(1, 'WELCOME10', 'Welcome Discount', '10% off for new customers', 'percentage', '10.00', '500.00', '1000.00', 100, 0, 1, 1, '2024-01-01 00:00:00', '2024-12-31 23:59:59', NULL, NULL, NULL, NULL, NULL, '2025-10-04 18:30:40', '2025-10-04 18:30:40'),
(2, 'SAVE50', 'Fixed Amount Discount', '₹50 off on orders above ₹1000', 'fixed', '50.00', '1000.00', NULL, 200, 0, 2, 1, '2024-01-01 00:00:00', '2024-12-31 23:59:59', NULL, NULL, NULL, NULL, NULL, '2025-10-04 18:30:40', '2025-10-04 18:30:40'),
(3, 'FREESHIP', 'Free Shipping', 'Free shipping on all orders', 'free_shipping', '0.00', '0.00', NULL, 500, 0, 1, 1, '2024-01-01 00:00:00', '2024-12-31 23:59:59', NULL, NULL, NULL, NULL, NULL, '2025-10-04 18:30:40', '2025-10-04 18:30:40'),
(4, 'HOLIDAY20', 'Holiday Special', '20% off for holiday season', 'percentage', '20.00', '1000.00', '2000.00', 50, 0, 1, 1, '2024-12-01 00:00:00', '2024-12-31 23:59:59', NULL, NULL, NULL, 1, NULL, '2025-10-04 18:30:40', '2025-10-04 18:30:40'),
(5, 'BUY2GET1', 'Buy 2 Get 1 Free', 'Buy 2 items get 1 free', 'buy_x_get_y', '33.33', '1500.00', '500.00', 30, 0, 1, 1, '2024-01-01 00:00:00', '2024-12-31 23:59:59', NULL, NULL, NULL, NULL, NULL, '2025-10-04 18:30:40', '2025-10-04 18:30:40'),
(6, 'VIP15', 'VIP Customer Discount', '15% off for VIP customers', 'percentage', '15.00', '2000.00', '1500.00', 25, 0, 3, 1, '2024-01-01 00:00:00', '2024-12-31 23:59:59', NULL, NULL, NULL, NULL, NULL, '2025-10-04 18:30:40', '2025-10-04 18:30:40'),
(7, 'FLASH100', 'Flash Sale', '₹100 off on flash sale items', 'fixed', '100.00', '500.00', NULL, 100, 0, 1, 1, '2024-01-01 00:00:00', '2024-12-31 23:59:59', NULL, NULL, NULL, NULL, NULL, '2025-10-04 18:30:40', '2025-10-04 18:30:40'),
(8, 'NEWUSER25', 'New User Special', '25% off for first-time users', 'percentage', '25.00', '300.00', '500.00', 75, 0, 1, 1, '2024-01-01 00:00:00', '2024-12-31 23:59:59', NULL, NULL, NULL, NULL, NULL, '2025-10-04 18:30:40', '2025-10-04 18:30:40');

-- --------------------------------------------------------

--
-- Table structure for table `contracts`
--

CREATE TABLE `contracts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contract_number` varchar(100) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `contract_type` enum('franchise','agency','reseller','custom') NOT NULL,
  `status` enum('draft','pending_signature','active','expired','terminated','renewed') DEFAULT 'draft',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `renewal_date` date DEFAULT NULL,
  `contract_value` decimal(15,2) DEFAULT NULL,
  `terms_and_conditions` longtext DEFAULT NULL,
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_fields`)),
  `document_path` varchar(500) DEFAULT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `contract_number` (`contract_number`),
  KEY `partner_id` (`partner_id`),
  KEY `template_id` (`template_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contracts_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `contract_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `contracts_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` (`id`, `contract_number`, `partner_id`, `template_id`, `title`, `description`, `contract_type`, `status`, `start_date`, `end_date`, `renewal_date`, `contract_value`, `terms_and_conditions`, `custom_fields`, `document_path`, `original_filename`, `file_size`, `mime_type`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'CNT1759639892249BG2U2', 1, 1, 'Franchise Agreement - Mumbai Region', 'Exclusive franchise agreement for Mumbai metropolitan area', 'franchise', 'active', '2024-01-01', '2026-12-31', NULL, '500000.00', 'This franchise agreement grants exclusive rights to operate in the Mumbai metropolitan area. The franchisee agrees to maintain brand standards and pay monthly royalties.', NULL, NULL, NULL, NULL, NULL, 1, '2025-10-05 04:51:32', '2025-10-05 04:51:32'),
(2, 'CNT1759639892281KFAMK', 2, 2, 'Agency Agreement - Delhi NCR', 'Sales agency agreement for Delhi NCR region', 'agency', 'pending_signature', '2024-02-01', '2025-01-31', NULL, '250000.00', 'This agency agreement appoints the partner as an authorized sales agent for Delhi NCR region. Commission structure: 10% on all sales.', NULL, NULL, NULL, NULL, NULL, 1, '2025-10-05 04:51:32', '2025-10-05 04:51:32'),
(3, 'CNT1759639892291MK6H2', 3, 3, 'Reseller Agreement - Bangalore', 'Product reseller agreement for Bangalore market', 'reseller', 'draft', '2024-03-01', '2025-02-28', NULL, '100000.00', 'This reseller agreement allows the partner to purchase and resell products in the Bangalore market at a 15% discount from retail price.', NULL, NULL, NULL, NULL, NULL, 1, '2025-10-05 04:51:32', '2025-10-05 04:51:32');

-- --------------------------------------------------------

--
-- Table structure for table `coupon_usage`
--

CREATE TABLE `coupon_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coupon_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `discount_amount` decimal(10,2) NOT NULL,
  `order_total` decimal(10,2) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_coupon` (`coupon_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_used_at` (`used_at`),
  CONSTRAINT `coupon_usage_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `coupon_usage`
--

-- --------------------------------------------------------

--
-- Table structure for table `contract_analytics`
--

CREATE TABLE `contract_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contract_id` int(11) NOT NULL,
  `event_type` enum('viewed','downloaded','shared','signed','renewed','terminated') NOT NULL,
  `event_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`event_data`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `contract_id` (`contract_id`),
  CONSTRAINT `contract_analytics_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contract_analytics`
--

INSERT INTO `contract_analytics` (`id`, `contract_id`, `event_type`, `event_data`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'viewed', '{"source":"admin_panel","timestamp":"2025-10-05T04:51:32.269Z"}', '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32'),
(2, 1, 'downloaded', '{"source":"admin_panel","timestamp":"2025-10-05T04:51:32.275Z"}', '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32'),
(3, 1, 'shared', '{"source":"admin_panel","timestamp":"2025-10-05T04:51:32.278Z"}', '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32'),
(4, 2, 'viewed', '{"source":"admin_panel","timestamp":"2025-10-05T04:51:32.283Z"}', '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32'),
(5, 2, 'downloaded', '{"source":"admin_panel","timestamp":"2025-10-05T04:51:32.286Z"}', '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32'),
(6, 2, 'shared', '{"source":"admin_panel","timestamp":"2025-10-05T04:51:32.288Z"}', '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32'),
(7, 3, 'viewed', '{"source":"admin_panel","timestamp":"2025-10-05T04:51:32.295Z"}', '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32'),
(8, 3, 'downloaded', '{"source":"admin_panel","timestamp":"2025-10-05T04:51:32.297Z"}', '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32'),
(9, 3, 'shared', '{"source":"admin_panel","timestamp":"2025-10-05T04:51:32.298Z"}', '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32');

-- --------------------------------------------------------

--
-- Table structure for table `contract_reminders`
--

CREATE TABLE `contract_reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contract_id` int(11) NOT NULL,
  `reminder_type` enum('renewal','expiration','payment','custom') NOT NULL,
  `reminder_date` date NOT NULL,
  `message` text NOT NULL,
  `is_sent` tinyint(1) DEFAULT 0,
  `sent_at` timestamp NULL DEFAULT NULL,
  `sent_to_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `contract_id` (`contract_id`),
  CONSTRAINT `contract_reminders_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contract_reminders`
--

INSERT INTO `contract_reminders` (`id`, `contract_id`, `reminder_type`, `reminder_date`, `message`, `is_sent`, `sent_at`, `sent_to_email`, `created_at`) VALUES
(1, 1, 'renewal', '2026-11-30', 'Your contract is expiring in 30 days. Please contact us to discuss renewal options.', 0, NULL, 'admin@praashibysupal.com', '2025-10-05 04:51:32'),
(2, 2, 'renewal', '2024-12-31', 'Your contract is expiring in 30 days. Please contact us to discuss renewal options.', 0, NULL, 'admin@praashibysupal.com', '2025-10-05 04:51:32'),
(3, 3, 'renewal', '2025-01-28', 'Your contract is expiring in 30 days. Please contact us to discuss renewal options.', 0, NULL, 'admin@praashibysupal.com', '2025-10-05 04:51:32');

-- --------------------------------------------------------

--
-- Table structure for table `contract_renewals`
--

CREATE TABLE `contract_renewals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contract_id` int(11) NOT NULL,
  `renewal_number` int(11) NOT NULL,
  `original_end_date` date NOT NULL,
  `new_end_date` date NOT NULL,
  `renewal_reason` text DEFAULT NULL,
  `terms_changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`terms_changes`)),
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `contract_id` (`contract_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `contract_renewals_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contract_renewals_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `contract_renewals`
--

-- --------------------------------------------------------

--
-- Table structure for table `contract_signatures`
--

CREATE TABLE `contract_signatures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contract_id` int(11) NOT NULL,
  `signer_type` enum('partner','admin','witness') NOT NULL,
  `signer_id` int(11) DEFAULT NULL,
  `signer_name` varchar(255) NOT NULL,
  `signer_email` varchar(255) DEFAULT NULL,
  `signature_data` longtext DEFAULT NULL,
  `signature_image_path` varchar(500) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `signed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `contract_id` (`contract_id`),
  KEY `signer_id` (`signer_id`),
  CONSTRAINT `contract_signatures_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contract_signatures_ibfk_2` FOREIGN KEY (`signer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contract_signatures`
--

INSERT INTO `contract_signatures` (`id`, `contract_id`, `signer_type`, `signer_id`, `signer_name`, `signer_email`, `signature_data`, `signature_image_path`, `ip_address`, `user_agent`, `signed_at`) VALUES
(1, 1, 'admin', NULL, 'Admin User', 'admin@praashibysupal.com', NULL, NULL, '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32'),
(2, 1, 'partner', NULL, 'Gold Jewelry Franchise Mumbai', 'mumbai@goldjewelry.com', NULL, NULL, '127.0.0.1', 'Sample Browser', '2025-10-05 04:51:32');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `order_status` enum('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `shipping_address` text DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `order_number` varchar(50) NOT NULL,
  `status` enum('pending','confirmed','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
  `payment_method` enum('cash_on_delivery','credit_card','debit_card','net_banking','upi','wallet') DEFAULT 'cash_on_delivery',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) DEFAULT 'INR',
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `razorpay_payment_id` varchar(255) DEFAULT NULL,
  `razorpay_order_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total_amount`, `payment_status`, `order_status`, `shipping_address`, `billing_address`, `created_at`, `updated_at`, `order_number`, `status`, `payment_method`, `subtotal`, `tax_amount`, `shipping_amount`, `currency`, `customer_name`, `customer_email`, `customer_phone`, `notes`, `tracking_number`, `shipped_at`, `delivered_at`, `razorpay_payment_id`, `razorpay_order_id`) VALUES
(1, 3, '1353.90', 'paid', 'pending', '123 Main Street, Mumbai, Maharashtra 400001', '123 Main Street, Mumbai, Maharashtra 400001', '2025-10-04 03:07:15', '2025-10-04 16:40:28', 'ORD-2025-001', 'delivered', 'cash_on_delivery', '1105.00', '198.90', '50.00', 'INR', 'Test User', 'test@example.com', '+91 9876543210', 'Please deliver after 6 PM', 'TRK123456789', '2025-01-15 04:30:00', '2025-01-17 09:00:00', NULL, NULL),
(2, 3, '1319.68', 'paid', 'pending', '456 Park Avenue, Delhi, Delhi 110001', '456 Park Avenue, Delhi, Delhi 110001', '2025-10-04 03:07:15', '2025-10-04 16:40:28', 'ORD-2025-002', 'shipped', 'upi', '1076.00', '193.68', '50.00', 'INR', 'Test User', 'test@example.com', '+91 9876543210', 'Gift wrapping required', 'TRK987654321', '2025-01-20 03:30:00', NULL, NULL, NULL),
(3, 3, '907.86', 'paid', 'pending', '789 Garden Road, Bangalore, Karnataka 560001', '789 Garden Road, Bangalore, Karnataka 560001', '2025-10-04 03:07:15', '2025-10-04 16:40:28', 'ORD-2025-003', 'processing', 'credit_card', '727.00', '130.86', '50.00', 'INR', 'Test User', 'test@example.com', '+91 9876543210', 'Fragile items - handle with care', NULL, NULL, NULL, NULL, NULL),
(4, NULL, '1343.28', 'pending', 'pending', 'affaf', 'affaf', '2025-10-04 04:23:07', '2025-10-04 16:40:28', 'ORD-2025-787616', 'pending', '', '1096.00', '197.28', '50.00', 'INR', 'zvzv', 'zv@gmail.com', '6566554545', '', NULL, NULL, NULL, NULL, NULL),
(5, NULL, '461.82', 'pending', 'pending', 'hchdhdhhdhdhdhd', 'hchdhdhhdhdhdhd', '2025-10-04 04:28:26', '2025-10-04 16:40:28', 'ORD-2025-106661', 'pending', '', '349.00', '62.82', '50.00', 'INR', 'mvvm', 'faf@gmail.com', '4545656565', '', NULL, NULL, NULL, NULL, NULL),
(6, NULL, '1319.68', 'pending', 'pending', 'sagvsagdgaag', 'sagvsagdgaag', '2025-10-04 04:53:31', '2025-10-04 16:40:28', 'ORD-2025-611754', 'pending', '', '1076.00', '193.68', '50.00', 'INR', 'dvfgdg', 'dg@gmail.com', '3232525252', '', NULL, NULL, NULL, NULL, NULL),
(7, NULL, '1765.72', 'pending', 'pending', 'sggsgsgsgsgsgsg', 'sggsgsgsgsgsgsg', '2025-10-04 05:01:29', '2025-10-04 16:40:28', 'ORD-2025-089526', 'pending', '', '1454.00', '261.72', '50.00', 'INR', 'gkgfk', 'gkg@gmail.com', '6595956595', '', NULL, NULL, NULL, NULL, NULL),
(8, NULL, '873.64', 'pending', 'pending', 'dffbhfdshbfddbd', 'dffbhfdshbfddbd', '2025-10-04 05:07:10', '2025-10-04 16:40:28', 'ORD-2025-430418', 'pending', '', '698.00', '125.64', '50.00', 'INR', 'dgdg', 'dgd@gmail.com', '9879879879', '', NULL, NULL, NULL, NULL, NULL),
(9, NULL, '1530.90', 'pending', 'pending', 'afgafgagagaag', 'afgafgagagaag', '2025-10-04 05:09:41', '2025-10-04 16:40:28', 'ORD-2025-581632', 'pending', '', '1255.00', '225.90', '50.00', 'INR', 'sgsgs', 'sgsg@gmail.com', '6595695696', '', NULL, NULL, NULL, NULL, NULL),
(10, NULL, '1343.28', 'pending', 'pending', 'sbgvsgbsbgsbbsvbs', 'sbgvsgbsbgsbbsvbs', '2025-10-04 05:11:27', '2025-10-04 16:40:28', 'ORD-2025-687950', 'pending', '', '1096.00', '197.28', '50.00', 'INR', 'fjfjf', 'hsdh@gmail.com', '6565656565', '', NULL, NULL, NULL, NULL, NULL),
(11, NULL, '907.86', 'pending', 'pending', 'sgbsbbsbbsbssfb', 'sgbsbbsbbsbssfb', '2025-10-04 05:17:15', '2025-10-04 16:40:28', 'ORD-2025-035390', 'pending', '', '727.00', '130.86', '50.00', 'INR', 'nfgdnd', 'dndn@gmail.com', '6565465654', '', NULL, NULL, NULL, NULL, NULL),
(12, NULL, '696.64', 'pending', 'pending', 'Test Address, Test City', 'Test Address, Test City', '2025-10-04 05:27:01', '2025-10-04 16:40:28', 'ORD-2025-621687', 'pending', '', '548.00', '98.64', '50.00', 'INR', 'Test Customer', 'test@example.com', '9876543210', 'Test order for payment flow', NULL, NULL, NULL, NULL, NULL),
(13, NULL, '1353.90', 'paid', 'pending', 'Test Address, Test City', 'Test Address, Test City', '2025-10-04 05:27:22', '2025-10-04 16:40:28', 'ORD-2025-642325', 'pending', '', '1105.00', '198.90', '50.00', 'INR', 'Test Customer', 'test@example.com', '9876543210', 'Test order for payment flow', NULL, NULL, NULL, 'pay_test_1759555642650', 'order_1759555642647'),
(14, NULL, '907.86', 'pending', 'pending', 'ujjdtttjttt', 'ujjdtttjttt', '2025-10-04 09:00:59', '2025-10-04 16:40:28', 'ORD-2025-459682', 'pending', '', '727.00', '130.86', '50.00', 'INR', 'ravi', 'rv@gmail.com', '9896669888', '', NULL, NULL, NULL, NULL, NULL),
(15, NULL, '696.64', 'pending', 'pending', 'ujjdtttjttt', 'ujjdtttjttt', '2025-10-04 09:01:07', '2025-10-04 16:40:28', 'ORD-2025-467837', 'pending', '', '548.00', '98.64', '50.00', 'INR', 'ravi', 'rv@gmail.com', '9896669888', '', NULL, NULL, NULL, NULL, NULL),
(16, NULL, '1554.50', 'pending', 'pending', 'ujjdtttjttt', 'ujjdtttjttt', '2025-10-04 09:01:23', '2025-10-04 16:40:28', 'ORD-2025-483241', 'pending', '', '1275.00', '229.50', '50.00', 'INR', 'ravi', 'rv@gmail.com', '9896669888', '', NULL, NULL, NULL, NULL, NULL),
(17, NULL, '1108.46', 'pending', 'pending', 'ujjdtttjttt', 'ujjdtttjttt', '2025-10-04 09:04:33', '2025-10-04 16:40:28', 'ORD-2025-673300', 'pending', '', '897.00', '161.46', '50.00', 'INR', 'ravi', 'rv@gmail.com', '9896669888', '', NULL, NULL, NULL, NULL, NULL),
(18, NULL, '1119.08', 'pending', 'pending', 'ujjdtttjttt', 'ujjdtttjttt', '2025-10-04 09:04:41', '2025-10-04 16:40:28', 'ORD-2025-681674', 'pending', '', '906.00', '163.08', '50.00', 'INR', 'ravi', 'rv@gmail.com', '9896669888', '', NULL, NULL, NULL, NULL, NULL),
(19, NULL, '1554.50', 'pending', 'pending', 'sfgfbfsgsggsg', 'sfgfbfsgsggsg', '2025-10-04 09:08:19', '2025-10-04 16:40:28', 'ORD-2025-899263', 'pending', '', '1275.00', '229.50', '50.00', 'INR', 'zxdbb', 'xvgx@gmail.com', '6565848484', '', NULL, NULL, NULL, NULL, NULL),
(20, NULL, '931.46', 'pending', 'pending', 'sagsaggsgs', 'sagsaggsgs', '2025-10-04 09:08:58', '2025-10-04 16:40:28', 'ORD-2025-938057', 'pending', '', '747.00', '134.46', '50.00', 'INR', 'mjfvm', 'fn@gmail.com', '6554788858', '', NULL, NULL, NULL, NULL, NULL),
(21, NULL, '461.82', 'pending', 'pending', 'dbdbedeebebebh', 'dbdbedeebebebh', '2025-10-04 09:11:04', '2025-10-04 16:40:28', 'ORD-2025-064657', 'pending', '', '349.00', '62.82', '50.00', 'INR', 'dnndcccs', 'bxb@gmail.com', '9696363633', '', NULL, NULL, NULL, NULL, NULL),
(22, NULL, '873.64', 'pending', 'pending', 'dbdbedeebebebh', 'dbdbedeebebebh', '2025-10-04 09:11:09', '2025-10-04 16:40:28', 'ORD-2025-069534', 'pending', '', '698.00', '125.64', '50.00', 'INR', 'dnndcccs', 'bxb@gmail.com', '9696363633', '', NULL, NULL, NULL, NULL, NULL),
(23, NULL, '1530.90', 'pending', 'pending', 'yryyysysy', 'yryyysysy', '2025-10-04 09:14:12', '2025-10-04 16:40:28', 'ORD-2025-252329', 'pending', '', '1255.00', '225.90', '50.00', 'INR', 'fjfjf', 'dhjdh@gmail.com', '2131213121', '', NULL, NULL, NULL, NULL, NULL),
(24, NULL, '1554.50', 'pending', 'pending', 'niniinininnin', 'njnkjjnnjnjnjnjjnnjn', '2025-10-04 09:17:39', '2025-10-04 16:40:28', 'ORD-2025-459850', 'pending', '', '1275.00', '229.50', '50.00', 'INR', 'njnun', 'bxb@gmail.com', '9696363633', '', NULL, NULL, NULL, NULL, NULL),
(25, NULL, '696.64', 'pending', 'pending', 'niniinininnin', 'njnkjjnnjnjnjnjjnnjn', '2025-10-04 09:17:45', '2025-10-04 16:40:28', 'ORD-2025-465281', 'pending', '', '548.00', '98.64', '50.00', 'INR', 'njnun', 'bxb@gmail.com', '9696363633', '', NULL, NULL, NULL, NULL, NULL),
(26, NULL, '461.82', 'pending', 'pending', 'sgsgggsgsgsgsg', 'sgsgggsgsgsgsg', '2025-10-04 09:25:45', '2025-10-04 16:40:28', 'ORD-2025-945990', 'pending', '', '349.00', '62.82', '50.00', 'INR', 'ndcnxfn', 'xh@gmail.com', '3252365252', '', NULL, NULL, NULL, NULL, NULL),
(27, NULL, '1119.08', 'pending', 'pending', 'sgsgggsgsgsgsg', 'sgsgggsgsgsgsg', '2025-10-04 09:25:51', '2025-10-04 16:40:28', 'ORD-2025-951141', 'pending', '', '906.00', '163.08', '50.00', 'INR', 'ndcnxfn', 'xh@gmail.com', '3252365252', '', NULL, NULL, NULL, NULL, NULL),
(28, NULL, '284.82', 'pending', 'pending', 'cfccncn', 'cfccncn', '2025-10-04 16:33:34', '2025-10-04 16:33:34', 'ORD-2025-614043', 'pending', '', '199.00', '35.82', '50.00', 'INR', 'tgfgh', 'dg@gmail.com', '6565665566', '', NULL, NULL, NULL, NULL, NULL),
(29, NULL, '168.00', 'pending', 'pending', 'wvfwvfwvvw', 'wvfwvfwvvw', '2025-10-05 05:24:40', '2025-10-05 05:24:40', 'ORD-2025-880552', 'pending', '', '100.00', '18.00', '50.00', 'INR', 'hjh', 'tnmt@gmail.com', '6565545454', '', NULL, NULL, NULL, NULL, NULL),
(30, NULL, '168.00', 'pending', 'pending', 'wvfwvfwvvw', 'wvfwvfwvvw', '2025-10-05 05:24:51', '2025-10-05 05:24:51', 'ORD-2025-891387', 'pending', '', '100.00', '18.00', '50.00', 'INR', 'hjh', 'tnmt@gmail.com', '6565545454', '', NULL, NULL, NULL, NULL, NULL),
(31, NULL, '261.22', 'paid', 'pending', 'vfgvdvvfvwsv', 'vfgvdvvfvwsv', '2025-10-05 05:26:54', '2025-10-05 05:26:55', 'ORD-2025-014286', 'pending', '', '179.00', '32.22', '50.00', 'INR', 'fnf', 'fbv@gmail.com', '6565545454', '', NULL, NULL, NULL, 'pay_demo_1759642015675', 'order_1759642014476'),
(32, NULL, '461.82', 'paid', 'pending', 'dhdhdh', 'dhdhdh', '2025-10-05 05:35:36', '2025-10-05 05:35:40', 'ORD-2025-536285', 'pending', '', '349.00', '62.82', '50.00', 'INR', 'fnmfn', 'dndn@gmail.com', '6655665566', '', NULL, NULL, NULL, 'pay_demo_1759642540424', 'order_1759642536480'),
(33, NULL, '933.82', 'paid', 'pending', 'avavvaav', 'avavvaav', '2025-10-05 12:35:51', '2025-10-05 12:35:55', 'ORD-2025-751823', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'dhbd', 'dbnd@gmail.com', '6565696633', '', NULL, NULL, NULL, 'pay_demo_1759667755599', 'order_1759667752761'),
(34, NULL, '933.82', 'pending', 'pending', 'sdfgssbbb', 'sdfgssbbb', '2025-10-05 12:41:13', '2025-10-05 12:41:13', 'ORD-2025-073014', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'fjfj', 'fjfj@gmail.com', '3252362333', '', NULL, NULL, NULL, NULL, NULL),
(35, NULL, '933.82', 'pending', 'pending', 'sdfgssbbb', 'sdfgssbbb', '2025-10-05 12:43:05', '2025-10-05 12:43:05', 'ORD-2025-185041', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'fjfj', 'fjfj@gmail.com', '3252362333', '', NULL, NULL, NULL, NULL, NULL),
(36, NULL, '933.82', 'paid', 'pending', 'affafaffaf', 'affafaffaf', '2025-10-05 12:44:08', '2025-10-05 12:44:19', 'ORD-2025-248790', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'hbdfxhb', 'xb@gmail.com', '3636525252', '', NULL, NULL, NULL, 'pay_demo_1759668259902', 'order_1759668249354'),
(37, NULL, '933.82', 'pending', 'pending', 'ffsvfsvsvsfvvssv', 'ffsvfsvsvsfvvssv', '2025-10-05 12:46:16', '2025-10-05 12:46:16', 'ORD-2025-376931', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'sfvsf', 'sf@gmail.com', '6333222255', '', NULL, NULL, NULL, NULL, NULL),
(38, NULL, '284.82', 'paid', 'pending', 'svbsvssvvsv', 'svbsvssvvsv', '2025-10-05 12:56:22', '2025-10-05 12:56:28', 'ORD-2025-982856', 'pending', '', '199.00', '35.82', '50.00', 'INR', 'bdbb', 'dbdb@gmail.com', '3322332222', '', NULL, NULL, NULL, 'pay_demo_1759668988122', 'order_1759668983012'),
(39, NULL, '284.82', 'paid', 'pending', 'svvsvvsv', 'svvsvvsv', '2025-10-05 12:59:57', '2025-10-05 12:59:59', 'ORD-2025-197703', 'pending', '', '199.00', '35.82', '50.00', 'INR', 'bxb', 'vsvs@gmail.com', '1125255885', '', NULL, NULL, NULL, 'pay_demo_1759669199426', 'order_1759669197853'),
(40, NULL, '284.82', 'pending', 'pending', 'ahmedabad', 'ahmedabad', '2025-10-05 13:07:34', '2025-10-05 13:07:34', 'ORD-2025-654437', 'pending', '', '199.00', '35.82', '50.00', 'INR', 'Addealindia', 'dbdb@gmail.com', '3322332222', '', NULL, NULL, NULL, NULL, NULL),
(41, NULL, '461.82', 'pending', 'pending', 'sgsggsggs', 'sgsggsggs', '2025-10-07 03:24:09', '2025-10-07 03:24:09', 'ORD-2025-449520', 'pending', '', '349.00', '62.82', '50.00', 'INR', 'djhdj', 'dj@gmail.com', '6565656565', '', NULL, NULL, NULL, NULL, NULL),
(42, NULL, '461.82', 'pending', 'pending', 'Test Address, Test City', 'Test Address, Test City', '2025-10-07 04:55:17', '2025-10-07 04:55:17', 'ORD-2025-917457', 'pending', '', '349.00', '62.82', '50.00', 'INR', 'Test Customer', 'test@example.com', '9876543210', 'Test order', NULL, NULL, NULL, NULL, NULL),
(43, NULL, '166.82', 'pending', 'pending', 'lghlhhhh.hgjhhg', 'lghlhhhh.hgjhhg', '2025-10-07 05:20:19', '2025-10-07 05:20:19', 'ORD-2025-419201', 'pending', '', '99.00', '17.82', '50.00', 'INR', 'fjf', 'fjf@gmail.com', '3252365252', '', NULL, NULL, NULL, NULL, NULL),
(44, NULL, '166.82', 'pending', 'pending', 'dndndddndndn', 'dndndddndndn', '2025-10-07 05:22:20', '2025-10-07 05:22:20', 'ORD-2025-540109', 'pending', '', '99.00', '17.82', '50.00', 'INR', 'nfn', 'dndn@gmail.com', '3232322332', '', NULL, NULL, NULL, NULL, NULL),
(45, NULL, '343.82', 'pending', 'pending', 'dfndndgndnnnd', 'dfndndgndnnnd', '2025-10-07 05:32:01', '2025-10-07 05:32:01', 'ORD-2025-121945', 'pending', '', '249.00', '44.82', '50.00', 'INR', 'ddgg', 'ravi@gmail.com', '6565696969', '', NULL, NULL, NULL, NULL, NULL),
(46, NULL, '933.82', 'pending', 'pending', 'nfgnfn', 'nfgnfn', '2025-10-11 03:16:15', '2025-10-11 03:16:15', 'ORD-2025-575536', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'ccbnnc', 'xb@gmail.com', '6556569696', '', NULL, NULL, NULL, NULL, NULL),
(47, NULL, '933.82', 'pending', 'pending', 'nfgnfn', 'nfgnfn', '2025-10-11 03:18:34', '2025-10-11 03:18:34', 'ORD-2025-714498', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'ccbnnc', 'xb@gmail.com', '6556569696', '', NULL, NULL, NULL, NULL, NULL),
(48, NULL, '933.82', 'pending', 'pending', 'bhddfhdhhb', 'bhddfhdhhb', '2025-10-11 03:22:41', '2025-10-11 03:22:41', 'ORD-2025-961111', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'cmn', 'cn@gmail.com', '5656555855', '', NULL, NULL, NULL, NULL, NULL),
(49, NULL, '933.82', 'pending', 'pending', 'bhddfhdhhb', 'bhddfhdhhb', '2025-10-11 03:24:19', '2025-10-11 03:24:19', 'ORD-2025-059407', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'cmn', 'cn@gmail.com', '5656555855', '', NULL, NULL, NULL, NULL, NULL),
(50, NULL, '933.82', 'pending', 'pending', 'bhddfhdhhb', 'bhddfhdhhb', '2025-10-11 03:24:27', '2025-10-11 03:24:27', 'ORD-2025-067551', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'cmn', 'cn@gmail.com', '5656555855', '', NULL, NULL, NULL, NULL, NULL),
(51, NULL, '933.82', 'pending', 'pending', 'bhddfhdhhb', 'bhddfhdhhb', '2025-10-11 03:24:39', '2025-10-11 03:24:39', 'ORD-2025-079036', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'cmn', 'cn@gmail.com', '5656555855', '', NULL, NULL, NULL, NULL, NULL),
(52, NULL, '933.82', 'pending', 'pending', 'bhddfhdhhb', 'bhddfhdhhb', '2025-10-11 03:26:11', '2025-10-11 03:26:11', 'ORD-2025-171100', 'pending', '', '749.00', '134.82', '50.00', 'INR', 'cmn', 'cn@gmail.com', '5656555855', '', NULL, NULL, NULL, NULL, NULL),
(53, NULL, '286.00', 'pending', 'pending', 'swggsfggsdfg', 'swggsfggsdfg', '2025-10-11 03:28:38', '2025-10-11 03:28:38', 'ORD-2025-318399', 'pending', '', '200.00', '36.00', '50.00', 'INR', 'wetetet', 'etet@gmail.com', '6565658585', '', NULL, NULL, NULL, NULL, NULL),
(54, NULL, '2358.82', 'pending', 'pending', 'bdbdbbdbdddd', 'bdbdbbdbdddd', '2025-10-11 05:22:30', '2025-10-11 05:22:30', 'ORD-2025-150542', 'pending', '', '1999.00', '359.82', '0.00', 'INR', 'Ravi', 'rtr@gmail.com', '6969666333', '', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subcategories`
--

CREATE TABLE `subcategories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subcategories`
--

INSERT INTO `subcategories` (`id`, `category_id`, `name`, `slug`, `description`, `image`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, 'Long Necklaces', 'long-necklaces', 'Elegant long necklaces', NULL, 1, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(2, 2, 'Short Necklaces', 'short-necklaces', 'Beautiful short necklaces', NULL, 2, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(3, 2, 'Pendant Necklaces', 'pendant-necklaces', 'Stunning pendant designs', NULL, 3, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(4, 2, 'Choker Necklaces', 'choker-necklaces', 'Trendy choker styles', NULL, 4, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(5, 3, 'Stud Earrings', 'stud-earrings', 'Classic stud earrings', NULL, 1, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(6, 3, 'Drop Earrings', 'drop-earrings', 'Elegant drop designs', NULL, 2, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(7, 3, 'Hoop Earrings', 'hoop-earrings', 'Trendy hoop styles', NULL, 3, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(8, 3, 'Chandelier Earrings', 'chandelier-earrings', 'Glamorous chandelier designs', NULL, 4, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(9, 1, 'Engagement Rings', 'engagement-rings', 'Beautiful engagement rings', NULL, 1, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(10, 1, 'Fashion Rings', 'fashion-rings', 'Trendy fashion rings', NULL, 2, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(11, 1, 'Band Rings', 'band-rings', 'Classic band rings', NULL, 3, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(12, 1, 'Statement Rings', 'statement-rings', 'Bold statement pieces', NULL, 0, 1, '2025-10-03 07:42:04', '2025-10-03 18:48:49'),
(13, 4, 'Chain Bracelets', 'chain-bracelets', 'Elegant chain designs', NULL, 1, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(14, 4, 'Bangle Bracelets', 'bangle-bracelets', 'Traditional bangles', NULL, 2, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(15, 4, 'Charm Bracelets', 'charm-bracelets', 'Charming designs', NULL, 3, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(16, 4, 'Cuff Bracelets', 'cuff-bracelets', 'Modern cuff styles', NULL, 4, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(17, 5, 'Men Watches', 'men-watches', 'Stylish watches for men', NULL, 1, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(18, 5, 'Women Watches', 'women-watches', 'Elegant watches for women', NULL, 2, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(19, 5, 'Smart Watches', 'smart-watches', 'Modern smart watches', NULL, 3, 1, '2025-10-03 07:42:04', '2025-10-03 07:42:04'),
(25, 22, 'sampleyy', 'sampleyy', '', NULL, 0, 1, '2025-10-04 13:41:21', '2025-10-04 13:41:41');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `subcategory_id` int(11) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `hsn_sac` varchar(20) DEFAULT '1234',
  `stock_quantity` int(11) DEFAULT 0,
  `weight` decimal(8,2) DEFAULT NULL,
  `material` varchar(100) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `primary_image` varchar(255) DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `is_featured` tinyint(1) DEFAULT 0,
  `homepage_section` enum('featured','victorian','color-changing','none') DEFAULT 'none',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `discount_percentage` int(11) DEFAULT 0,
  `dimensions` varchar(255) DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `sku` (`sku`),
  KEY `category_id` (`category_id`),
  KEY `fk_product_subcategory` (`subcategory_id`),
  CONSTRAINT `fk_product_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `slug`, `description`, `short_description`, `category_id`, `subcategory_id`, `price`, `original_price`, `sku`, `hsn_sac`, `stock_quantity`, `weight`, `material`, `color`, `size`, `primary_image`, `images`, `is_featured`, `homepage_section`, `is_active`, `created_at`, `updated_at`, `discount_percentage`, `dimensions`, `meta_title`, `meta_description`) VALUES
(24, 'Sparkling Pave Heart Stud Earrings', 'sparkling-pave-heart-stud-earrings', 'Dazzling Pave Heart Stud Earrings with an elegant Anti-Tarnish finish. Inspired by Korean style, these beautiful studs are completely covered in brilliant stones for a luxurious, high-end sparkle. Perfect for adding a glamorous touch to any look.
', '', 3, NULL, '349.00', '700.00', 'SKU-1759584943887-755', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759584943875-866183850.jpg', NULL, 0, 'color-changing', 1, '2025-10-04 13:35:43', '2025-10-11 17:19:19', 50, NULL, NULL, NULL),
(25, 'Sparkle Textured Rose Gold Earrings', 'sparkle-textured-rose-gold-earrings', 'Elevate your style with these Premium Quality Rose Gold Earrings. Featuring an intricate textured halo and sparkling accents, they offer a brilliant look without the maintenance. The Anti-Tarnish finish keeps them shining and beautiful. Perfect for everyday elegance or a subtle evening glow.
', '', 3, NULL, '199.00', '400.00', '10', '1234', 50, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759585025775-441461137.jpg', NULL, 0, 'victorian', 1, '2025-10-04 13:37:05', '2025-10-11 17:19:19', 50, NULL, NULL, NULL),
(26, 'Floral Drop Statement Earrings', 'floral-drop-statement-earrings', 'Make a glamorous statement with these Fashionable Korean Metal earrings. These Floral Drop Earrings feature two Dimensional Flowers with a beautiful Polished Silver Finish and subtle Gold Accents.Lightweight and striking, they add Elegant Movement to your look.
', '', 3, NULL, '179.00', '360.00', 'SKU-1759585536077-203', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759585536074-989538109.jpg', NULL, 1, 'none', 1, '2025-10-04 13:45:36', '2025-10-11 17:19:19', 50, NULL, NULL, NULL),
(28, 'Everyday Rose Gold Stud Earrings', 'everyday-rose-gold-stud-earrings', 'These elegant Rose Gold Stud Earrings are your new favorite for Daily Wear. Featuring a central brilliant-cut stone surrounded by a delicate micro Cubic Zirconia, they offer diamond-like sparkle. The warm Rose Gold Finish and secure fit make these Small Studs the perfect blend of classic elegance and comfort for Everyday luxury.
', '', 3, NULL, '219.00', '400.00', '100', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759658377086-673920112.jpg', NULL, 1, 'none', 1, '2025-10-05 09:59:37', '2025-10-11 17:19:19', 45, NULL, NULL, NULL),
(46, 'test', 'test', '', '', 22, NULL, '0.99', '0.00', 'SKU-1759660648532-9352', '1234', 0, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759660648518-626708449.png', NULL, 1, 'none', 1, '2025-10-05 10:37:28', '2025-10-11 17:19:19', 0, NULL, NULL, NULL),
(48, 'Crystal Drop Earrings', 'crystal-drop-earrings', 'Make a brilliant statement with these Gold-Tone Crystal Drop Earrings. These Dangle Earrings are perfect for Weddings, Parties or adding luxury to any Evening Look.
', '', 3, NULL, '99.00', '199.00', 'SKU-1759663980209-5349', '1234', 0, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759663980201-940996360.jpg', NULL, 1, 'none', 1, '2025-10-05 11:33:00', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(49, 'Black Enamel & Geometric Drop Earrings', 'black-enamel-geometric-drop-earrings', 'Add instant polish with these Modern Geometric Drop Earrings. The striking Black and Gold contrast makes them perfect for Office Wear, Evening Events or a Trendy everyday look.
', '', 3, NULL, '99.00', '199.00', 'SKU-1759664011671-4622', '1234', 0, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664011657-883408380.jpg', NULL, 1, 'none', 1, '2025-10-05 11:33:31', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(50, 'Emerald  & Kundan  Drop Earrings', 'emerald-kundan-drop-earrings', 'Captivate with these Traditional Indian Drop Earrings. Featuring a vibrant Emerald-Tone Enamel (Meenakari) center, surrounded by shimmering Kundan Stones and intricate gold detailing. The piece is finished with delicate clusters of Pearl and Gold Ghungroo Drops that sway with elegant movement. Perfect for Weddings, Festivals and Bridal Party wear.', '', 3, NULL, '799.00', '1600.00', 'SKU-1759664054959-4097', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664054955-260171752.jpg', NULL, 1, 'none', 1, '2025-10-05 11:34:14', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(51, 'Rose Gold Coil Adjustable Bracelet', 'rose-gold-coil-adjustable-bracelet', 'Achieve an effortless stacked look with this Korean Adjustable Bracelet. The multi-strand Rose Gold Coil design is intertwined for a bold, textural statement. Finished with a secure lobster clasp and an Adjustable Extension Chain to ensure the perfect fit. This Chunky Rose Gold Bracelet adds high-fashion style to any casual or professional outfit.
', '', 3, NULL, '199.00', '399.00', 'SKU-1759664148185-8069', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664148181-222118029.jpg', NULL, 1, 'none', 1, '2025-10-05 11:35:48', '2025-10-11 17:19:20', 50, NULL, NULL, NULL),
(52, 'Two-Tone Heart Drop Earrings', 'two-tone-heart-drop-earrings', 'Add a sweet, Trendy touch with these Double Heart Drop Earrings. Featuring two layered hearts in contrasting Two-Tone Enamel (sage green and soft nude/cream) suspended from a tiny gold-tone heart stud. These Playful Dangle Earrings are lightweight, perfect for Daily Wear, and instantly elevate any Casual or Fashionable look.
', '', 3, NULL, '99.00', '199.00', 'SKU-1759664225033-9386', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664225027-74776756.jpg', NULL, 1, 'none', 1, '2025-10-05 11:37:05', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(53, 'Pearl and Marble Geometric Drop Earrings', 'pearl-and-marble-geometric-drop-earrings', 'These Modern Drop Earrings are a stylish blend of classic and contemporary. They feature a beautiful Faux Pearl stud top that connects to a sharp, Geometric Pendant with a sleek White Marble-Effect.These earrings are lightweight and perfect for making a sophisticated statement at the Office or a Weekend Event. They''re an easy way to elevate any outfit.
', '', 3, NULL, '99.00', '199.00', 'SKU-1759664307344-8322', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664307341-323430859.jpg', NULL, 1, 'none', 1, '2025-10-05 11:38:27', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(54, 'Square Rose Gold Bracelet', 'square-rose-gold-bracelet', 'This Modern Bracelet is designed to stand out. It features a unique Square Shape and a secure hinge clasp that makes it easy to open and wear. The band is beautifully set with Sparkling Pave Crystals on the front. The Rose Gold Finish makes this bracelet perfect for dressing up or adding a chic touch to your daily style.
', '', 4, NULL, '329.00', '0.00', 'SKU-1759664469849-6043', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664469841-821047445.jpg', NULL, 1, 'none', 1, '2025-10-05 11:41:09', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(55, 'Square Silver Bracelet', 'square-silver-bracelet', 'This Modern Bracelet is designed to stand out. It features a unique Square Shape and a secure hinge clasp that makes it easy to open and wear. The band is beautifully set with Sparkling Pave Crystals on the front. The silver  Finish makes this bracelet perfect for dressing up or adding a chic touch to your daily style.
', '', 4, NULL, '329.00', '0.00', 'SKU-1759664517950-4450', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664517882-870866369.jpg', NULL, 1, 'none', 1, '2025-10-05 11:41:57', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(56, 'Royal Pearl & Gemstone  Cocktail Adjustable Ring', 'royal-pearl-gemstone-cocktail-adjustable-ring', 'This beautiful Cocktail Ring features a classic, ornate design perfect for special occasions. It showcases a rich, colored Gemstone center surrounded by a delicate double halo of Mini Faux Pearls and sparkling CZ Stones. The antique-style setting and bold size make this Statement Ring an elegant addition to any traditional or festive outfit.
', '', 1, NULL, '249.00', '0.00', 'SKU-1759664555900-6095', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664555871-163453403.jpg', NULL, 1, 'none', 1, '2025-10-05 11:42:35', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(57, 'Kundan Floral Statement Adjustable Ring', 'kundan-floral-statement-adjustable-ring', 'Make a glamorous statement with this beautiful Floral Cocktail adjustable Ring. The large, intricate design is centered by a brilliant-cut stone, surrounded by shimmering Kundan-Style Teardrop Stones that form the petals. This stunning ring is perfect for Weddings, Festive Events or any time you want a bold, traditional look.
', '', 1, NULL, '369.00', '0.00', 'SKU-1759664602227-7982', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664602223-540056735.jpg', NULL, 1, 'none', 1, '2025-10-05 11:43:22', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(58, 'Elegant Layered Pearl & Kundan Necklace Set', 'elegant-layered-pearl-kundan-necklace-set', 'Capture the essence of tradition with this beautiful Beaded Necklace Set. It features multiple strands of delicate Faux Pearls, accented by sections of vibrant Green and Maroon Beads. The pendant and matching Drop Earrings are adorned with sparkling Kundan-Style Stones and finished with playful gold ghungroo drops. This complete set is perfect for Festivals, Traditional Events, or adding an ethnic touch to your formal wear.
', '', 2, NULL, '599.00', '0.00', 'SKU-1759664790320-9819', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664790304-506266329.jpg', NULL, 1, 'none', 1, '2025-10-05 11:46:30', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(59, 'Antique Matte Gold Enamel Necklace Set', 'antique-matte-gold-enamel-necklace-set', 'This gorgeous Pendant Set gives you a rich, Antique Look without the heavy price tag. The necklace and matching Drop Earrings feature a beautiful Matte Gold Finish with intricate details. The main pieces are highlighted by a deep Green Enamel design.This set is perfect for Weddings, Festivals or whenever you want a classic cultural touch.
', '', 2, NULL, '1049.00', '2100.00', 'SKU-1759664841399-1869', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664841397-359631437.jpg', NULL, 1, 'none', 1, '2025-10-05 11:47:21', '2025-10-11 17:19:20', 50, NULL, NULL, NULL),
(60, 'Luxury American Diamond Set', 'luxury-american-diamond-set', 'Make a dazzling entrance with this beautiful American Diamond (AD) Necklace Set. It features a classic silver-tone setting completely covered in brilliant white CZ stones. The set is highlighted by large, deep colour Stones in a stunning geometric cut. This set includes the matching Dangle Earrings and is perfect for Weddings, Receptions or any grand Evening Event where you want maximum sparkle.
', '', 2, NULL, '1999.00', '3999.00', 'SKU-1759664900597-407', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759664900595-631578186.jpg', NULL, 1, 'none', 1, '2025-10-05 11:48:20', '2025-10-11 17:19:20', 50, NULL, NULL, NULL),
(61, 'Celebrity wear Butterfly Necklace and Earring Set', 'celebrity-wear-butterfly-necklace-and-earring-set', 'Get the Celebrity Look with this elegant Korean-Style Jewelry Set. It features a smooth, Snake Chain Necklace with a gorgeous Textured Butterfly pendant. The set includes matching Butterfly Stud Earrings. This Gold-Tone set is perfect for Parties, Events or anytime you want a high-fashion, Red Carpet Look.
', '', 2, NULL, '249.00', '500.00', 'SKU-1759665063957-6680', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759665063951-708766356.jpg', NULL, 1, 'none', 1, '2025-10-05 11:51:03', '2025-10-11 17:19:20', 50, NULL, NULL, NULL),
(62, 'Celebrity wear Necklace and Earring Set', 'celebrity-wear-necklace-and-earring-set', 'Get the Celebrity Look with this elegant Korean-Style Jewelry Set. It features a smooth, Snake Chain Necklace with a gorgeous Textured Flat petals pendant. The set includes matching Flat petals Stud Earrings. This Gold-Tone set is perfect for Parties, Events or anytime you want a high-fashion, Red Carpet Look.
', '', 2, NULL, '249.00', '500.00', 'SKU-1759665210800-5242', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759665210797-437215143.jpg', NULL, 1, 'none', 1, '2025-10-05 11:53:30', '2025-10-11 17:19:20', 50, NULL, NULL, NULL),
(63, 'Celebrity wear flower Necklace and Earring Set', 'celebrity-wear-flower-necklace-and-earring-set', 'Get the Celebrity Look with this elegant Korean-Style Jewelry Set. It features a smooth, Snake Chain Necklace with a gorgeous Textured Flower pendant. The set includes matching Flower Stud Earrings. This Gold-Tone set is perfect for Parties, Events or anytime you want a high-fashion, Red Carpet Look.
', '', 2, NULL, '249.00', '500.00', 'SKU-1759665300556-4868', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759665300554-472845622.jpg', NULL, 1, 'none', 1, '2025-10-05 11:55:00', '2025-10-11 17:19:20', 50, NULL, NULL, NULL),
(64, 'Luxury Rose Gold Crystal Collar Set', 'luxury-rose-gold-crystal-collar-set', 'This Premium Quality Necklace Set gives you a celebrity-level sparkle. The necklace has a graceful collar design, featuring stunning Rose Gold segments paved with brilliant crystals and centered with large round stones. It comes with matching Stud Earrings. This set is adjustable for the perfect fit and is ideal for weddings, formals or any special event.
', '', 2, NULL, '948.98', '0.00', 'SKU-1759665583785-1700', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759665437614-668416462.jpg', NULL, 0, 'none', 1, '2025-10-05 11:57:17', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(65, 'Rose Gold Leaf Necklace Set', 'rose-gold-leaf-necklace-set', 'This Premium Quality necklace set is perfect for adding delicate sparkle to any neckline. The chain is adorned with beautifully arranged Leaf-Shaped Motifs paved with brilliant white crystals. The set includes matching Drop Earrings and features an Adjustable Chain for a perfect fit, making it ideal for both casual wear and special occasions.
', '', 2, NULL, '699.00', '0.00', 'SKU-1759665781055-692', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759665781049-475792112.jpg', NULL, 1, 'none', 1, '2025-10-05 12:03:01', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(66, 'Rose Gold Ornate Necklace Set', 'rose-gold-ornate-necklace-set', 'This luxurious Rose Gold Necklace Set features a stunning collar design with intricate gold-tone work and beautiful Pave Crystal accents. The necklace is wide at the center for a grand look and includes matching Drop Earrings. It''s a premium piece perfect for showcasing at a wedding or formal event.
', '', 2, NULL, '749.00', '1500.00', 'SKU-1759665937387-262', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1759665937382-129721556.jpg', NULL, 1, 'none', 1, '2025-10-05 12:05:37', '2025-10-11 17:19:20', 0, NULL, NULL, NULL),
(79, 'sampleee', 'sampleee', '', '', 3, NULL, '200.00', '0.00', 'SKU-1760119987918-884', '1234', 100, NULL, NULL, NULL, NULL, 'https://api.praashibysupal.com/uploads/products/images-1760119987914-990703976.jpg', NULL, 1, 'none', 1, '2025-10-10 18:13:07', '2025-10-11 17:19:20', 0, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL,
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) DEFAULT 'INR',
  `payment_status` enum('pending','paid','overdue','cancelled') DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `terms_conditions` text DEFAULT NULL,
  `pdf_path` varchar(255) DEFAULT NULL,
  `email_sent` tinyint(1) DEFAULT 0,
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `idx_invoices_order_id` (`order_id`),
  KEY `idx_invoices_customer_id` (`customer_id`),
  KEY `idx_invoices_invoice_number` (`invoice_number`),
  KEY `idx_invoices_invoice_date` (`invoice_date`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `invoice_number`, `order_id`, `customer_id`, `invoice_date`, `due_date`, `subtotal`, `tax_amount`, `shipping_amount`, `discount_amount`, `total_amount`, `currency`, `payment_status`, `payment_method`, `payment_date`, `notes`, `terms_conditions`, `pdf_path`, `email_sent`, `email_sent_at`, `created_at`, `updated_at`) VALUES
(1, 'INV-2025-847103', 1, 3, '2025-10-04', '2025-11-03', '1500.00', '150.00', '50.00', '0.00', '1700.00', 'INR', 'paid', 'cash_on_delivery', NULL, 'Please deliver after 6 PM', NULL, NULL, 0, NULL, '2025-10-04 03:17:27', '2025-10-04 03:17:27'),
(2, 'INV-2025-868940', 2, 3, '2025-10-04', '2025-11-03', '2500.00', '250.00', '100.00', '0.00', '2850.00', 'INR', 'paid', 'upi', NULL, 'Gift wrapping required', NULL, NULL, 0, NULL, '2025-10-04 03:17:48', '2025-10-04 03:17:48'),
(3, 'INV-2025-868952', 3, 3, '2025-10-04', '2025-11-03', '800.00', '80.00', '50.00', '0.00', '930.00', 'INR', 'paid', 'credit_card', NULL, 'Fragile items - handle with care', NULL, NULL, 0, NULL, '2025-10-04 03:17:48', '2025-10-04 03:17:48'),
(4, 'INV-2025-642668', 13, NULL, '2025-10-04', '2025-11-03', '100.00', '18.00', '50.00', '0.00', '168.00', 'INR', 'paid', 'razorpay', NULL, 'Payment completed via Razorpay', NULL, NULL, 0, NULL, '2025-10-04 05:27:22', '2025-10-04 05:27:22'),
(5, 'INV-2025-015690', 31, NULL, '2025-10-05', '2025-11-04', '179.00', '32.22', '50.00', '0.00', '261.22', 'INR', 'paid', 'razorpay', NULL, 'Payment completed via Razorpay', NULL, NULL, 0, NULL, '2025-10-05 05:26:55', '2025-10-05 05:26:55'),
(6, 'INV-2025-540439', 32, NULL, '2025-10-05', '2025-11-04', '349.00', '62.82', '50.00', '0.00', '461.82', 'INR', 'paid', 'razorpay', NULL, 'Payment completed via Razorpay', NULL, NULL, 0, NULL, '2025-10-05 05:35:40', '2025-10-05 05:35:40'),
(7, 'INV-2025-755638', 33, NULL, '2025-10-05', '2025-11-04', '749.00', '134.82', '50.00', '0.00', '933.82', 'INR', 'paid', 'razorpay', NULL, 'Payment completed via Razorpay', NULL, NULL, 0, NULL, '2025-10-05 12:35:55', '2025-10-05 12:35:55'),
(8, 'INV-2025-259919', 36, NULL, '2025-10-05', '2025-11-04', '749.00', '134.82', '50.00', '0.00', '933.82', 'INR', 'paid', 'razorpay', NULL, 'Payment completed via Razorpay', NULL, NULL, 0, NULL, '2025-10-05 12:44:19', '2025-10-05 12:44:19'),
(9, 'INV-2025-988145', 38, NULL, '2025-10-05', '2025-11-04', '199.00', '35.82', '50.00', '0.00', '284.82', 'INR', 'paid', 'razorpay', NULL, 'Payment completed via Razorpay', NULL, NULL, 0, NULL, '2025-10-05 12:56:28', '2025-10-05 12:56:28'),
(10, 'INV-2025-199440', 39, NULL, '2025-10-05', '2025-11-04', '199.00', '35.82', '50.00', '0.00', '284.82', 'INR', 'paid', 'razorpay', NULL, 'Payment completed via Razorpay', NULL, NULL, 0, NULL, '2025-10-05 12:59:59', '2025-10-05 12:59:59');

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_sku` varchar(100) DEFAULT NULL,
  `hsn_sac` varchar(20) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `taxable_amount` decimal(10,2) NOT NULL,
  `cgst_percentage` decimal(5,2) DEFAULT 0.00,
  `cgst_amount` decimal(10,2) DEFAULT 0.00,
  `sgst_percentage` decimal(5,2) DEFAULT 0.00,
  `sgst_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_invoice_items_invoice_id` (`invoice_id`),
  KEY `idx_invoice_items_product_id` (`product_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `product_id`, `product_name`, `product_sku`, `hsn_sac`, `quantity`, `unit_price`, `discount_percentage`, `discount_amount`, `taxable_amount`, `cgst_percentage`, `cgst_amount`, `sgst_percentage`, `sgst_amount`, `total_amount`, `created_at`, `updated_at`) VALUES
(7, 1, 24, 'Sparkling Pave Heart Stud Earrings', '', '1234', 1, '349.00', '0.00', '0.00', '349.00', '9.00', '31.41', '9.00', '31.41', '349.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(8, 1, 25, 'Sparkle Textured Rose Gold Earrings', '', '1234', 2, '199.00', '0.00', '0.00', '398.00', '9.00', '35.82', '9.00', '35.82', '398.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(9, 1, 26, 'Floral Drop Statement Earrings', '', '1234', 2, '179.00', '0.00', '0.00', '358.00', '9.00', '32.22', '9.00', '32.22', '358.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(10, 2, 24, 'Sparkling Pave Heart Stud Earrings', '', '1234', 2, '349.00', '0.00', '0.00', '698.00', '9.00', '62.82', '9.00', '62.82', '698.01', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(11, 2, 25, 'Sparkle Textured Rose Gold Earrings', '', '1234', 1, '199.00', '0.00', '0.00', '199.00', '9.00', '17.91', '9.00', '17.91', '199.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(12, 2, 26, 'Floral Drop Statement Earrings', '', '1234', 1, '179.00', '0.00', '0.00', '179.00', '9.00', '16.11', '9.00', '16.11', '179.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(13, 3, 24, 'Sparkling Pave Heart Stud Earrings', '', '1234', 1, '349.00', '0.00', '0.00', '349.00', '9.00', '31.41', '9.00', '31.41', '349.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(14, 3, 25, 'Sparkle Textured Rose Gold Earrings', '', '1234', 1, '199.00', '0.00', '0.00', '199.00', '9.00', '17.91', '9.00', '17.91', '199.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(15, 3, 26, 'Floral Drop Statement Earrings', '', '1234', 1, '179.00', '0.00', '0.00', '179.00', '9.00', '16.11', '9.00', '16.11', '179.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(16, 4, 24, 'Sparkling Pave Heart Stud Earrings', '', '1234', 1, '349.00', '0.00', '0.00', '349.00', '9.00', '31.41', '9.00', '31.41', '349.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(17, 4, 25, 'Sparkle Textured Rose Gold Earrings', '', '1234', 2, '199.00', '0.00', '0.00', '398.00', '9.00', '35.82', '9.00', '35.82', '398.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(18, 4, 26, 'Floral Drop Statement Earrings', '', '1234', 2, '179.00', '0.00', '0.00', '358.00', '9.00', '32.22', '9.00', '32.22', '358.00', '2025-10-04 16:40:28', '2025-10-04 16:40:28'),
(19, 5, 26, 'Floral Drop Statement Earrings', '', '1234', 1, '179.00', '0.00', '0.00', '179.00', '9.00', '16.11', '9.00', '16.11', '179.00', '2025-10-05 05:26:55', '2025-10-05 05:26:55'),
(20, 6, 24, 'Sparkling Pave Heart Stud Earrings', '', '1234', 1, '349.00', '0.00', '0.00', '349.00', '9.00', '31.41', '9.00', '31.41', '349.00', '2025-10-05 05:35:40', '2025-10-05 05:35:40'),
(21, 7, 66, 'Rose Gold Ornate Necklace Set', '', '1234', 1, '749.00', '0.00', '0.00', '749.00', '9.00', '67.41', '9.00', '67.41', '749.01', '2025-10-05 12:35:55', '2025-10-05 12:35:55'),
(22, 8, 66, 'Rose Gold Ornate Necklace Set', '', '1234', 1, '749.00', '0.00', '0.00', '749.00', '9.00', '67.41', '9.00', '67.41', '749.01', '2025-10-05 12:44:19', '2025-10-05 12:44:19'),
(23, 9, 25, 'Sparkle Textured Rose Gold Earrings', '', '1234', 1, '199.00', '0.00', '0.00', '199.00', '9.00', '17.91', '9.00', '17.91', '199.00', '2025-10-05 12:56:28', '2025-10-05 12:56:28'),
(24, 10, 25, 'Sparkle Textured Rose Gold Earrings', '', '1234', 1, '199.00', '0.00', '0.00', '199.00', '9.00', '17.91', '9.00', '17.91', '199.00', '2025-10-05 12:59:59', '2025-10-05 12:59:59');

-- --------------------------------------------------------

--
-- Table structure for table `low_stock_alerts`
--

CREATE TABLE `low_stock_alerts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `current_stock` int(11) NOT NULL,
  `min_stock_level` int(11) NOT NULL,
  `alert_type` enum('low_stock','out_of_stock','reorder_point') NOT NULL,
  `is_resolved` tinyint(1) DEFAULT 0,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `resolved_by` (`resolved_by`),
  KEY `idx_low_stock_alerts_unresolved` (`is_resolved`,`created_at`),
  CONSTRAINT `low_stock_alerts_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `low_stock_alerts_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `low_stock_alerts_ibfk_3` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `low_stock_alerts`
--

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('contact_form','support_ticket','chat_message','response_required') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `contact_id` int(11) DEFAULT NULL,
  `ticket_id` int(11) DEFAULT NULL,
  `chat_session_id` int(11) DEFAULT NULL,
  `recipient_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `chat_session_id` (`chat_session_id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_recipient_id` (`recipient_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`chat_session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `notifications`
--

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `product_image` varchar(255) DEFAULT NULL,
  `product_sku` varchar(100) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `total_price`, `created_at`, `product_image`, `product_sku`, `updated_at`) VALUES
(33, 28, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:33:34', NULL, NULL, '2025-10-04 16:33:34'),
(34, 1, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(35, 1, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 2, '398.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(36, 1, 26, 'Floral Drop Statement Earrings', '179.00', 2, '358.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(37, 2, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(38, 2, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(39, 2, 26, 'Floral Drop Statement Earrings', '179.00', 1, '179.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(40, 3, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(41, 3, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(42, 3, 26, 'Floral Drop Statement Earrings', '179.00', 1, '179.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(43, 4, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(44, 4, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 2, '398.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(45, 5, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(46, 6, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(47, 6, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(48, 6, 26, 'Floral Drop Statement Earrings', '179.00', 1, '179.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(49, 7, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(50, 7, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 2, '398.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(51, 7, 26, 'Floral Drop Statement Earrings', '179.00', 2, '358.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(52, 8, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(53, 9, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(54, 9, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(55, 9, 26, 'Floral Drop Statement Earrings', '179.00', 2, '358.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(56, 10, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(57, 10, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 2, '398.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(58, 11, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(59, 11, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(60, 11, 26, 'Floral Drop Statement Earrings', '179.00', 1, '179.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(61, 12, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(62, 12, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(63, 13, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(64, 13, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 2, '398.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(65, 13, 26, 'Floral Drop Statement Earrings', '179.00', 2, '358.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(66, 14, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(67, 14, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(68, 14, 26, 'Floral Drop Statement Earrings', '179.00', 1, '179.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(69, 15, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(70, 15, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(71, 16, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(72, 16, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 2, '398.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(73, 16, 26, 'Floral Drop Statement Earrings', '179.00', 1, '179.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(74, 17, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(75, 17, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(76, 18, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(77, 18, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(78, 18, 26, 'Floral Drop Statement Earrings', '179.00', 2, '358.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(79, 19, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(80, 19, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 2, '398.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(81, 19, 26, 'Floral Drop Statement Earrings', '179.00', 1, '179.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(82, 20, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(83, 20, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 2, '398.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(84, 21, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(85, 22, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(86, 23, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(87, 23, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(88, 23, 26, 'Floral Drop Statement Earrings', '179.00', 2, '358.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(89, 24, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 2, '698.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(90, 24, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 2, '398.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(91, 24, 26, 'Floral Drop Statement Earrings', '179.00', 1, '179.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(92, 25, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(93, 25, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(94, 26, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(95, 27, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(96, 27, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(97, 27, 26, 'Floral Drop Statement Earrings', '179.00', 2, '358.00', '2025-10-04 16:40:28', NULL, NULL, '2025-10-04 16:40:28'),
(100, 31, 26, 'Floral Drop Statement Earrings', '179.00', 1, '179.00', '2025-10-05 05:26:54', NULL, NULL, '2025-10-05 05:26:54'),
(101, 32, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-05 05:35:36', NULL, NULL, '2025-10-05 05:35:36'),
(102, 33, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-05 12:35:51', NULL, NULL, '2025-10-05 12:35:51'),
(103, 34, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-05 12:41:13', NULL, NULL, '2025-10-05 12:41:13'),
(104, 35, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-05 12:43:05', NULL, NULL, '2025-10-05 12:43:05'),
(105, 36, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-05 12:44:09', NULL, NULL, '2025-10-05 12:44:09'),
(106, 37, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-05 12:46:16', NULL, NULL, '2025-10-05 12:46:16'),
(107, 38, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-05 12:56:22', NULL, NULL, '2025-10-05 12:56:22'),
(108, 39, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-05 12:59:57', NULL, NULL, '2025-10-05 12:59:57'),
(109, 40, 25, 'Sparkle Textured Rose Gold Earrings', '199.00', 1, '199.00', '2025-10-05 13:07:34', NULL, NULL, '2025-10-05 13:07:34'),
(110, 41, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-07 03:24:09', NULL, NULL, '2025-10-07 03:24:09'),
(111, 42, 24, 'Sparkling Pave Heart Stud Earrings', '349.00', 1, '349.00', '2025-10-07 04:55:17', NULL, NULL, '2025-10-07 04:55:17'),
(112, 43, 53, 'Pearl and Marble Geometric Drop Earrings', '99.00', 1, '99.00', '2025-10-07 05:20:19', NULL, NULL, '2025-10-07 05:20:19'),
(113, 44, 53, 'Pearl and Marble Geometric Drop Earrings', '99.00', 1, '99.00', '2025-10-07 05:22:20', NULL, NULL, '2025-10-07 05:22:20'),
(114, 45, 63, 'Celebrity wear flower Necklace and Earring Set', '249.00', 1, '249.00', '2025-10-07 05:32:01', NULL, NULL, '2025-10-07 05:32:01'),
(115, 46, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-11 03:16:15', NULL, NULL, '2025-10-11 03:16:15'),
(116, 47, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-11 03:18:34', NULL, NULL, '2025-10-11 03:18:34'),
(117, 48, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-11 03:22:41', NULL, NULL, '2025-10-11 03:22:41'),
(118, 49, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-11 03:24:19', NULL, NULL, '2025-10-11 03:24:19'),
(119, 50, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-11 03:24:27', NULL, NULL, '2025-10-11 03:24:27'),
(120, 51, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-11 03:24:39', NULL, NULL, '2025-10-11 03:24:39'),
(121, 52, 66, 'Rose Gold Ornate Necklace Set', '749.00', 1, '749.00', '2025-10-11 03:26:11', NULL, NULL, '2025-10-11 03:26:11'),
(122, 53, 79, 'sampleee', '200.00', 1, '200.00', '2025-10-11 03:28:38', NULL, NULL, '2025-10-11 03:28:38'),
(123, 54, 60, 'Luxury American Diamond Set', '1999.00', 1, '1999.00', '2025-10-11 05:22:30', NULL, NULL, '2025-10-11 05:22:30');

-- --------------------------------------------------------

--
-- Table structure for table `partner_analytics`
--

CREATE TABLE `partner_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partner_id` int(11) NOT NULL,
  `event_type` enum('page_view','product_view','add_to_cart','purchase','search','custom') NOT NULL,
  `event_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`event_data`)),
  `page_url` varchar(500) DEFAULT NULL,
  `referrer` varchar(500) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `partner_id` (`partner_id`),
  CONSTRAINT `partner_analytics_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `partner_analytics`
--

-- --------------------------------------------------------

--
-- Table structure for table `partner_inventory_sharing`
--

CREATE TABLE `partner_inventory_sharing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partner_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `sharing_type` enum('full','limited','exclusive') DEFAULT 'full',
  `max_quantity` int(11) DEFAULT NULL,
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `markup_percentage` decimal(5,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_partner_product` (`partner_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `partner_inventory_sharing_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE,
  CONSTRAINT `partner_inventory_sharing_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `partner_inventory_sharing`
--

-- --------------------------------------------------------

--
-- Table structure for table `partner_orders`
--

CREATE TABLE `partner_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partner_id` int(11) NOT NULL,
  `order_number` varchar(100) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `shipping_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`shipping_address`)),
  `billing_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`billing_address`)),
  `order_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`order_items`)),
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `shipping_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `order_status` enum('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `partner_id` (`partner_id`),
  CONSTRAINT `partner_orders_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `partner_orders`
--

-- --------------------------------------------------------

--
-- Table structure for table `partner_storefronts`
--

CREATE TABLE `partner_storefronts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partner_id` int(11) NOT NULL,
  `subdomain` varchar(100) NOT NULL,
  `custom_domain` varchar(255) DEFAULT NULL,
  `store_name` varchar(255) NOT NULL,
  `store_description` text DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `favicon_url` varchar(500) DEFAULT NULL,
  `theme_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`theme_config`)),
  `layout_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`layout_config`)),
  `featured_sections` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`featured_sections`)),
  `widgets_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`widgets_config`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `subdomain` (`subdomain`),
  KEY `partner_id` (`partner_id`),
  CONSTRAINT `partner_storefronts_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `partner_storefronts`
--

INSERT INTO `partner_storefronts` (`id`, `partner_id`, `subdomain`, `custom_domain`, `store_name`, `store_description`, `logo_url`, `favicon_url`, `theme_config`, `layout_config`, `featured_sections`, `widgets_config`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'goldjewelryfranchisemumbaivlic', NULL, 'Gold Jewelry Franchise Mumbai''s Store', 'Welcome to Gold Jewelry Franchise Mumbai''s exclusive store featuring our curated selection of products.', NULL, NULL, '{"colors": {"primary": "#3B82F6", "secondary": "#1E40AF", "accent": "#60A5FA", "background": "#FFFFFF", "text": "#1F2937", "textLight": "#6B7280"}, "fonts": {"heading": "Inter", "body": "Inter"}, "layout": {"headerStyle": "modern", "footerStyle": "minimal", "productGrid": "4-columns"}}', '{"header": {"showLogo": true, "showSearch": true, "showCart": true}, "footer": {"showLinks": true, "showSocial": true}, "sidebar": {"showCategories": true, "showFilters": true}}', '["hero_banner", "featured_products", "product_carousel", "newsletter"]', '{"hero_banner": {"enabled": true, "position": 1}, "featured_products": {"enabled": true, "position": 2}, "product_carousel": {"enabled": true, "position": 3}, "newsletter": {"enabled": true, "position": 4}}', 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26'),
(2, 2, 'preciousstonesagencydelhi9o9f', NULL, 'Precious Stones Agency Delhi''s Store', 'Welcome to Precious Stones Agency Delhi''s exclusive store featuring our curated selection of products.', NULL, NULL, '{"colors": {"primary": "#3B82F6", "secondary": "#1E40AF", "accent": "#60A5FA", "background": "#FFFFFF", "text": "#1F2937", "textLight": "#6B7280"}, "fonts": {"heading": "Inter", "body": "Inter"}, "layout": {"headerStyle": "modern", "footerStyle": "minimal", "productGrid": "4-columns"}}', '{"header": {"showLogo": true, "showSearch": true, "showCart": true}, "footer": {"showLinks": true, "showSocial": true}, "sidebar": {"showCategories": true, "showFilters": true}}', '["hero_banner", "featured_products", "product_carousel", "newsletter"]', '{"hero_banner": {"enabled": true, "position": 1}, "featured_products": {"enabled": true, "position": 2}, "product_carousel": {"enabled": true, "position": 3}, "newsletter": {"enabled": true, "position": 4}}', 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26'),
(3, 3, 'elegantjewelryresellerbangaloreql1t', NULL, 'Elegant Jewelry Reseller Bangalore''s Store', 'Welcome to Elegant Jewelry Reseller Bangalore''s exclusive store featuring our curated selection of products.', NULL, NULL, '{"colors": {"primary": "#3B82F6", "secondary": "#1E40AF", "accent": "#60A5FA", "background": "#FFFFFF", "text": "#1F2937", "textLight": "#6B7280"}, "fonts": {"heading": "Inter", "body": "Inter"}, "layout": {"headerStyle": "modern", "footerStyle": "minimal", "productGrid": "4-columns"}}', '{"header": {"showLogo": true, "showSearch": true, "showCart": true}, "footer": {"showLinks": true, "showSocial": true}, "sidebar": {"showCategories": true, "showFilters": true}}', '["hero_banner", "featured_products", "product_carousel", "newsletter"]', '{"hero_banner": {"enabled": true, "position": 1}, "featured_products": {"enabled": true, "position": 2}, "product_carousel": {"enabled": true, "position": 3}, "newsletter": {"enabled": true, "position": 4}}', 1, '2025-10-05 04:59:26', '2025-10-05 04:59:26');

-- --------------------------------------------------------

--
-- Table structure for table `product_colors`
--

CREATE TABLE `product_colors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `color_name` varchar(100) NOT NULL,
  `color_code` varchar(20) DEFAULT NULL,
  `color_image` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_product_colors_product_id` (`product_id`),
  KEY `idx_product_colors_active` (`is_active`),
  CONSTRAINT `product_colors_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `product_colors`
--

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `image_url` text NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `is_primary`, `sort_order`, `created_at`) VALUES
(8, 24, 'https://api.praashibysupal.com/uploads/products/images-1759584943875-866183850.jpg', 1, 0, '2025-10-04 13:35:43'),
(9, 25, 'https://api.praashibysupal.com/uploads/products/images-1759585025775-441461137.jpg', 1, 0, '2025-10-04 13:37:05'),
(10, 26, 'https://api.praashibysupal.com/uploads/products/images-1759585536074-989538109.jpg', 1, 0, '2025-10-04 13:45:36'),
(11, 28, 'https://api.praashibysupal.com/uploads/products/images-1759658377086-673920112.jpg', 1, 0, '2025-10-05 09:59:37'),
(12, 46, 'https://api.praashibysupal.com/uploads/products/images-1759660648518-626708449.png', 1, 0, '2025-10-05 10:37:28'),
(14, 48, 'https://api.praashibysupal.com/uploads/products/images-1759663980201-940996360.jpg', 1, 0, '2025-10-05 11:33:00'),
(15, 49, 'https://api.praashibysupal.com/uploads/products/images-1759664011657-883408380.jpg', 1, 0, '2025-10-05 11:33:31'),
(16, 50, 'https://api.praashibysupal.com/uploads/products/images-1759664054955-260171752.jpg', 1, 0, '2025-10-05 11:34:14'),
(17, 51, 'https://api.praashibysupal.com/uploads/products/images-1759664148181-222118029.jpg', 1, 0, '2025-10-05 11:35:48'),
(18, 52, 'https://api.praashibysupal.com/uploads/products/images-1759664225027-74776756.jpg', 1, 0, '2025-10-05 11:37:05'),
(19, 53, 'https://api.praashibysupal.com/uploads/products/images-1759664307341-323430859.jpg', 1, 0, '2025-10-05 11:38:27'),
(20, 53, 'https://api.praashibysupal.com/uploads/products/images-1759664307341-176805921.jpg', 0, 1, '2025-10-05 11:38:27'),
(21, 54, 'https://api.praashibysupal.com/uploads/products/images-1759664469841-821047445.jpg', 1, 0, '2025-10-05 11:41:09'),
(22, 55, 'https://api.praashibysupal.com/uploads/products/images-1759664517882-870866369.jpg', 1, 0, '2025-10-05 11:41:57'),
(23, 56, 'https://api.praashibysupal.com/uploads/products/images-1759664555871-163453403.jpg', 1, 0, '2025-10-05 11:42:35'),
(24, 57, 'https://api.praashibysupal.com/uploads/products/images-1759664602223-540056735.jpg', 1, 0, '2025-10-05 11:43:22'),
(25, 58, 'https://api.praashibysupal.com/uploads/products/images-1759664790304-506266329.jpg', 1, 0, '2025-10-05 11:46:30'),
(26, 59, 'https://api.praashibysupal.com/uploads/products/images-1759664841397-359631437.jpg', 1, 0, '2025-10-05 11:47:21'),
(27, 60, 'https://api.praashibysupal.com/uploads/products/images-1759664900595-631578186.jpg', 1, 0, '2025-10-05 11:48:20'),
(28, 61, 'https://api.praashibysupal.com/uploads/products/images-1759665063951-708766356.jpg', 1, 0, '2025-10-05 11:51:03'),
(29, 62, 'https://api.praashibysupal.com/uploads/products/images-1759665210797-437215143.jpg', 1, 0, '2025-10-05 11:53:30'),
(30, 63, 'https://api.praashibysupal.com/uploads/products/images-1759665300554-472845622.jpg', 1, 0, '2025-10-05 11:55:00'),
(31, 64, 'https://api.praashibysupal.com/uploads/products/images-1759665437614-668416462.jpg', 1, 0, '2025-10-05 11:57:17'),
(32, 65, 'https://api.praashibysupal.com/uploads/products/images-1759665781049-475792112.jpg', 1, 0, '2025-10-05 12:03:01'),
(33, 66, 'https://api.praashibysupal.com/uploads/products/images-1759665937382-129721556.jpg', 1, 0, '2025-10-05 12:05:37'),
(35, 79, 'https://api.praashibysupal.com/uploads/products/images-1760119987914-990703976.jpg', 1, 0, '2025-10-10 18:13:07');

-- --------------------------------------------------------

--
-- Table structure for table `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `title` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `product_reviews`
--

-- --------------------------------------------------------

--
-- Table structure for table `product_videos`
--

CREATE TABLE `product_videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `video_url` text NOT NULL,
  `video_type` enum('file','youtube','vimeo','other') DEFAULT 'file',
  `thumbnail_url` text DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `duration` varchar(20) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_videos_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `product_videos`
--

-- --------------------------------------------------------

--
-- Table structure for table `stock_adjustments`
--

CREATE TABLE `stock_adjustments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `adjustment_number` varchar(100) NOT NULL,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `adjustment_type` enum('increase','decrease','set') NOT NULL,
  `quantity` int(11) NOT NULL,
  `reason` enum('damage','theft','found','correction','other') NOT NULL,
  `notes` text DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `adjustment_number` (`adjustment_number`),
  KEY `product_id` (`product_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `user_id` (`user_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `stock_adjustments_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_adjustments_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_adjustments_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_adjustments_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `stock_adjustments`
--

-- --------------------------------------------------------

--
-- Table structure for table `stock_levels`
--

CREATE TABLE `stock_levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `current_stock` int(11) DEFAULT 0,
  `reserved_stock` int(11) DEFAULT 0,
  `available_stock` int(11) GENERATED ALWAYS AS (`current_stock` - `reserved_stock`) STORED,
  `min_stock_level` int(11) DEFAULT 0,
  `max_stock_level` int(11) DEFAULT 0,
  `reorder_point` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_warehouse` (`product_id`,`warehouse_id`),
  KEY `idx_stock_levels_product` (`product_id`),
  KEY `idx_stock_levels_warehouse` (`warehouse_id`),
  CONSTRAINT `stock_levels_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_levels_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_levels`
--

INSERT INTO `stock_levels` (`id`, `product_id`, `warehouse_id`, `current_stock`, `reserved_stock`, `available_stock`, `min_stock_level`, `max_stock_level`, `reorder_point`, `last_updated`, `created_at`) VALUES
(5, 24, 1, 50, 0, 50, 10, 100, 20, '2025-10-05 04:39:50', '2025-10-05 04:39:50'),
(6, 24, 2, 50, 0, 50, 10, 100, 20, '2025-10-05 04:39:50', '2025-10-05 04:39:50'),
(7, 25, 1, 50, 0, 50, 10, 100, 20, '2025-10-05 04:39:50', '2025-10-05 04:39:50'),
(8, 25, 2, 50, 0, 50, 10, 100, 20, '2025-10-05 04:39:50', '2025-10-05 04:39:50'),
(9, 26, 1, 50, 0, 50, 10, 100, 20, '2025-10-05 04:39:50', '2025-10-05 04:39:50'),
(10, 26, 2, 50, 0, 50, 10, 100, 20, '2025-10-05 04:39:50', '2025-10-05 04:39:50');

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `movement_type` enum('in','out','transfer','adjustment','return') NOT NULL,
  `quantity` int(11) NOT NULL,
  `reference_type` enum('purchase','sale','transfer','adjustment','return','initial') NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_stock_movements_product` (`product_id`),
  KEY `idx_stock_movements_warehouse` (`warehouse_id`),
  KEY `idx_stock_movements_date` (`created_at`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_movements_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- No data in table `stock_movements`
--

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
