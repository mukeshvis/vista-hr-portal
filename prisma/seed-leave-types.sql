-- Insert basic leave types
INSERT INTO leave_type (leave_type_name, status, username, date, time, company_id) VALUES
('Annual Leave', 1, 'admin', CURDATE(), CURTIME(), 1),
('Sick Leave', 1, 'admin', CURDATE(), CURTIME(), 1),
('Emergency Leave', 1, 'admin', CURDATE(), CURTIME(), 1),
('Casual Leave', 1, 'admin', CURDATE(), CURTIME(), 1),
('Medical Leave', 1, 'admin', CURDATE(), CURTIME(), 1);
