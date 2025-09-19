const express = require('express');
const router = express.Router();
const pool = require('../utils/initDatabase');

// Get productivity statistics
router.get('/', async (req, res) => {
  const { userId, startDate, endDate } = req.query;
  
  try {
    // Build the base query
    let query = `
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as tasks_completed,
        AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as avg_completion_time
      FROM tasks 
      WHERE completed = TRUE
    `;
    
    const params = [];
    
    // Add user filter if provided
    if (userId) {
      query += ` AND (created_by = ? OR assigned_to = ?)`;
      params.push(userId, userId);
    }
    
    // Add date range filter if provided
    if (startDate) {
      query += ` AND DATE(completed_at) >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND DATE(completed_at) <= ?`;
      params.push(endDate);
    }
    
    query += ` GROUP BY DATE(completed_at) ORDER BY date DESC LIMIT 30`;
    
    const [rows] = await pool.execute(query, params);
    res.json({ dailyStats: rows });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily stats' });
  }
});

// Get overall statistics
router.get('/overview', async (req, res) => {
  const { userId } = req.query;
  
  try {
    const queries = {
      totalTasks: 'SELECT COUNT(*) as count FROM tasks',
      completedTasks: 'SELECT COUNT(*) as count FROM tasks WHERE completed = TRUE',
      pendingTasks: 'SELECT COUNT(*) as count FROM tasks WHERE completed = FALSE',
      overdueTasks: 'SELECT COUNT(*) as count FROM tasks WHERE completed = FALSE AND deadline < NOW()',
      totalUsers: 'SELECT COUNT(*) as count FROM users',
      activeFocusSessions: 'SELECT COUNT(*) as count FROM focus_sessions WHERE completed = TRUE',
      totalFocusTime: 'SELECT COALESCE(SUM(duration), 0) as total FROM focus_sessions WHERE completed = TRUE'
    };
    
    // Modify queries if userId is provided
    if (userId) {
      const userFilter = ` WHERE created_by = ${userId} OR assigned_to = ${userId}`;
      const userFilterAnd = ` AND (created_by = ${userId} OR assigned_to = ${userId})`;
      
      queries.totalTasks += userFilter;
      queries.completedTasks += userFilterAnd;
      queries.pendingTasks += userFilterAnd;
      queries.overdueTasks += userFilterAnd;
      queries.activeFocusSessions += ` AND user_id = ${userId}`;
      queries.totalFocusTime += ` AND user_id = ${userId}`;
    }
    
    const results = {};
    
    // Execute all queries
    for (const [key, query] of Object.entries(queries)) {
      try {
        const [rows] = await pool.execute(query);
        results[key] = rows[0].count || rows[0].total || 0;
      } catch (error) {
        console.error(`Error in ${key} query:`, error);
        results[key] = 0;
      }
    }
    
    // Calculate productivity percentage
    const productivityRate = results.totalTasks > 0 
      ? Math.round((results.completedTasks / results.totalTasks) * 100)
      : 0;
    
    res.json({
      overview: {
        ...results,
        productivityRate,
        avgFocusTime: results.activeFocusSessions > 0 
          ? Math.round(results.totalFocusTime / results.activeFocusSessions)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ error: 'Failed to fetch overview stats' });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  const { userId, limit = 20 } = req.query;
  
  try {
    let query = `
      SELECT a.*, u.username
      FROM activity_log a
      JOIN users u ON a.user_id = u.id
    `;
    
    const params = [];
    
    if (userId) {
      query += ` WHERE a.user_id = ?`;
      params.push(userId);
    }
    
    query += ` ORDER BY a.timestamp DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [rows] = await pool.execute(query, params);
    res.json({ activities: rows });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get task completion trends
router.get('/trends', async (req, res) => {
  const { userId, days = 7 } = req.query;
  
  try {
    let query = `
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as tasks_completed,
        COUNT(*) as tasks_created
      FROM tasks
      WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;
    
    const params = [parseInt(days)];
    
    if (userId) {
      query += ` AND (created_by = ? OR assigned_to = ?)`;
      params.push(userId, userId);
    }
    
    query += ` GROUP BY DATE(created_at) ORDER BY date`;
    
    const [rows] = await pool.execute(query, params);
    res.json({ trends: rows });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get focus session statistics
router.get('/focus', async (req, res) => {
  const { userId } = req.query;
  
  try {
    let query = `
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as sessions_started,
        SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as sessions_completed,
        SUM(CASE WHEN completed = TRUE THEN duration ELSE 0 END) as total_focus_time,
        AVG(CASE WHEN completed = TRUE THEN duration ELSE NULL END) as avg_session_length
      FROM focus_sessions
      WHERE DATE(started_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;
    
    const params = [];
    
    if (userId) {
      query += ` AND user_id = ?`;
      params.push(userId);
    }
    
    query += ` GROUP BY DATE(started_at) ORDER BY date DESC LIMIT 30`;
    
    const [rows] = await pool.execute(query, params);
    res.json({ focusStats: rows });
  } catch (error) {
    console.error('Error fetching focus stats:', error);
    res.status(500).json({ error: 'Failed to fetch focus stats' });
  }
});

module.exports = router;
