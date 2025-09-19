const express = require('express');
const router = express.Router();
const pool = require('../utils/initDatabase');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             u1.username as created_by_username,
             u2.username as assigned_to_username
      FROM tasks t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      ORDER BY t.created_at DESC
    `);
    
    res.json({ tasks: rows });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             u1.username as created_by_username,
             u2.username as assigned_to_username
      FROM tasks t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ task: rows[0] });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  const { title, description, deadline, priority, created_by, assigned_to } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  try {
    const [result] = await pool.execute(`
      INSERT INTO tasks (title, description, deadline, priority, created_by, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, description, deadline, priority || 'medium', created_by, assigned_to]);
    
    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: result.insertId,
        title,
        description,
        deadline,
        priority: priority || 'medium',
        completed: false,
        created_by,
        assigned_to,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  const { title, description, deadline, priority, completed } = req.body;
  const taskId = req.params.id;
  
  try {
    const [result] = await pool.execute(`
      UPDATE tasks 
      SET title = ?, description = ?, deadline = ?, priority = ?, completed = ?,
          updated_at = NOW(),
          completed_at = CASE WHEN ? = 1 THEN NOW() ELSE completed_at END
      WHERE id = ?
    `, [title, description, deadline, priority, completed, completed, taskId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  const taskId = req.params.id;
  
  try {
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get tasks by user
router.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             u1.username as created_by_username,
             u2.username as assigned_to_username
      FROM tasks t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.created_by = ? OR t.assigned_to = ?
      ORDER BY t.created_at DESC
    `, [userId, userId]);
    
    res.json({ tasks: rows });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ error: 'Failed to fetch user tasks' });
  }
});

module.exports = router;
