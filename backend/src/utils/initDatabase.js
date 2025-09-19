const mysql = require('mysql2/promise');
require('dotenv').config();

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'productivity_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection and create database if it doesn't exist
const initializeDatabase = async () => {
  try {
    // First connect without database to create it if needed
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Create database if it doesn't exist
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'productivity_dashboard'}`);
    await tempConnection.end();

    // Test the pool connection
    const connection = await pool.getConnection();
    console.log('�️ Connected to MySQL database');
    connection.release();

    // Initialize tables
    await initTables();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('📝 Please ensure MySQL is running and credentials are correct in .env file');
    process.exit(1);
  }
};

// Initialize database tables
const initTables = async () => {
  try {
    // Users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    await pool.execute(`
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
      )
    `);

    // Focus sessions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        duration INT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Activity log table for insights
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  }
};

// Initialize the database
initializeDatabase();

module.exports = pool;
