-- First, let's clean up existing test users
DELETE FROM users WHERE username IN (
    'admin',
    'ceo',
    'gm',
    'nsm',
    'purchasing',
    'accounting',
    'finance',
    'audit',
    'branch1',
    'branch2'
);

-- Insert users for each role
-- Note: Passwords are 'password123' - they should be changed on first login in production

-- Management Users
INSERT INTO users (username, password, role, name, email, "branchId", "isActive", "createdAt", "updatedAt") VALUES
('admin', '$2b$10$bdYrrFpDH5LyXBwgzfYk0.Wo4/L8V0CW6Qh6IoOoAVAMPQ5Z4jLVK', 'gm', 'System Administrator', 'admin@primemotors.com', NULL, true, NOW(), NOW()),
('ceo', '$2b$10$bdYrrFpDH5LyXBwgzfYk0.Wo4/L8V0CW6Qh6IoOoAVAMPQ5Z4jLVK', 'ceo', 'Chief Executive Officer', 'ceo@primemotors.com', NULL, true, NOW(), NOW()),
('gm', '$2b$10$bdYrrFpDH5LyXBwgzfYk0.Wo4/L8V0CW6Qh6IoOoAVAMPQ5Z4jLVK', 'gm', 'General Manager', 'gm@primemotors.com', NULL, true, NOW(), NOW()),
('nsm', '$2b$10$bdYrrFpDH5LyXBwgzfYk0.Wo4/L8V0CW6Qh6IoOoAVAMPQ5Z4jLVK', 'nsm', 'National Sales Manager', 'nsm@primemotors.com', NULL, true, NOW(), NOW());

-- Department Heads
INSERT INTO users (username, password, role, name, email, "branchId", "isActive", "createdAt", "updatedAt") VALUES
('purchasing', '$2b$10$bdYrrFpDH5LyXBwgzfYk0.Wo4/L8V0CW6Qh6IoOoAVAMPQ5Z4jLVK', 'purchasing', 'Purchasing Manager', 'purchasing@primemotors.com', NULL, true, NOW(), NOW()),
('accounting', '$2b$10$bdYrrFpDH5LyXBwgzfYk0.Wo4/L8V0CW6Qh6IoOoAVAMPQ5Z4jLVK', 'accounting', 'Accounting Manager', 'accounting@primemotors.com', NULL, true, NOW(), NOW()),
('finance', '$2b$10$bdYrrFpDH5LyXBwgzfYk0.Wo4/L8V0CW6Qh6IoOoAVAMPQ5Z4jLVK', 'finance', 'Finance Manager', 'finance@primemotors.com', NULL, true, NOW(), NOW()),
('audit', '$2b$10$bdYrrFpDH5LyXBwgzfYk0.Wo4/L8V0CW6Qh6IoOoAVAMPQ5Z4jLVK', 'audit', 'Audit Manager', 'audit@primemotors.com', NULL, true, NOW(), NOW());

-- Branch Users (only branch 1 for now)
INSERT INTO users (username, password, role, name, email, "branchId", "isActive", "createdAt", "updatedAt") VALUES
('branch1', '$2b$10$bdYrrFpDH5LyXBwgzfYk0.Wo4/L8V0CW6Qh6IoOoAVAMPQ5Z4jLVK', 'branch', 'Branch 1 Manager', 'branch1@primemotors.com', 1, true, NOW(), NOW());
