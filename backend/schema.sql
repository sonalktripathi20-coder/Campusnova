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
    status ENUM('Submitted', 'Seen', 'In Progress', 'Escalated', 'Resolved', 'Closed') DEFAULT 'Submitted',
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

-- ========================================================
-- PRE-SEEDED DEMO USERS DATA
-- ========================================================

INSERT INTO users (id, email, password, name, role, department, avatar) VALUES
('usr-s1', 'sonal@student.edu', 'Sonal@123', 'Sonal Tripathi', 'student', NULL, 'ST'),
('usr-s2', 'kumkum@student.edu', 'Kumkum@123', 'Kumkum Sen', 'student', NULL, 'KS'),
('usr-s3', 'roshan@student.edu', 'Roshan@123', 'Roshan Kumar', 'student', NULL, 'RK'),

('usr-t1', 'kashif@teacher.edu', 'Kashif@123', 'Prof. Kashif Sheikh', 'teacher', 'Lecturer / ERP / Marks', 'KS'),
('usr-t2', 'maintenance@teacher.edu', 'Maintain@123', 'Maintenance Team', 'teacher', 'Maintenance', 'MT'),
('usr-t3', 'grievance@teacher.edu', 'Grievance@123', 'Grievance Team', 'teacher', 'Harassment', 'GT'),

('usr-h1', 'hod@college.edu', 'Hod@123', 'Dr. Anand Verma (HOD)', 'hod', NULL, 'AV'),
('usr-a1', 'admin@college.edu', 'Admin@123', 'Director Sarah (Admin)', 'admin', NULL, 'DS')
ON DUPLICATE KEY UPDATE id=id;
