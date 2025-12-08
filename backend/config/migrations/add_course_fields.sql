-- Migration: Add new fields to courses table
-- Run this if you already have an existing courses table

USE lms_db;

-- Add new columns if they don't exist
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS level ENUM('beginner', 'intermediate', 'advanced', 'all-levels') DEFAULT 'all-levels' AFTER category,
ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English' AFTER level,
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(6,2) DEFAULT 0.00 AFTER language,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00 AFTER duration_hours,
ADD COLUMN IF NOT EXISTS prerequisites TEXT DEFAULT NULL AFTER price,
ADD COLUMN IF NOT EXISTS learning_outcomes TEXT DEFAULT NULL AFTER prerequisites,
ADD COLUMN IF NOT EXISTS tags VARCHAR(500) DEFAULT NULL AFTER learning_outcomes,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00 AFTER passing_percentage,
ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0 AFTER average_rating;

-- Add indexes for better query performance
ALTER TABLE courses
ADD INDEX IF NOT EXISTS idx_category (category),
ADD INDEX IF NOT EXISTS idx_level (level);

-- Update existing courses to have default values
UPDATE courses SET 
    level = 'all-levels' WHERE level IS NULL,
    language = 'English' WHERE language IS NULL,
    duration_hours = 0.00 WHERE duration_hours IS NULL,
    price = 0.00 WHERE price IS NULL,
    average_rating = 0.00 WHERE average_rating IS NULL,
    total_reviews = 0 WHERE total_reviews IS NULL;
