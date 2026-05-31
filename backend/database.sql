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
  `currentEmail`    VARCHAR(255)   DEFAULT '',
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

-- ------------------------------------------------------------
--  Table: saved_db_configs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `saved_db_configs` (
  `id`                 INT AUTO_INCREMENT PRIMARY KEY,
  `alias_name`         VARCHAR(255) NOT NULL,
  `host`               VARCHAR(255) NOT NULL,
  `port`               VARCHAR(50)  DEFAULT '3306',
  `db_username`        VARCHAR(255) NOT NULL,
  `encrypted_password` TEXT         NOT NULL,
  `iv`                 VARCHAR(255) NOT NULL,
  `created_by`         VARCHAR(255) NOT NULL,
  `created_at`         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  Table: employee_db_profiles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_db_profiles` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `mysql_username` VARCHAR(255) UNIQUE NOT NULL,
  `employee_name`  VARCHAR(255) NOT NULL,
  `department`     VARCHAR(100) DEFAULT '',
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  Table: servers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `servers` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `name`             VARCHAR(255) NOT NULL,
  `server_type`      ENUM('internal', 'external') NOT NULL,
  `cpu_cores`        VARCHAR(255) DEFAULT '',
  `ram`              VARCHAR(255) DEFAULT '',
  `root_disk`        VARCHAR(255) DEFAULT '',
  `ip_address`       VARCHAR(255) DEFAULT '',
  `os`               VARCHAR(255) DEFAULT '',
  `current_version`  VARCHAR(255) DEFAULT '',
  `php_version`      VARCHAR(255) DEFAULT '',
  `mariadb_version`  VARCHAR(255) DEFAULT '',
  `apache_version`   VARCHAR(255) DEFAULT '',
  `status`           ENUM('active', 'inactive') DEFAULT 'active',
  `last_update_date` DATE NULL,
  `next_update_date` DATE NULL,
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  Table: server_disks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `server_disks` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `server_id`   INT NOT NULL,
  `mount_point` VARCHAR(255) NOT NULL,
  `disk_size`   VARCHAR(255) NOT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  Table: server_updates
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `server_updates` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `server_id`        INT NOT NULL,
  `update_date`      DATE NOT NULL,
  `next_update_date` DATE NOT NULL,
  `update_type`      VARCHAR(255) NOT NULL,
  `updated_by`       VARCHAR(255) NOT NULL,
  `notes`            TEXT,
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

