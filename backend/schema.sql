-- ========================================================
-- SMART GRIEVANCE PORTAL DATABASE SCHEMA (MySQL)
-- ========================================================

CREATE DATABASE IF NOT EXISTS smart_grievance_db;
USE smart_grievance_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Stored securely (in prod, hashed)
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'hod', 'teacher', 'student') NOT NULL,
    department VARCHAR(100) DEFAULT NULL, -- For teachers: Lecturer / ERP / Marks, Maintenance, Harassment
    avatar VARCHAR(5) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(50) PRIMARY KEY, -- e.g. GRV-1001
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('Lecturer / ERP / Marks', 'Maintenance', 'Harassment') NOT NULL,
    status ENUM('Submitted', 'Seen', 'In Progress', 'Escalated', 'Resolved', 'Closed', 'Pending HOD Verification', 'Returned For Rework', 'Verified & Closed') DEFAULT 'Submitted',
    anonymous BOOLEAN DEFAULT FALSE,
    protected_identity BOOLEAN DEFAULT FALSE,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    student_email VARCHAR(100) NOT NULL,
    assigned_teacher_id VARCHAR(50) NOT NULL,
    assigned_teacher_name VARCHAR(100) NOT NULL,
    support_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    escalation_timer_ends TIMESTAMP NOT NULL,
    
    -- Operational & Supervision Fields
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    is_emergency BOOLEAN DEFAULT FALSE,
    rapid_response_assigned BOOLEAN DEFAULT FALSE,
    is_frozen BOOLEAN DEFAULT FALSE,
    hod_notes TEXT DEFAULT NULL,
    warnings TEXT DEFAULT NULL, -- JSON serialized array
    clarification_requests TEXT DEFAULT NULL, -- JSON serialized array
    disciplinary_actions TEXT DEFAULT NULL, -- JSON serialized array
    resolution_overrides TEXT DEFAULT NULL, -- JSON serialized array
    escalated_to_admin BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT DEFAULT NULL,
    escalation_severity VARCHAR(50) DEFAULT NULL,
    escalation_urgency_notes TEXT DEFAULT NULL,
    
    -- Resolution fields
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    resolved_by VARCHAR(100) DEFAULT NULL,
    resolution_details TEXT DEFAULT NULL,
    resolution_remarks TEXT DEFAULT NULL,
    
    -- Student Feedback
    feedback_rating INT DEFAULT NULL, -- 1 to 5 stars
    feedback_comment TEXT DEFAULT NULL,
    reopened_count INT DEFAULT 0,
    
    -- Attachments (comma-separated string or reference)
    attachments TEXT DEFAULT NULL,

    FOREIGN KEY (assigned_teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Upvotes / Support Complaints Table
CREATE TABLE IF NOT EXISTS supported_complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_support (complaint_id, student_id),
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL,
    complaint_title VARCHAR(255) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_role VARCHAR(20) DEFAULT NULL,
    recipient_id VARCHAR(50) DEFAULT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    complaint_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- 6. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- 7. Internal Notes Table
CREATE TABLE IF NOT EXISTS internal_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- 8. Escalation Logs Table
CREATE TABLE IF NOT EXISTS escalation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL,
    escalated_from VARCHAR(100),
    escalated_to VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- 9. Teacher Performance Table
CREATE TABLE IF NOT EXISTS teacher_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL,
    resolved_count INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    sla_adherence_rate DECIMAL(5,2) DEFAULT 100.00,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Security Logs Table
CREATE TABLE IF NOT EXISTS security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    status VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- PRE-SEEDED DEMO USERS DATA
-- ========================================================

INSERT INTO users (id, email, password, name, role, department, avatar) VALUES
('usr-s1', 'sonal@student.edu', 'password123', 'Sonal Tripathi', 'student', NULL, 'ST'),
('usr-s2', 'kumkum@student.edu', 'password123', 'Kumkum Sen', 'student', NULL, 'KS'),
('usr-s3', 'roshan@student.edu', 'password123', 'Roshan Kumar', 'student', NULL, 'RK'),

('usr-t1', 'academics@teacher.edu', 'password123', 'Prof. Kashif Sheikh', 'teacher', 'Lecturer / ERP / Marks', 'KS'),
('usr-t2', 'maintenance@teacher.edu', 'password123', 'Maintenance Team', 'teacher', 'Maintenance', 'MT'),
('usr-t3', 'grievance@teacher.edu', 'password123', 'Grievance Team', 'teacher', 'Harassment', 'GT'),

('usr-h1', 'hod@college.edu', 'password123', 'Dr. Anand Verma (HOD)', 'hod', NULL, 'AV'),
('usr-a1', 'admin@college.edu', 'password123', 'Director Sarah (Admin)', 'admin', NULL, 'DS')
ON DUPLICATE KEY UPDATE id=id;

-- ========================================================
-- PRE-SEEDED DEMO COMPLAINTS DATA
-- ========================================================

INSERT INTO complaints (id, title, description, category, status, anonymous, protected_identity, student_id, student_name, student_email, assigned_teacher_id, assigned_teacher_name, support_count, escalation_timer_ends, priority, is_emergency, rapid_response_assigned, is_frozen, hod_notes) VALUES
('GRV-1001', 'Hostel Wifi SLA Breach - Blocks C & D', 'Wifi router in Hostel Block C and D is down for more than 48 hours. No support ticket response from the network admin team.', 'Maintenance', 'In Progress', FALSE, FALSE, 'usr-s1', 'Sonal Tripathi', 'sonal@student.edu', 'usr-t2', 'Maintenance Team', 5, DATE_ADD(NOW(), INTERVAL 1 DAY), 'High', FALSE, FALSE, FALSE, NULL),
('GRV-1002', 'Marks discrepancy in end-semester DBMS lab exam', 'My end semester DBMS lab marks are displayed as AB (Absent) in the ERP portal, even though I attended the lab exam and submitted the viva sheet to the external examiner.', 'Lecturer / ERP / Marks', 'Pending HOD Verification', FALSE, TRUE, 'usr-s2', 'Kumkum Sen', 'kumkum@student.edu', 'usr-t1', 'Prof. Kashif Sheikh', 1, DATE_ADD(NOW(), INTERVAL 12 HOUR), 'Medium', FALSE, FALSE, FALSE, 'Instructed teacher to review the physical external viva sheet.'),
('GRV-1003', 'Library Air Conditioning System Out of Order', 'The AC units on the 2nd floor library reading room are malfunctioning. It gets extremely hot and humid during peak study hours.', 'Maintenance', 'Submitted', TRUE, FALSE, 'usr-s3', 'Roshan Kumar', 'roshan@student.edu', 'usr-t2', 'Maintenance Team', 12, DATE_ADD(NOW(), INTERVAL 6 HOUR), 'Critical', TRUE, TRUE, FALSE, NULL)
ON DUPLICATE KEY UPDATE id=id;
