const express = require('express');
const { google } = require('googleapis');
const pool = require('../utils/initDatabase');
const router = express.Router();

// Initialize Google Calendar and Meet APIs
const calendar = google.calendar('v3');
const meet = google.meet('v2');

// Test authentication endpoint for meetings
router.get('/test-auth', (req, res) => {
  console.log('Meetings test-auth - req.user:', req.user);
  console.log('Meetings test-auth - session:', req.session);
  console.log('Meetings test-auth - isAuthenticated:', req.isAuthenticated ? req.isAuthenticated() : 'No method');
  
  res.json({
    authenticated: !!req.user,
    user: req.user,
    sessionExists: !!req.session,
    sessionData: req.session,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
  });
});

// Get upcoming meetings/events with Meet links
router.get('/upcoming', async (req, res) => {
  try {
    console.log('Fetching upcoming meetings for user:', req.user?.id);
    console.log('Authentication status:', req.isAuthenticated ? req.isAuthenticated() : 'No auth method');
    console.log('Session data:', req.session);
    console.log('User object:', req.user);
    
    if (!req.isAuthenticated()) {
      console.log('Authentication failed - redirecting to login');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's calendar access token
    const [rows] = await pool.execute(
      'SELECT calendar_token FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!rows.length || !rows[0].calendar_token) {
      return res.status(401).json({ error: 'Calendar access token not found' });
    }

    const accessToken = rows[0].calendar_token;

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    // Get today's date range
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Fetching calendar events from:', now.toISOString(), 'to:', endOfDay.toISOString());

    // Fetch calendar events with Meet links
    const response = await calendar.events.list({
      auth: oauth2Client,
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    // Filter events that have Meet links and format them
    const meetings = events
      .filter(event => {
        return event.hangoutLink || 
               event.conferenceData?.entryPoints?.some(ep => ep.entryPointType === 'video') ||
               (event.description && event.description.includes('meet.google.com'));
      })
      .map(event => ({
        id: event.id,
        summary: event.summary || 'No title',
        description: event.description || '',
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        meetLink: event.hangoutLink || 
                  event.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri ||
                  extractMeetLinkFromDescription(event.description),
        attendees: event.attendees?.map(a => ({
          email: a.email,
          name: a.displayName,
          status: a.responseStatus
        })) || [],
        location: event.location,
        status: event.status,
        creator: event.creator
      }));

    console.log(`Found ${meetings.length} meetings with Meet links`);

    res.json({
      success: true,
      meetings: meetings,
      count: meetings.length
    });

  } catch (error) {
    console.error('Error fetching meetings:', error);
    
    if (error.code === 401) {
      return res.status(401).json({ error: 'Calendar access token expired or invalid' });
    } else if (error.code === 403) {
      return res.status(403).json({ 
        error: 'Google Calendar API access denied. Please check API permissions.',
        details: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch meetings',
      details: error.message 
    });
  }
});

// Create a new meeting
router.post('/create', async (req, res) => {
  try {
    console.log('Creating new meeting for user:', req.user?.id);
    console.log('Authentication status:', req.isAuthenticated ? req.isAuthenticated() : 'No auth method');
    console.log('Session data:', req.session);
    console.log('User object:', req.user);
    
    if (!req.isAuthenticated()) {
      console.log('Authentication failed - redirecting to login');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { title, description, startTime, duration, attendees } = req.body;

    if (!title || !startTime) {
      return res.status(400).json({ error: 'Title and start time are required' });
    }

    // Get user's calendar access token
    const [rows] = await pool.execute(
      'SELECT calendar_token FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!rows.length || !rows[0].calendar_token) {
      return res.status(401).json({ error: 'Calendar access token not found' });
    }

    const accessToken = rows[0].calendar_token;

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + (duration * 60 * 1000));

    // Prepare attendees list
    const attendeesList = attendees?.map(email => ({ email: email.trim() })) || [];

    // Create calendar event with Google Meet
    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: attendeesList,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 15 }, // 15 minutes before
          { method: 'popup', minutes: 5 }   // 5 minutes before
        ]
      }
    };

    console.log('Creating calendar event with Meet conference...');

    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1, // Required for creating Meet conferences
      sendUpdates: 'all' // Send invitations to attendees
    });

    const createdEvent = response.data;
    const meetLink = createdEvent.hangoutLink || 
                    createdEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;

    console.log('Meeting created successfully:', createdEvent.id);
    console.log('Meet link:', meetLink);

    res.json({
      success: true,
      meeting: {
        id: createdEvent.id,
        summary: createdEvent.summary,
        description: createdEvent.description,
        startTime: createdEvent.start.dateTime,
        endTime: createdEvent.end.dateTime,
        meetLink: meetLink,
        attendees: createdEvent.attendees || [],
        htmlLink: createdEvent.htmlLink
      },
      meetLink: meetLink
    });

  } catch (error) {
    console.error('Error creating meeting:', error);
    
    if (error.code === 401) {
      return res.status(401).json({ error: 'Calendar access token expired or invalid' });
    } else if (error.code === 403) {
      return res.status(403).json({ 
        error: 'Google Calendar API access denied. Please check API permissions.',
        details: error.message 
      });
    } else if (error.code === 400) {
      return res.status(400).json({ 
        error: 'Invalid meeting data provided',
        details: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create meeting',
      details: error.message 
    });
  }
});

// Helper function to extract Meet link from event description
function extractMeetLinkFromDescription(description) {
  if (!description) return null;
  
  const meetRegex = /https:\/\/meet\.google\.com\/[a-z0-9-]+/i;
  const match = description.match(meetRegex);
  return match ? match[0] : null;
}

// Get meeting details by ID
router.get('/:meetingId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { meetingId } = req.params;

    // Get user's calendar access token
    const [rows] = await pool.execute(
      'SELECT calendar_token FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!rows.length || !rows[0].calendar_token) {
      return res.status(401).json({ error: 'Calendar access token not found' });
    }

    const accessToken = rows[0].calendar_token;

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    // Get specific event
    const response = await calendar.events.get({
      auth: oauth2Client,
      calendarId: 'primary',
      eventId: meetingId
    });

    const event = response.data;
    const meetLink = event.hangoutLink || 
                    event.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;

    res.json({
      success: true,
      meeting: {
        id: event.id,
        summary: event.summary,
        description: event.description,
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        meetLink: meetLink,
        attendees: event.attendees || [],
        location: event.location,
        status: event.status
      }
    });

  } catch (error) {
    console.error('Error fetching meeting details:', error);
    
    if (error.code === 404) {
      return res.status(404).json({ error: 'Meeting not found' });
    } else if (error.code === 401) {
      return res.status(401).json({ error: 'Calendar access token expired or invalid' });
    }

    res.status(500).json({ 
      error: 'Failed to fetch meeting details',
      details: error.message 
    });
  }
});

module.exports = router;