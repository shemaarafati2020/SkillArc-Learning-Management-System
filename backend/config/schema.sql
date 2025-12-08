-- Learning Management System Database Schema
CREATE DATABASE IF NOT EXISTS lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lms_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
    avatar_url VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    institution VARCHAR(150) DEFAULT NULL,
    language_preference VARCHAR(10) DEFAULT 'en',
    theme_preference ENUM('light', 'dark') DEFAULT 'light',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(255) DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    level ENUM('beginner', 'intermediate', 'advanced', 'all-levels') DEFAULT 'all-levels',
    language VARCHAR(50) DEFAULT 'English',
    duration_hours DECIMAL(6,2) DEFAULT 0.00,
    price DECIMAL(10,2) DEFAULT 0.00,
    prerequisites TEXT DEFAULT NULL,
    learning_outcomes TEXT DEFAULT NULL,
    tags VARCHAR(500) DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    type ENUM('cohort', 'self-paced') DEFAULT 'self-paced',
    status ENUM('draft', 'pending', 'published', 'archived') DEFAULT 'draft',
    max_students INT DEFAULT NULL,
    passing_percentage DECIMAL(5,2) DEFAULT 60.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_instructor (instructor_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_level (level)
) ENGINE=InnoDB;

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    module_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT NULL,
    order_index INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_course (course_id)
) ENGINE=InnoDB;

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    lesson_id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT NULL,
    content_type ENUM('video', 'pdf', 'text', 'quiz') NOT NULL,
    content_url VARCHAR(500) DEFAULT NULL,
    content_text LONGTEXT DEFAULT NULL,
    duration_minutes INT DEFAULT NULL,
    order_index INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE,
    INDEX idx_module (module_id)
) ENGINE=InnoDB;

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    enroll_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    progress_percent DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id),
    INDEX idx_user (user_id),
    INDEX idx_course (course_id)
) ENGINE=InnoDB;

-- Lesson progress
CREATE TABLE IF NOT EXISTS lesson_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    UNIQUE KEY unique_progress (user_id, lesson_id)
) ENGINE=InnoDB;

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    assign_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATETIME DEFAULT NULL,
    max_score DECIMAL(6,2) DEFAULT 100.00,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_course (course_id)
) ENGINE=InnoDB;

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    sub_id INT AUTO_INCREMENT PRIMARY KEY,
    assign_id INT NOT NULL,
    student_id INT NOT NULL,
    file_url VARCHAR(500) DEFAULT NULL,
    text_content TEXT DEFAULT NULL,
    score DECIMAL(6,2) DEFAULT NULL,
    feedback TEXT DEFAULT NULL,
    status ENUM('submitted', 'graded', 'returned') DEFAULT 'submitted',
    plagiarism_score DECIMAL(5,2) DEFAULT NULL,
    plagiarism_flag BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    graded_by INT DEFAULT NULL,
    FOREIGN KEY (assign_id) REFERENCES assignments(assign_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_assignment (assign_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB;

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT DEFAULT NULL,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT NULL,
    duration_minutes INT DEFAULT 30,
    passing_score DECIMAL(5,2) DEFAULT 60.00,
    max_attempts INT DEFAULT 3,
    shuffle_questions BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_course (course_id)
) ENGINE=InnoDB;

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    q_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer') NOT NULL,
    options_json JSON DEFAULT NULL,
    correct_answer TEXT DEFAULT NULL,
    points DECIMAL(5,2) DEFAULT 1.00,
    order_index INT DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    INDEX idx_quiz (quiz_id)
) ENGINE=InnoDB;

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    score DECIMAL(6,2) DEFAULT NULL,
    total_points DECIMAL(6,2) DEFAULT NULL,
    percentage DECIMAL(5,2) DEFAULT NULL,
    passed BOOLEAN DEFAULT FALSE,
    time_spent_seconds INT DEFAULT NULL,
    is_suspicious BOOLEAN DEFAULT FALSE,
    suspicious_reason TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_quiz (quiz_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB;

-- Quiz answers
CREATE TABLE IF NOT EXISTS quiz_answers (
    answer_id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT DEFAULT NULL,
    is_correct BOOLEAN DEFAULT NULL,
    points_earned DECIMAL(5,2) DEFAULT 0.00,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(attempt_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(q_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    cert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    certificate_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    pdf_url VARCHAR(500) DEFAULT NULL,
    final_grade DECIMAL(5,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cert (user_id, course_id)
) ENGINE=InnoDB;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notif_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'grade', 'deadline', 'announcement') DEFAULT 'info',
    link VARCHAR(500) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read)
) ENGINE=InnoDB;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50) DEFAULT NULL,
    target_id INT DEFAULT NULL,
    old_values JSON DEFAULT NULL,
    new_values JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action)
) ENGINE=InnoDB;

-- Discussion forums
CREATE TABLE IF NOT EXISTS forums (
    forum_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Forum threads
CREATE TABLE IF NOT EXISTS forum_threads (
    thread_id INT AUTO_INCREMENT PRIMARY KEY,
    forum_id INT NOT NULL,
    user_id INT NOT NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forum_id) REFERENCES forums(forum_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Forum replies
CREATE TABLE IF NOT EXISTS forum_replies (
    reply_id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES forum_threads(thread_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL
) ENGINE=InnoDB;

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_name', 'UniLearn LMS', 'Name of the learning platform'),
('max_file_upload_mb', '50', 'Maximum file upload size in MB'),
('plagiarism_threshold', '30', 'Plagiarism detection threshold percentage');

-- Insert default admin (password: Admin@123)
INSERT INTO users (name, email, password, role, is_active) VALUES
('System Admin', 'admin@lms.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE);
