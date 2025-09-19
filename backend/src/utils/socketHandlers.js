const pool = require('../utils/initDatabase');

// Store active users and their socket connections
const activeUsers = new Map();

const handleConnection = (socket, io) => {
  // Join user to general room
  socket.join('productivity-room');
  
  // Handle user registration/login
  socket.on('user-join', async (userData) => {
    const { username, email } = userData;
    
    try {
      // Store or update user in database
      const [result] = await pool.execute(
        `INSERT INTO users (username, email, last_active) 
         VALUES (?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE email = VALUES(email), last_active = NOW()`,
        [username, email]
      );
      
      // Get the user ID
      let userId = result.insertId;
      if (!userId) {
        const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
        userId = rows[0]?.id;
      }
      
      // Store active user
      activeUsers.set(socket.id, {
        id: userId,
        username,
        email,
        socketId: socket.id
      });
      
      // Notify all users about new user
      io.to('productivity-room').emit('user-joined', {
        username,
        activeCount: activeUsers.size
      });
      
      // Send current active users to new user
      socket.emit('active-users', Array.from(activeUsers.values()));
    } catch (error) {
      console.error('Error registering user:', error);
      socket.emit('error', { message: 'Failed to register user' });
    }
  });

  // Handle task operations
  socket.on('task-created', async (taskData) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    
    const { title, description, deadline, priority, assignedTo } = taskData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO tasks (title, description, deadline, priority, created_by, assigned_to)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, deadline, priority, user.id, assignedTo]
      );
      
      const newTask = {
        id: result.insertId,
        title,
        description,
        deadline,
        priority,
        completed: false,
        created_by: user.id,
        assigned_to: assignedTo,
        created_at: new Date().toISOString()
      };
      
      // Log activity
      await logActivity(user.id, 'task_created', `Created task: ${title}`);
      
      // Broadcast to all users
      io.to('productivity-room').emit('task-created', newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      socket.emit('error', { message: 'Failed to create task' });
    }
  });

  socket.on('task-updated', async (taskData) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    
    const { id, title, description, deadline, priority, completed } = taskData;
    
    try {
      await pool.execute(
        `UPDATE tasks SET title = ?, description = ?, deadline = ?, priority = ?, 
         completed = ?, updated_at = NOW(), 
         completed_at = CASE WHEN ? = 1 THEN NOW() ELSE completed_at END
         WHERE id = ?`,
        [title, description, deadline, priority, completed, completed, id]
      );
      
      // Log activity
      const action = completed ? 'task_completed' : 'task_updated';
      const details = completed ? `Completed task: ${title}` : `Updated task: ${title}`;
      await logActivity(user.id, action, details);
      
      // Broadcast to all users
      io.to('productivity-room').emit('task-updated', taskData);
    } catch (error) {
      console.error('Error updating task:', error);
      socket.emit('error', { message: 'Failed to update task' });
    }
  });

  socket.on('task-deleted', async (taskId) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    
    try {
      // Get task title for logging
      const [rows] = await pool.execute('SELECT title FROM tasks WHERE id = ?', [taskId]);
      if (rows.length > 0) {
        await logActivity(user.id, 'task_deleted', `Deleted task: ${rows[0].title}`);
      }
      
      await pool.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
      
      // Broadcast to all users
      io.to('productivity-room').emit('task-deleted', { id: taskId });
    } catch (error) {
      console.error('Error deleting task:', error);
      socket.emit('error', { message: 'Failed to delete task' });
    }
  });

  // Handle focus session
  socket.on('focus-session-start', async (sessionData) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    
    const { duration } = sessionData;
    
    try {
      const [result] = await pool.execute(
        'INSERT INTO focus_sessions (user_id, duration) VALUES (?, ?)',
        [user.id, duration]
      );
      
      await logActivity(user.id, 'focus_started', `Started ${duration} minute focus session`);
      
      // Notify all users
      io.to('productivity-room').emit('focus-session-started', {
        username: user.username,
        duration,
        sessionId: result.insertId
      });
    } catch (error) {
      console.error('Error starting focus session:', error);
      socket.emit('error', { message: 'Failed to start focus session' });
    }
  });

  socket.on('focus-session-complete', async (sessionData) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    
    const { sessionId } = sessionData;
    
    try {
      await pool.execute(
        'UPDATE focus_sessions SET completed = TRUE WHERE id = ? AND user_id = ?',
        [sessionId, user.id]
      );
      
      await logActivity(user.id, 'focus_completed', 'Completed focus session');
      
      // Notify all users
      io.to('productivity-room').emit('focus-session-completed', {
        username: user.username,
        sessionId
      });
    } catch (error) {
      console.error('Error completing focus session:', error);
      socket.emit('error', { message: 'Failed to complete focus session' });
    }
  });

  // Handle real-time collaboration messages
  socket.on('collaboration-message', (messageData) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    
    const message = {
      id: Date.now(),
      username: user.username,
      message: messageData.message,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast message to all users
    io.to('productivity-room').emit('collaboration-message', message);
  });
};

const handleDisconnection = (socket, io) => {
  const user = activeUsers.get(socket.id);
  if (user) {
    // Remove user from active users
    activeUsers.delete(socket.id);
    
    // Notify all users about user leaving
    io.to('productivity-room').emit('user-left', {
      username: user.username,
      activeCount: activeUsers.size
    });
  }
};

// Helper function to log activities
const logActivity = async (userId, action, details) => {
  try {
    await pool.execute(
      'INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, details]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = {
  handleConnection,
  handleDisconnection,
  activeUsers
};
