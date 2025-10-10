-- Alter Remote Work Application Table to support date ranges
-- Add from_date, to_date, and number_of_days columns
-- Keep the original date column for backward compatibility

ALTER TABLE `remote_application`
ADD COLUMN `from_date` DATE NULL COMMENT 'Start date of remote work period' AFTER `employee_name`,
ADD COLUMN `to_date` DATE NULL COMMENT 'End date of remote work period' AFTER `from_date`,
ADD COLUMN `number_of_days` INT NOT NULL DEFAULT 1 COMMENT 'Number of working days (excluding weekends)' AFTER `to_date`,
ADD INDEX `idx_from_date` (`from_date`),
ADD INDEX `idx_to_date` (`to_date`);

-- Migrate existing data: copy date to from_date and to_date
UPDATE `remote_application`
SET `from_date` = `date`,
    `to_date` = `date`,
    `number_of_days` = 1
WHERE `from_date` IS NULL;

-- Now make from_date and to_date NOT NULL since all rows have been migrated
ALTER TABLE `remote_application`
MODIFY COLUMN `from_date` DATE NOT NULL COMMENT 'Start date of remote work period',
MODIFY COLUMN `to_date` DATE NOT NULL COMMENT 'End date of remote work period';

-- Update the date column comment to mark it as deprecated
ALTER TABLE `remote_application`
MODIFY COLUMN `date` DATE NOT NULL COMMENT '[DEPRECATED - use from_date/to_date] Date for which remote work is requested';
