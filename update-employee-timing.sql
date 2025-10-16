-- Update Employee Working Hours for Specific Employees (8 AM to 6 PM)
-- Employee pin_auto IDs: 13, 14, 45, 1691479623873, 1691479623595

-- Step 1: Check if 8 AM to 6 PM policy exists
SELECT * FROM working_hours_policy
WHERE start_working_hours_time = '08:00'
AND end_working_hours_time = '18:00';

-- Step 2: Create the policy if it doesn't exist (run this if no policy found above)
INSERT INTO working_hours_policy (
    company_id,
    working_hours_policy,
    repoting_time,
    start_working_hours_time,
    end_working_hours_time,
    working_hours_grace_time,
    half_day_time,
    username,
    date,
    time,
    status
) VALUES (
    1,
    '8 AM to 6 PM (10 hours)',
    '08:00',
    '08:00',
    '18:00',
    15,
    '13:00',
    'system',
    CURDATE(),
    CURTIME(),
    1
);

-- Step 3: Get the policy ID (after creation or if it exists)
SET @policy_id = (SELECT id FROM working_hours_policy
                  WHERE start_working_hours_time = '08:00'
                  AND end_working_hours_time = '18:00'
                  LIMIT 1);

-- Step 4: Find employees with the given pin_auto IDs from external_employees
SELECT e.id, e.emp_id, e.emp_name, ext.pin_auto, ext.pin_manual
FROM employee e
LEFT JOIN external_employees ext ON e.emp_id = ext.pin_manual
WHERE ext.pin_auto IN ('13', '14', '45', '1691479623873', '1691479623595');

-- Step 5: Update the working_hours_policy_id for these employees
UPDATE employee e
JOIN external_employees ext ON e.emp_id = ext.pin_manual
SET e.working_hours_policy_id = @policy_id
WHERE ext.pin_auto IN ('13', '14', '45', '1691479623873', '1691479623595');

-- Step 6: Verify the update
SELECT e.id, e.emp_id, e.emp_name, ext.pin_auto, e.working_hours_policy_id, whp.working_hours_policy
FROM employee e
JOIN external_employees ext ON e.emp_id = ext.pin_manual
LEFT JOIN working_hours_policy whp ON e.working_hours_policy_id = whp.id
WHERE ext.pin_auto IN ('13', '14', '45', '1691479623873', '1691479623595');
