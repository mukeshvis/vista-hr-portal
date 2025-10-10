-- Remote Work Application Table
-- Tracks remote work requests by employees
-- Rules:
--   - Max 4 remote days in 6 months
--   - Max 2 remote days in 1 month
--   - Only permanent employees can apply

CREATE TABLE IF NOT EXISTS `remote_application` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `emp_id` VARCHAR(50) NOT NULL COMMENT 'Employee ID from employee table',
  `employee_name` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL COMMENT 'Date for which remote work is requested',
  `reason` TEXT NULL COMMENT 'Reason for remote work request',
  `application_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When application was submitted',
  `approval_status` VARCHAR(50) NOT NULL DEFAULT 'Pending' COMMENT 'Pending, Approved, Rejected',
  `approved` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0=Pending, 1=Approved, 2=Rejected',
  `approved_by` VARCHAR(50) NULL COMMENT 'Manager/HR who approved/rejected',
  `approved_date` DATETIME NULL COMMENT 'When it was approved/rejected',
  `rejection_reason` TEXT NULL COMMENT 'Reason if rejected',
  `manager_id` INT NULL COMMENT 'Reporting manager ID',
  `manager_name` VARCHAR(255) NULL COMMENT 'Manager name for display',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Active, -1=Deleted',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_emp_id` (`emp_id`),
  INDEX `idx_date` (`date`),
  INDEX `idx_approval_status` (`approval_status`),
  INDEX `idx_approved` (`approved`),
  INDEX `idx_application_date` (`application_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Remote work applications by employees';
