const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

// Test authentication endpoint
router.get('/test-auth', (req, res) => {
  console.log('Calendar test-auth - req.user:', req.user);
  console.log('Calendar test-auth - session:', req.session);
  console.log('Calendar test-auth - isAuthenticated:', req.isAuthenticated ? req.isAuthenticated() : 'No method');
  
  res.json({
    authenticated: !!req.user,
    user: req.user,
    sessionExists: !!req.session,
    sessionData: req.session
  });
});

// Get user's calendar events
router.get('/events', async (req, res) => {
  try {
    console.log('Calendar events request - req.user:', req.user);
    console.log('Calendar events request - req.isAuthenticated():', req.isAuthenticated ? req.isAuthenticated() : 'No isAuthenticated method');
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has calendar token
    const pool = require('../utils/initDatabase');
    const [rows] = await pool.execute(
      'SELECT calendar_token FROM users WHERE id = ?',
      [req.user.id]
    );

    console.log('Calendar token query result:', rows);

    if (!rows.length || !rows[0].calendar_token) {
      return res.status(400).json({ error: 'Calendar not connected' });
    }

    const accessToken = rows[0].calendar_token;

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events for the next 7 days
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log('Fetching calendar events from:', timeMin, 'to:', timeMax);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Transform events to match our frontend format
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.summary || 'No Title',
      description: event.description || '',
      start: {
        dateTime: event.start.dateTime || event.start.date,
        date: event.start.date
      },
      end: {
        dateTime: event.end.dateTime || event.end.date,
        date: event.end.date
      },
      location: event.location || '',
      attendees: event.attendees || [],
      status: event.status || 'confirmed'
    }));

    res.json({ events: transformedEvents });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return res.status(401).json({ error: 'Calendar access token expired or invalid' });
    }
    
    if (error.code === 403) {
      return res.status(403).json({ error: 'Calendar access forbidden - check permissions' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      details: error.message 
    });
  }
});

module.exports = router;