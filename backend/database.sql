-- ============================================================
--  Manage Service DB - Database & Table Setup
--  Import this file via phpMyAdmin to create all tables.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `manage_service_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `manage_service_db`;

-- ------------------------------------------------------------
--  Table: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `username`      VARCHAR(255) UNIQUE NOT NULL,
  `name`          VARCHAR(255) NOT NULL DEFAULT '',
  `email`         VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          VARCHAR(50)  DEFAULT 'admin',
  `is_active`     BOOLEAN      DEFAULT TRUE,
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  Table: laptops
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `laptops` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `model`           VARCHAR(255)   NOT NULL,
  `serialNo`        VARCHAR(255)   UNIQUE NOT NULL,
  `status`          VARCHAR(50)    NOT NULL,
  `currentUserName` VARCHAR(255)   DEFAULT '',
  `handoverDate`    VARCHAR(50)    DEFAULT '',
  `department`      VARCHAR(100)   DEFAULT '',
  `comments`        TEXT,
  `dateOfDelivery`  VARCHAR(50)    DEFAULT '',
  `vendorName`      VARCHAR(255)   DEFAULT '',
  `hrRefNumber`     VARCHAR(255)   DEFAULT '',
  `ratePerMonth`    DECIMAL(10,2)  DEFAULT 0.00,
  `windowsLicense`  BOOLEAN        DEFAULT FALSE,
  `msOfficePackage` BOOLEAN        DEFAULT FALSE,
  `adminAccountEnabled` BOOLEAN    DEFAULT TRUE,
  `massStorageDisabled` BOOLEAN    DEFAULT TRUE,
  `created_at`      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  Table: laptop_history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `laptop_history` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `laptopId`    INT          NOT NULL,
  `laptopModel` VARCHAR(255) NOT NULL,
  `serialNo`    VARCHAR(255) NOT NULL,
  `action`      VARCHAR(100) NOT NULL,
  `fromUser`    VARCHAR(255) DEFAULT '',
  `toUser`      VARCHAR(255) DEFAULT '',
  `department`  VARCHAR(100) DEFAULT '',
  `actionDate`  VARCHAR(50)  DEFAULT '',
  `comments`    TEXT,
  `performedBy` VARCHAR(255) NOT NULL,
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`laptopId`) REFERENCES `laptops`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
