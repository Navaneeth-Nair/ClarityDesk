import React, { useState, useEffect } from 'react';

// Mock events for demonstration (moved outside component to avoid dependency issues)
const MOCK_EVENTS = [
  {
    id: '1',
    summary: 'Team Stand-up Meeting',
    start: { dateTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString() }, // 1 hour from now
    end: { dateTime: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString() },
    location: 'Conference Room A',
    description: 'Daily team synchronization meeting'
  },
  {
    id: '2',
    summary: 'Project Review',
    start: { dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() }, // 4 hours from now
    end: { dateTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString() },
    location: 'Virtual Meeting',
    description: 'Quarterly project review with stakeholders'
  },
  {
    id: '3',
    summary: 'Lunch Break',
    start: { date: new Date().toISOString().split('T')[0] }, // Today (all-day)
    end: { date: new Date().toISOString().split('T')[0] },
    description: 'Personal time'
  },
  {
    id: '4',
    summary: 'Client Presentation',
    start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }, // Tomorrow
    end: { dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() },
    location: 'Client Office',
    description: 'Present Q4 deliverables to client'
  }
];

const GoogleCalendar = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Load calendar events when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchCalendarEvents();
    } else {
      // If no user, show mock events
      setEvents([...MOCK_EVENTS]);
    }
  }, [user]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching calendar events...');
      
      const response = await fetch('http://localhost:5000/api/calendar/events', {
        credentials: 'include'
      });
      
      console.log('Calendar API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setCalendarConnected(true);
        console.log('Fetched calendar events:', data.events);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Calendar API error:', response.status, errorData);
        
        if (response.status === 400) {
          // Calendar not connected
          setCalendarConnected(false);
          setEvents(MOCK_EVENTS); // Fall back to mock data
          console.log('Calendar not connected, using mock data');
        } else if (response.status === 401) {
          // User not authenticated or token expired
          setCalendarConnected(false);
          setError(`Authentication required: ${errorData.error || 'Please log in and connect your calendar'}`);
          setEvents([]);
        } else if (response.status === 403) {
          // API not enabled or permissions issue
          setCalendarConnected(false);
          setError('Google Calendar API is not enabled. Showing demo events instead.');
          setEvents(MOCK_EVENTS); // Fall back to mock data
          console.log('Calendar API not enabled (403), using mock data');
        } else {
          throw new Error(`API Error ${response.status}: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      
      // Extract user-friendly error message
      let userMessage = 'Unable to load calendar events';
      if (error.message.includes('API Error 403')) {
        userMessage = 'Google Calendar API not enabled - showing demo events';
        setEvents(MOCK_EVENTS);
      } else if (error.message.includes('API Error 401')) {
        userMessage = 'Calendar access expired - please reconnect';
        setEvents([]);
      } else if (error.message.includes('API Error 400')) {
        userMessage = 'Calendar not connected - showing demo events';
        setEvents(MOCK_EVENTS);
      } else {
        userMessage = 'Connection error - showing demo events';
        setEvents(MOCK_EVENTS);
      }
      
      setError(userMessage);
      setCalendarConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime, isAllDay = false) => {
    if (isAllDay) {
      return new Date(dateTime).toLocaleDateString();
    }
    return new Date(dateTime).toLocaleString();
  };

  const getEventTimeString = (event) => {
    if (event.start.date) {
      // All-day event
      return `📅 ${formatDateTime(event.start.date, true)}`;
    } else {
      // Timed event
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      const today = new Date();
      
      if (start.toDateString() === today.toDateString()) {
        return `⏰ Today ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`;
      } else {
        return `⏰ ${start.toLocaleDateString()} ${start.toLocaleTimeString()}`;
      }
    }
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.start.dateTime || event.start.date);
    const end = new Date(event.end.dateTime || event.end.date);

    if (now >= start && now <= end) {
      return { status: 'ongoing', icon: '🔴', text: 'Ongoing' };
    } else if (start > now) {
      return { status: 'upcoming', icon: '🟡', text: 'Upcoming' };
    } else {
      return { status: 'past', icon: '⚪', text: 'Past' };
    }
  };

  const handleConnectCalendar = () => {
    // Always redirect to calendar-specific OAuth with forced consent
    // This will work whether user is logged in or not
    window.location.href = 'http://localhost:5000/auth/google/calendar';
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>📅 Calendar Overview</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={fetchCalendarEvents} 
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            disabled={loading}
          >
            {loading ? '🔄' : '🔄'} {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button 
            onClick={handleConnectCalendar} 
            className={`btn ${calendarConnected ? 'btn-success' : 'btn-primary'}`}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
          >
            {calendarConnected ? '✅ Connected' : '🔗 Connect Google Calendar'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c33', 
          padding: '0.75rem', 
          borderRadius: '6px', 
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {!error && calendarConnected && (
        <div style={{ 
          background: '#e8f5e8', 
          color: '#2d5a2d', 
          padding: '0.5rem', 
          borderRadius: '6px', 
          marginBottom: '1rem',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          📅 Showing your real Google Calendar events
        </div>
      )}

      {!error && !calendarConnected && !loading && (
        <div style={{ 
          background: '#fff3cd', 
          color: '#856404', 
          padding: '0.5rem', 
          borderRadius: '6px', 
          marginBottom: '1rem',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          📋 Showing demo events - Connect your calendar to see real events
        </div>
      )}

      {loading && (
        <div style={{ 
          padding: '1rem', 
          textAlign: 'center',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          🔄 Loading calendar events...
        </div>
      )}

      <div style={{ 
        background: '#e3f2fd', 
        padding: '0.75rem', 
        borderRadius: '6px', 
        marginBottom: '1rem',
        fontSize: '0.85rem',
        color: '#1565c0'
      }}>
        💡 <strong>Demo Mode:</strong> Showing sample events. Click "Connect Google Calendar" to link your real calendar.
      </div>

      {events.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '1.5rem', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
          <p>No upcoming events</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
            📍 Showing {events.length} upcoming events
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {events.map((event, index) => {
              const eventStatus = getEventStatus(event);
              return (
                <div 
                  key={event.id || index}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    background: eventStatus.status === 'ongoing' ? '#fff3cd' : '#fff',
                    borderLeft: `4px solid ${eventStatus.status === 'ongoing' ? '#ff6b6b' : eventStatus.status === 'upcoming' ? '#4caf50' : '#ccc'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: '500', color: '#333', flex: 1 }}>
                      {event.summary || 'No Title'}
                    </div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: eventStatus.status === 'ongoing' ? '#ff6b6b' : eventStatus.status === 'upcoming' ? '#4caf50' : '#ccc',
                      color: 'white',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '10px',
                      marginLeft: '0.5rem'
                    }}>
                      {eventStatus.icon} {eventStatus.text}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                    {getEventTimeString(event)}
                  </div>
                  
                  {event.location && (
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      📍 {event.location}
                    </div>
                  )}
                  
                  {event.description && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#666', 
                      marginTop: '0.5rem',
                      maxHeight: '40px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {event.description.slice(0, 100)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendar;