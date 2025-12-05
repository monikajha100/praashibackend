-- Migration: Ensure users table has all required columns
-- Run this SQL in your MySQL database
-- This ensures the users table exists with all necessary columns

-- ============================================
-- 1. CREATE USERS TABLE (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `is_active` TINYINT(1) DEFAULT 1,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `pincode` VARCHAR(10) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. ADD MISSING COLUMNS (only if they don't exist)
-- ============================================
SET @dbname = DATABASE();
SET @tablename = 'users';

-- Add name if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'name');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN name VARCHAR(100) NOT NULL AFTER id;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add email if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'email');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN email VARCHAR(100) NOT NULL UNIQUE AFTER name;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add password if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'password');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL AFTER email;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add phone if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'phone');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER password;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add role if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'role');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN role ENUM(\'user\', \'admin\') DEFAULT \'user\' AFTER phone;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add is_active if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'is_active');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER role;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add address if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'address');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL AFTER is_active;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add city if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'city');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN city VARCHAR(100) DEFAULT NULL AFTER address;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add state if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'state');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN state VARCHAR(100) DEFAULT NULL AFTER city;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add pincode if missing
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'pincode');
SET @preparedStatement = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN pincode VARCHAR(10) DEFAULT NULL AFTER state;',
  'SELECT 1;');
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 3. ADD INDEXES (if missing)
-- ============================================
ALTER TABLE `users`
  ADD INDEX IF NOT EXISTS `idx_email` (`email`),
  ADD INDEX IF NOT EXISTS `idx_role` (`role`),
  ADD INDEX IF NOT EXISTS `idx_is_active` (`is_active`);

SELECT 'Users table migration completed! Check for any error messages above.' AS result;

