import React, { useState, useEffect } from 'react';
import './MeetingNotifications.css';

const MeetingNotifications = ({ user, socket }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: 60,
    attendees: ''
  });

  // Fetch upcoming meetings from Google Meet API
  useEffect(() => {
    if (user) {
      fetchUpcomingMeetings();
      // Set up interval to check for meetings every 5 minutes
      const interval = setInterval(fetchUpcomingMeetings, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Listen for real-time meeting notifications
  useEffect(() => {
    if (socket) {
      socket.on('meeting-notification', handleMeetingNotification);
      socket.on('meeting-reminder', handleMeetingReminder);
      
      return () => {
        socket.off('meeting-notification');
        socket.off('meeting-reminder');
      };
    }
  }, [socket]);

  const fetchUpcomingMeetings = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/meetings/upcoming', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
        
        // Check for meetings starting soon and send notifications
        checkForUpcomingMeetings(data.meetings || []);
      } else if (response.status === 403) {
        setError('Google Meet API access needed. Please reconnect your Google account.');
      } else {
        setError('Failed to fetch meetings');
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to connect to meeting service');
    } finally {
      setLoading(false);
    }
  };

  const checkForUpcomingMeetings = (meetingList) => {
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    const in5Minutes = new Date(now.getTime() + 5 * 60 * 1000);

    meetingList.forEach(meeting => {
      const startTime = new Date(meeting.startTime);
      
      if (startTime <= in15Minutes && startTime > in5Minutes) {
        // 15-minute warning
        sendMeetingNotification(meeting, '15 minutes');
      } else if (startTime <= in5Minutes && startTime > now) {
        // 5-minute warning
        sendMeetingNotification(meeting, '5 minutes');
      }
    });
  };

  const sendMeetingNotification = (meeting, timeUntil) => {
    const notification = {
      id: `${meeting.id}-${timeUntil}`,
      type: 'meeting-reminder',
      title: `Meeting starting in ${timeUntil}`,
      message: meeting.summary || 'Upcoming meeting',
      meetingUrl: meeting.meetLink,
      timestamp: new Date(),
      meeting: meeting
    };

    // Add to local notifications
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 recent

    // Send to all connected users via socket
    if (socket) {
      socket.emit('broadcast-meeting-notification', notification);
    }

    // Browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: `${notification.message}\nClick to join meeting`,
        icon: '/logo.png',
        tag: notification.id,
        requireInteraction: true
      });
    }
  };

  const handleMeetingNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        tag: notification.id
      });
    }
  };

  const handleMeetingReminder = (data) => {
    handleMeetingNotification({
      ...data,
      type: 'meeting-reminder'
    });
  };

  const joinMeeting = (meetingUrl) => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const createQuickMeeting = async () => {
    setCreatingMeeting(true);
    setError(null);

    try {
      const now = new Date();
      const startTime = new Date(now.getTime() + 2 * 60 * 1000); // Start in 2 minutes
      
      const response = await fetch('/api/meetings/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Quick Meeting',
          description: 'Instant meeting created from dashboard',
          startTime: startTime.toISOString(),
          duration: 30, // 30 minutes
          attendees: []
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Notify all connected users
        if (socket) {
          socket.emit('broadcast-meeting-notification', {
            id: `quick-${Date.now()}`,
            type: 'meeting-created',
            title: '🎥 Quick Meeting Created',
            message: `${user.username} created an instant meeting`,
            meetingUrl: data.meetLink,
            timestamp: new Date(),
            meeting: data.meeting
          });
        }

        // Open the meeting immediately
        if (data.meetLink) {
          window.open(data.meetLink, '_blank', 'noopener,noreferrer');
        }

        // Refresh meetings list
        fetchUpcomingMeetings();
        
        setNotifications(prev => [{
          id: `created-${Date.now()}`,
          type: 'meeting-created',
          title: '✅ Meeting Created',
          message: 'Quick meeting is ready to join',
          meetingUrl: data.meetLink,
          timestamp: new Date()
        }, ...prev.slice(0, 4)]);

      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create meeting');
      }
    } catch (err) {
      console.error('Error creating quick meeting:', err);
      setError('Failed to create meeting');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const createScheduledMeeting = async () => {
    if (!newMeeting.title || !newMeeting.startTime) {
      setError('Please fill in required fields');
      return;
    }

    setCreatingMeeting(true);
    setError(null);

    try {
      const attendeesList = newMeeting.attendees
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const response = await fetch('/api/meetings/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newMeeting.title,
          description: newMeeting.description,
          startTime: new Date(newMeeting.startTime).toISOString(),
          duration: parseInt(newMeeting.duration),
          attendees: attendeesList
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Notify all connected users
        if (socket) {
          socket.emit('broadcast-meeting-notification', {
            id: `scheduled-${Date.now()}`,
            type: 'meeting-scheduled',
            title: '📅 Meeting Scheduled',
            message: `${user.username} scheduled: ${newMeeting.title}`,
            meetingUrl: data.meetLink,
            timestamp: new Date(),
            meeting: data.meeting
          });
        }

        // Reset form and close modal
        setNewMeeting({
          title: '',
          description: '',
          startTime: '',
          duration: 60,
          attendees: ''
        });
        setShowCreateModal(false);

        // Refresh meetings list
        fetchUpcomingMeetings();
        
        setNotifications(prev => [{
          id: `scheduled-${Date.now()}`,
          type: 'meeting-scheduled',
          title: '✅ Meeting Scheduled',
          message: `"${newMeeting.title}" has been created`,
          meetingUrl: data.meetLink,
          timestamp: new Date()
        }, ...prev.slice(0, 4)]);

      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create meeting');
      }
    } catch (err) {
      console.error('Error creating scheduled meeting:', err);
      setError('Failed to create meeting');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const getDefaultStartTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Default to 30 minutes from now
    return now.toISOString().slice(0, 16); // Format for datetime-local input
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (!user) {
    return (
      <div className="meeting-notifications">
        <div className="meeting-header">
          <h3>📅 Meeting Notifications</h3>
          <span className="auth-required">Login required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-notifications">
      <div className="meeting-header">
        <h3>📅 Meeting Notifications</h3>
        <div className="meeting-controls">
          <button 
            onClick={createQuickMeeting} 
            disabled={creatingMeeting}
            className="quick-meet-btn"
            title="Create instant meeting"
          >
            {creatingMeeting ? '⏳' : '🎥'} Quick Meet
          </button>
          <button 
            onClick={() => setShowCreateModal(true)} 
            disabled={creatingMeeting}
            className="schedule-btn"
            title="Schedule a meeting"
          >
            📅 Schedule
          </button>
          <button 
            onClick={fetchUpcomingMeetings} 
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? '🔄' : '↻'} Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="meeting-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Active Notifications */}
      {notifications.length > 0 && (
        <div className="active-notifications">
          <h4>🔔 Active Notifications</h4>
          {notifications.map(notification => (
            <div key={notification.id} className={`notification-item ${notification.type}`}>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                {notification.meetingUrl && (
                  <button 
                    onClick={() => joinMeeting(notification.meetingUrl)}
                    className="join-meeting-btn"
                  >
                    🎥 Join Meeting
                  </button>
                )}
              </div>
              <button 
                onClick={() => dismissNotification(notification.id)}
                className="dismiss-btn"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Meetings */}
      <div className="upcoming-meetings">
        <h4>📋 Upcoming Meetings</h4>
        {loading ? (
          <div className="loading-meetings">Loading meetings...</div>
        ) : meetings.length > 0 ? (
          <div className="meetings-list">
            {meetings.slice(0, 5).map(meeting => (
              <div key={meeting.id} className="meeting-item">
                <div className="meeting-info">
                  <div className="meeting-title">
                    {meeting.summary || 'No title'}
                  </div>
                  <div className="meeting-time">
                    🕒 {formatTime(meeting.startTime)}
                    {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
                  </div>
                  {meeting.description && (
                    <div className="meeting-description">
                      {meeting.description.substring(0, 100)}
                      {meeting.description.length > 100 ? '...' : ''}
                    </div>
                  )}
                </div>
                {meeting.meetLink && (
                  <button 
                    onClick={() => joinMeeting(meeting.meetLink)}
                    className="join-btn"
                  >
                    🎥 Join
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-meetings">
            <span>✅ No upcoming meetings today</span>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <span className={`status-indicator ${socket?.connected ? 'connected' : 'disconnected'}`}>
          {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        <span className="status-text">
          Real-time notifications {socket?.connected ? 'enabled' : 'disabled'}
        </span>
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-meeting-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Schedule New Meeting</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="close-modal-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="meeting-title">Meeting Title *</label>
                <input
                  id="meeting-title"
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting(prev => ({...prev, title: e.target.value}))}
                  placeholder="Enter meeting title"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="meeting-description">Description</label>
                <textarea
                  id="meeting-description"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting(prev => ({...prev, description: e.target.value}))}
                  placeholder="Meeting agenda or description"
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="meeting-start">Start Time *</label>
                  <input
                    id="meeting-start"
                    type="datetime-local"
                    value={newMeeting.startTime || getDefaultStartTime()}
                    onChange={(e) => setNewMeeting(prev => ({...prev, startTime: e.target.value}))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="meeting-duration">Duration (minutes)</label>
                  <select
                    id="meeting-duration"
                    value={newMeeting.duration}
                    onChange={(e) => setNewMeeting(prev => ({...prev, duration: e.target.value}))}
                    className="form-select"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="meeting-attendees">Attendees (optional)</label>
                <input
                  id="meeting-attendees"
                  type="text"
                  value={newMeeting.attendees}
                  onChange={(e) => setNewMeeting(prev => ({...prev, attendees: e.target.value}))}
                  placeholder="email1@example.com, email2@example.com"
                  className="form-input"
                />
                <small className="form-hint">Separate multiple emails with commas</small>
              </div>

              {error && (
                <div className="modal-error">
                  ⚠️ {error}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="cancel-btn"
                  disabled={creatingMeeting}
                >
                  Cancel
                </button>
                <button 
                  onClick={createScheduledMeeting}
                  className="create-btn"
                  disabled={creatingMeeting || !newMeeting.title}
                >
                  {creatingMeeting ? '⏳ Creating...' : '📅 Create Meeting'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingNotifications;