const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./initDatabase');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
  scope: [
    'profile', 
    'email', 
    'https://www.googleapis.com/auth/calendar',  // Full calendar access (read/write)
    'https://www.googleapis.com/auth/calendar.events'  // Calendar events access
  ]
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const username = profile.displayName || email;
    
    // Insert/update user and store calendar token
    await pool.execute(
      `INSERT INTO users (username, email, calendar_token, last_active)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         calendar_token = VALUES(calendar_token),
         last_active = NOW()`,
      [username, email, accessToken]
    );
    
    const [rows] = await pool.execute(
      `SELECT id, username, email, created_at, last_active
       FROM users WHERE email = ?`,
      [email]
    );
    return done(null, rows[0]);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, username, email, created_at, last_active
       FROM users WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) return done(new Error('User not found'), null);
    done(null, rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
