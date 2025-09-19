import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Components
import TaskManager from './components/TaskManager';
import ProductivityStats from './components/ProductivityStats';
import FocusTimer from './components/FocusTimer';
import CollaborationPanel from './components/CollaborationPanel';
import UserLogin from './components/UserLogin';
import Header from './components/Header';

// Context
import { ThemeProvider } from './contexts/ThemeContext';

// Utils
import { notifyUser } from './utils/notifications';

const socket = io('http://localhost:5000');

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [collaborationMessages, setCollaborationMessages] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Socket event listeners
    socket.on('connect', () => {
      console.log('Connected to server');
      setLoading(false);
    });

    socket.on('user-joined', (data) => {
      notifyUser(`${data.username} joined the workspace`, 'success');
    });

    socket.on('user-left', (data) => {
      notifyUser(`${data.username} left the workspace`, 'info');
    });

    socket.on('active-users', (users) => {
      setActiveUsers(users);
    });

    socket.on('task-created', (task) => {
      setTasks(prev => [task, ...prev]);
      notifyUser(`New task created: ${task.title}`, 'success');
    });

    socket.on('task-updated', (updatedTask) => {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
      if (updatedTask.completed) {
        notifyUser(`Task completed: ${updatedTask.title}`, 'success');
      }
    });

    socket.on('task-deleted', (data) => {
      setTasks(prev => prev.filter(task => task.id !== data.id));
      notifyUser('Task deleted', 'info');
    });

    socket.on('collaboration-message', (message) => {
      setCollaborationMessages(prev => [...prev, message]);
    });

    socket.on('focus-session-started', (data) => {
      notifyUser(`${data.username} started a ${data.duration} minute focus session`, 'info');
    });

    socket.on('focus-session-completed', (data) => {
      notifyUser(`${data.username} completed their focus session!`, 'success');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      notifyUser(error.message, 'error');
    });

    return () => {
      socket.off('connect');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('active-users');
      socket.off('task-created');
      socket.off('task-updated');
      socket.off('task-deleted');
      socket.off('collaboration-message');
      socket.off('focus-session-started');
      socket.off('focus-session-completed');
      socket.off('error');
    };
  }, []);

  // Fetch initial data when user logs in
  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchStats();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/stats/overview${user ? `?userId=${user.id}` : ''}`);
      const data = await response.json();
      setStats(data.overview || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUserLogin = (userData) => {
    setUser(userData);
    socket.emit('user-join', userData);
  };

  const handleUserLogout = () => {
    setUser(null);
    setTasks([]);
    setStats({});
    setActiveUsers([]);
    setCollaborationMessages([]);
  };

  const handleTaskCreate = (taskData) => {
    socket.emit('task-created', { ...taskData, created_by: user.id });
  };

  const handleTaskUpdate = (taskData) => {
    socket.emit('task-updated', taskData);
  };

  const handleTaskDelete = (taskId) => {
    socket.emit('task-deleted', taskId);
  };

  const handleFocusSessionStart = (duration) => {
    socket.emit('focus-session-start', { duration });
  };

  const handleFocusSessionComplete = (sessionId) => {
    socket.emit('focus-session-complete', { sessionId });
    fetchStats(); // Refresh stats after focus session
  };

  const handleCollaborationMessage = (message) => {
    socket.emit('collaboration-message', { message });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Connecting to Smart Productivity Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <ThemeProvider>
        <UserLogin onLogin={handleUserLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="App">
        <Header 
          user={user} 
          activeUsers={activeUsers} 
          onLogout={handleUserLogout}
        />
        
        <main className="main-content">
          <div className="dashboard-grid">
            {/* Left Column - Task Management */}
            <div className="left-column">
              <TaskManager
                tasks={tasks}
                user={user}
                activeUsers={activeUsers}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
              />
            </div>

            {/* Center Column - Stats and Timer */}
            <div className="center-column">
              <ProductivityStats 
                stats={stats} 
                userId={user.id}
                onStatsUpdate={fetchStats}
              />
              <FocusTimer
                onSessionStart={handleFocusSessionStart}
                onSessionComplete={handleFocusSessionComplete}
              />
            </div>

            {/* Right Column - Collaboration */}
            <div className="right-column">
              <CollaborationPanel
                messages={collaborationMessages}
                activeUsers={activeUsers}
                currentUser={user}
                onSendMessage={handleCollaborationMessage}
              />
            </div>
          </div>
        </main>

        {/* Notification container */}
        <div id="notification-container"></div>
      </div>
    </ThemeProvider>
  );
}

export default App;
