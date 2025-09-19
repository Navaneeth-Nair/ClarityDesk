const express = require('express');
const router = express.Router();
const pool = require('../utils/initDatabase');

// Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, username, email, created_at, last_active 
      FROM users 
      ORDER BY last_active DESC
    `);
    
    res.json({ users: rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, username, email, created_at, last_active 
      FROM users 
      WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create or update user
router.post('/', async (req, res) => {
  const { username, email } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  try {
    const [result] = await pool.execute(`
      INSERT INTO users (username, email, last_active)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE
      email = VALUES(email),
      last_active = NOW()
    `, [username, email]);
    
    // Get the user (either created or updated)
    const [rows] = await pool.execute(`
      SELECT id, username, email, created_at, last_active 
      FROM users 
      WHERE username = ?
    `, [username]);
    
    res.status(201).json({
      message: 'User created/updated successfully',
      user: rows[0]
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// Update user activity
router.put('/:id/activity', async (req, res) => {
  const userId = req.params.id;
  
  try {
    const [result] = await pool.execute(`
      UPDATE users 
      SET last_active = NOW() 
      WHERE id = ?
    `, [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User activity updated successfully' });
  } catch (error) {
    console.error('Error updating user activity:', error);
    res.status(500).json({ error: 'Failed to update user activity' });
  }
});

// Get user by username
router.get('/username/:username', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, username, email, created_at, last_active 
      FROM users 
      WHERE username = ?
    `, [req.params.username]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Error fetching user by username:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
