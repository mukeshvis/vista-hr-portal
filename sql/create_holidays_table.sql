-- Create holidays table in vis_company database
USE vis_company;

CREATE TABLE IF NOT EXISTS `holidays` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `holiday_name` VARCHAR(255) NOT NULL,
  `holiday_date` DATE NOT NULL,
  `holiday_type` VARCHAR(50) NOT NULL COMMENT 'national, company, religious, etc.',
  `description` TEXT NULL,
  `is_recurring` BOOLEAN NOT NULL DEFAULT FALSE,
  `status` INT NOT NULL DEFAULT 1,
  `created_by` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `company_id` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_holiday_date` (`holiday_date`),
  INDEX `idx_holiday_type` (`holiday_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample holidays
INSERT INTO `holidays` (`holiday_name`, `holiday_date`, `holiday_type`, `description`, `is_recurring`, `created_by`) VALUES
('New Year Day', '2024-01-01', 'national', 'Beginning of the new year', true, 'system'),
('Kashmir Day', '2024-02-05', 'national', 'Kashmir Solidarity Day', true, 'system'),
('Pakistan Day', '2024-03-23', 'national', 'Pakistan Resolution Day', true, 'system'),
('Labour Day', '2024-05-01', 'national', 'International Workers Day', true, 'system'),
('Independence Day', '2024-08-14', 'national', 'Pakistan Independence Day', true, 'system'),
('Iqbal Day', '2024-11-09', 'national', 'Birthday of Allama Iqbal', true, 'system'),
('Quaid-e-Azam Birthday', '2024-12-25', 'national', 'Birthday of Muhammad Ali Jinnah', true, 'system');

-- Insert some sample holidays for 2025
INSERT INTO `holidays` (`holiday_name`, `holiday_date`, `holiday_type`, `description`, `is_recurring`, `created_by`) VALUES
('New Year Day', '2025-01-01', 'national', 'Beginning of the new year', true, 'system'),
('Kashmir Day', '2025-02-05', 'national', 'Kashmir Solidarity Day', true, 'system'),
('Pakistan Day', '2025-03-23', 'national', 'Pakistan Resolution Day', true, 'system'),
('Labour Day', '2025-05-01', 'national', 'International Workers Day', true, 'system'),
('Independence Day', '2025-08-14', 'national', 'Pakistan Independence Day', true, 'system'),
('Iqbal Day', '2025-11-09', 'national', 'Birthday of Allama Iqbal', true, 'system'),
('Quaid-e-Azam Birthday', '2025-12-25', 'national', 'Birthday of Muhammad Ali Jinnah', true, 'system');

SELECT 'Holidays table created successfully!' AS message;