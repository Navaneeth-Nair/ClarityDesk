const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
require('dotenv').config();
// Initialize Passport strategies
require('./utils/passportConfig');

// Import routes
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const calendarRoutes = require('./routes/calendar');

// Import socket handlers
const socketHandlers = require('./utils/socketHandlers');

// Initialize database
require('./utils/initDatabase');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true // Allow cookies to be sent
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Session and Passport initialization (for Google OAuth)
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'your-secret-key', 
  resave: false, 
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/meetings', require('./routes/meetings'));
// Google OAuth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Clarity Desk API is running!' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);
  
  // Handle socket events
  socketHandlers.handleConnection(socket, io);
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    socketHandlers.handleDisconnection(socket, io);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Clarity Desk Backend running on port ${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = { app, io };
