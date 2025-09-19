-- Smart Productivity Dashboard - Database Setup
-- MySQL Database Schema

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS productivity_dashboard;
USE productivity_dashboard;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  calendar_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  deadline DATETIME,
  completed BOOLEAN DEFAULT FALSE,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_by INT,
  assigned_to INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Create focus_sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  duration INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert sample data for demo purposes
INSERT IGNORE INTO users (username, email) VALUES
('Alice_Designer', 'alice@example.com'),
('Bob_Developer', 'bob@example.com'),
('Charlie_PM', 'charlie@example.com');

-- Insert sample tasks
INSERT IGNORE INTO tasks (title, description, deadline, priority, created_by, assigned_to) VALUES
('Design user interface mockups', 'Create wireframes and mockups for the productivity dashboard', '2025-09-25 17:00:00', 'high', 1, 1),
('Implement user authentication', 'Add login/logout functionality with session management', '2025-09-24 12:00:00', 'high', 2, 2),
('Set up database schema', 'Create MySQL tables and relationships for the application', '2025-09-22 15:00:00', 'medium', 2, 2),
('Write project documentation', 'Create comprehensive README and API documentation', '2025-09-26 10:00:00', 'medium', 3, 3),
('Test real-time features', 'Verify socket.io functionality and multi-user collaboration', '2025-09-23 14:00:00', 'low', 1, 2);

-- Mark some tasks as completed for demo data
UPDATE tasks SET completed = TRUE, completed_at = NOW() WHERE id IN (3);

-- Insert sample focus sessions
INSERT IGNORE INTO focus_sessions (user_id, duration, completed) VALUES
(1, 25, TRUE),
(2, 45, TRUE),
(1, 25, FALSE),
(3, 60, TRUE);

-- Insert sample activity log entries
INSERT IGNORE INTO activity_log (user_id, action, details) VALUES
(1, 'task_created', 'Created task: Design user interface mockups'),
(2, 'task_created', 'Created task: Implement user authentication'),
(2, 'task_completed', 'Completed task: Set up database schema'),
(1, 'focus_started', 'Started 25 minute focus session'),
(1, 'focus_completed', 'Completed focus session'),
(3, 'task_created', 'Created task: Write project documentation');

-- Display setup completion message
SELECT 'Database setup completed successfully!' AS Status;
