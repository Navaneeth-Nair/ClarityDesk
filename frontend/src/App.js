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
import GoogleCalendar from './components/GoogleCalendar';
import MeetingNotifications from './components/MeetingNotifications';

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

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First check localStorage for user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('Restored user from localStorage:', userData);
        }

        // Also check with backend to verify session is still valid
        const response = await fetch('http://localhost:5000/auth/status', {
          credentials: 'include'
        });
        const authStatus = await response.json();
        
        if (authStatus.authenticated && authStatus.user) {
          const userData = authStatus.user;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('Verified user authentication with backend:', userData);
        } else if (!authStatus.authenticated && storedUser) {
          // Session expired, clear stored user
          localStorage.removeItem('user');
          setUser(null);
          console.log('Session expired, cleared user data');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // If backend is unreachable but we have stored user, keep them logged in
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('Backend unreachable, using stored user:', userData);
        }
      } finally {
        setLoading(false); // Set loading to false after auth check is complete
      }
    };

    checkAuthStatus();
  }, []);

  // Populate user from OAuth callback query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('userId');
    const username = params.get('username');
    const email = params.get('email');
    const calendarConnected = params.get('calendarConnected');
    
    if (id && username) {
      const userData = { 
        id: parseInt(id, 10), 
        username: decodeURIComponent(username),
        email: email ? decodeURIComponent(email) : ''
      };
      setUser(userData);
      
      // Store user data in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Stored user from OAuth callback:', userData);
      
      // Show success message if calendar was just connected
      if (calendarConnected === 'true') {
        notifyUser('Google Calendar connected successfully!', 'success');
      }
      
      // Clean URL to remove query params
      const newParams = new URLSearchParams(params);
      newParams.delete('userId');
      newParams.delete('username');
      newParams.delete('email');
      newParams.delete('calendarConnected');
      const newSearch = newParams.toString();
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
    }
  }, []); // Remove user dependency to avoid infinite loop

  // Join socket room when user is set and socket is connected
  useEffect(() => {
    console.log('useEffect for user join - user:', user, 'socket connected:', socket.connected);
    if (user) {
      if (socket.connected) {
        console.log('Socket is connected, joining room for user:', user);
        socket.emit('user-join', user);
      } else {
        console.log('Socket not connected, waiting for connection...');
        // Listen for connection and then join
        const handleConnect = () => {
          console.log('Socket connected, now joining room for user:', user);
          socket.emit('user-join', user);
          socket.off('connect', handleConnect); // Remove this specific listener
        };
        socket.on('connect', handleConnect);
        
        // Cleanup function
        return () => {
          socket.off('connect', handleConnect);
        };
      }
    }
  }, [user]);

  useEffect(() => {
    // Socket event listeners
    socket.on('connect', () => {
      console.log('Socket connected to server, socket.id:', socket.id);
      // Don't set loading to false here anymore - auth check handles it
    });

    socket.on('user-joined', (data) => {
      notifyUser(`${data.username} joined the workspace`, 'success');
    });

    socket.on('user-left', (data) => {
      notifyUser(`${data.username} left the workspace`, 'info');
    });

    socket.on('active-users', (users) => {
      console.log('Received active users:', users);
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
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        credentials: 'include'
      });
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/stats/overview${user ? `?userId=${user.id}` : ''}`, {
        credentials: 'include'
      });
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

  const handleUserLogout = async () => {
    try {
      // Call backend logout endpoint
      await fetch('http://localhost:5000/auth/logout', {
        credentials: 'include'
      });
      
      // Clear local state
      localStorage.removeItem('user');
      setUser(null);
      setTasks([]);
      setStats({});
      setActiveUsers([]);
      setCollaborationMessages([]);
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleTaskCreate = async (taskData) => {
    console.log('Creating task:', taskData);
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ...taskData, created_by: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setTasks(prev => [data.task, ...prev]);
        // Also emit socket event for real-time updates to other users
        socket.emit('task-created', { ...taskData, created_by: user.id });
      } else {
        console.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleTaskUpdate = async (taskData) => {
    console.log('Updating task:', taskData);
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taskData),
      });

      console.log('Update response status:', response.status);
      
      if (response.ok) {
        console.log('Task updated successfully');
        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === taskData.id ? { ...task, ...taskData } : task
        ));
        // Also emit socket event for real-time updates to other users
        socket.emit('task-updated', taskData);
      } else {
        const errorData = await response.text();
        console.error('Failed to update task:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    console.log('Deleting task:', taskId);
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        console.log('Task deleted successfully');
        // Update local state
        setTasks(prev => prev.filter(task => task.id !== taskId));
        // Also emit socket event for real-time updates to other users
        socket.emit('task-deleted', taskId);
      } else {
        const errorData = await response.text();
        console.error('Failed to delete task:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
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
  <p>Connecting to Clarity Desk...</p>
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
          <div className="dashboard-layout">
            {/* Priority Section - Task Management and Focus Timer */}
            <section className="priority-section">
              <div className="primary-panel">
                <TaskManager
                  tasks={tasks}
                  user={user}
                  activeUsers={activeUsers}
                  onTaskCreate={handleTaskCreate}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                />
              </div>
              <div className="focus-panel">
                <FocusTimer
                  onSessionStart={handleFocusSessionStart}
                  onSessionComplete={handleFocusSessionComplete}
                />
              </div>
            </section>

            {/* Secondary Section - Analytics and Collaboration */}
            <section className="secondary-section">
              <div className="analytics-panel">
                <ProductivityStats 
                  stats={stats} 
                  userId={user.id}
                  onStatsUpdate={fetchStats}
                />
              </div>
              <div className="collaboration-panel">
                <CollaborationPanel
                  messages={collaborationMessages}
                  activeUsers={activeUsers}
                  currentUser={user}
                  onSendMessage={handleCollaborationMessage}
                />
              </div>
              <div className="calendar-panel">
                <GoogleCalendar user={user} />
              </div>
              <div className="meeting-panel">
                <MeetingNotifications user={user} socket={socket} />
              </div>
            </section>
          </div>
        </main>

        {/* Notification container */}
        <div id="notification-container"></div>
      </div>
    </ThemeProvider>
  );
}

export default App;
