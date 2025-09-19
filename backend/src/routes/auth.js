const express = require('express');
const router = express.Router();
const passport = require('passport');
// Initialize passport config
require('../utils/passportConfig');

// Start OAuth flow
router.get('/google', passport.authenticate('google', { 
  scope: [
    'profile', 
    'email', 
    'https://www.googleapis.com/auth/calendar',  // Full calendar access (read/write)
    'https://www.googleapis.com/auth/calendar.events'  // Calendar events access
  ] 
}));

// Calendar-specific OAuth flow - simplified approach
router.get('/google/calendar', (req, res, next) => {
  // Store that this is a calendar-only request
  req.session.calendarOnly = true;
  req.session.save((err) => {
    if (err) console.error('Session save error:', err);
    passport.authenticate('google', { 
      scope: [
        'profile', 
        'email', 
        'https://www.googleapis.com/auth/calendar',  // Full calendar access (read/write)
        'https://www.googleapis.com/auth/calendar.events'  // Calendar events access
      ],
      prompt: 'select_account consent', // Force account selection and consent
      accessType: 'offline' // To get refresh token
    })(req, res, next);
  });
});

// OAuth callback - handles both regular login and calendar-only flows
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  // Successful auth, redirect to frontend with user info
  const user = req.user;
  const isCalendarOnly = req.session.calendarOnly;
  
  // Clear the calendar flag
  if (req.session.calendarOnly) {
    delete req.session.calendarOnly;
  }
  
  let redirectUrl;
  if (isCalendarOnly) {
    // This was a calendar connection request
    redirectUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/?calendarConnected=true&userId=${user.id}&username=${encodeURIComponent(user.username)}&email=${encodeURIComponent(user.email || '')}`;
  } else {
    // This was a regular login
    redirectUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/?userId=${user.id}&username=${encodeURIComponent(user.username)}&email=${encodeURIComponent(user.email || '')}`;
  }
  
  res.redirect(redirectUrl);
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.user) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.CLIENT_ORIGIN || 'http://localhost:3000');
  });
});

module.exports = router;