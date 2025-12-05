-- Create contact_messages table for storing contact form submissions
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `subject` VARCHAR(255) DEFAULT 'General Inquiry',
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'read', 'responded', 'archived') DEFAULT 'new',
  `is_read` TINYINT(1) DEFAULT 0,
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  `assigned_to` INT(11) DEFAULT NULL,
  `response_notes` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `responded_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `status` ENUM('subscribed', 'unsubscribed', 'bounced') DEFAULT 'subscribed',
  `source` VARCHAR(100) DEFAULT 'website',
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unsubscribed_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample contact messages for testing
INSERT INTO `contact_messages` (`name`, `email`, `phone`, `subject`, `message`, `status`, `priority`, `created_at`)
SELECT * FROM (SELECT 
  'Rajesh Kumar' AS name,
  'rajesh.kumar@example.com' AS email,
  '+91 98765 43210' AS phone,
  'Product Inquiry' AS subject,
  'I am interested in your Victorian jewelry collection. Can you provide more details about the materials used?' AS message,
  'new' AS status,
  'normal' AS priority,
  NOW() - INTERVAL 2 DAY AS created_at
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `contact_messages` WHERE `email` = 'rajesh.kumar@example.com')
LIMIT 1;

INSERT INTO `contact_messages` (`name`, `email`, `phone`, `subject`, `message`, `status`, `priority`, `is_read`, `created_at`)
SELECT * FROM (SELECT 
  'Priya Sharma' AS name,
  'priya.sharma@example.com' AS email,
  '+91 87654 32109' AS phone,
  'Order Support' AS subject,
  'I placed an order #ORD-12345 yesterday but haven\'t received any confirmation email yet. Please help!' AS message,
  'read' AS status,
  'high' AS priority,
  1 AS is_read,
  NOW() - INTERVAL 1 DAY AS created_at
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `contact_messages` WHERE `email` = 'priya.sharma@example.com')
LIMIT 1;

INSERT INTO `contact_messages` (`name`, `email`, `phone`, `subject`, `message`, `status`, `priority`, `created_at`)
SELECT * FROM (SELECT 
  'Amit Patel' AS name,
  'amit.patel@example.com' AS email,
  NULL AS phone,
  'Custom Design Request' AS subject,
  'I would like to order a custom Victorian necklace set for my sister\'s wedding. Could you please share the process and pricing details?' AS message,
  'new' AS status,
  'high' AS priority,
  NOW() - INTERVAL 3 HOUR AS created_at
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `contact_messages` WHERE `email` = 'amit.patel@example.com')
LIMIT 1;
