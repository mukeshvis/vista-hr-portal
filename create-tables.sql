-- Create user_attendance table
CREATE TABLE IF NOT EXISTS `user_attendance` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(50) NOT NULL,
  `state` VARCHAR(20) NOT NULL COMMENT 'Check In or Check Out',
  `punch_time` DATETIME NOT NULL,
  `verify_mode` VARCHAR(50) NULL,
  `source` VARCHAR(50) NULL COMMENT 'external_api or manual',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `user_attendance_user_id_idx` (`user_id`),
  INDEX `user_attendance_punch_time_idx` (`punch_time`),
  INDEX `user_attendance_state_idx` (`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create external_employees table
CREATE TABLE IF NOT EXISTS `external_employees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pin_manual` VARCHAR(50) NULL,
  `pin_auto` VARCHAR(50) NOT NULL UNIQUE,
  `user_name` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NULL,
  `privilege` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `external_employees_pin_auto_key` (`pin_auto`),
  INDEX `external_employees_pin_auto_idx` (`pin_auto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
