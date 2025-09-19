# Smart Productivity Dashboard - Setup Instructions

## 🚀 Quick Setup Guide

### Step 1: Prerequisites
- **Node.js** (v14+): Download from https://nodejs.org/
- **MySQL** (v5.7+ or v8.0+): Download from https://dev.mysql.com/downloads/mysql/
  - Or use XAMPP/WAMP for easy local development

### Step 2: Database Setup

#### Option A: Using XAMPP (Recommended for quick demo)
1. Download and install XAMPP from https://www.apachefriends.org/
2. Start XAMPP and run Apache + MySQL services
3. Your MySQL credentials will be:
   - Host: `localhost`
   - Port: `3306`
   - User: `root`
   - Password: (empty)

#### Option B: Standalone MySQL
1. Install MySQL and note your root password
2. Start MySQL service
3. Update credentials in the `.env` file

### Step 3: Configure Environment
1. The `.env` file is already created in the backend folder
2. If using XAMPP, no changes needed
3. If using standalone MySQL, update the password in `backend/.env`:
   ```env
   DB_PASSWORD=your_mysql_password_here
   ```

### Step 4: Install Dependencies
Dependencies are already installed! But if you need to reinstall:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies  
cd ../frontend
npm install
```

### Step 5: Start the Application

#### Terminal 1 - Backend Server
```bash
cd backend
npm start
```
Wait for: "🗄️ Connected to MySQL database" and "✅ Database tables initialized"

#### Terminal 2 - Frontend Application
```bash
cd frontend
npm start
```
The app will open automatically at http://localhost:3000

## 🎯 Demo Instructions

### Multi-User Testing
1. Open multiple browser tabs or different browsers
2. Use different demo usernames:
   - Alice_Designer
   - Bob_Developer  
   - Charlie_PM
3. Watch real-time collaboration in action!

### Key Features to Demo
- ✅ **Task Management**: Create, update, complete, and delete tasks
- 🔄 **Real-time Sync**: Changes appear instantly across all users
- 📊 **Productivity Stats**: View completion rates and daily progress
- ⏰ **Focus Timer**: Use Pomodoro timer with notifications
- 💬 **Team Chat**: Communicate with team members in real-time

### Sample Demo Flow
1. User 1 creates a task "Design homepage layout"
2. User 2 sees the task appear instantly
3. User 2 starts a 25-minute focus session
4. User 1 completes a task and sees stats update
5. Users chat about progress in the collaboration panel

## 🛠 Troubleshooting

### MySQL Connection Issues
**Error**: "Database connection failed"
- ✅ Ensure MySQL service is running
- ✅ Check credentials in `backend/.env`
- ✅ For XAMPP: Start MySQL in XAMPP Control Panel

### Port Conflicts
**Error**: "Port 3000 already in use"
- ✅ Close other applications using port 3000
- ✅ Or change port in frontend package.json

### Browser Notifications
- ✅ Allow notifications when prompted for focus timer alerts
- ✅ Test in Chrome/Firefox for best experience

## 📱 Testing Real-time Features

### Multi-User Simulation
1. **Browser Tab 1**: Login as "Alice_Designer"
2. **Browser Tab 2**: Login as "Bob_Developer"
3. **Private/Incognito Tab**: Login as "Charlie_PM"

### Real-time Tests
- Create task in Tab 1 → Appears in Tab 2 & 3 instantly
- Complete task in Tab 2 → Stats update in all tabs
- Start focus session in Tab 3 → Notification in all tabs
- Send chat message → Appears in all tabs immediately

## 🎉 Success Indicators

You'll know everything is working when you see:
- ✅ "Connected to MySQL database" in backend terminal
- ✅ React app opens at http://localhost:3000
- ✅ Login screen appears with demo user options
- ✅ Real-time task sync between browser tabs
- ✅ Live chat messages appearing instantly
- ✅ Focus timer notifications working
- ✅ Productivity stats updating in real-time

## 💡 Pro Tips

- **Use Chrome DevTools**: Open Network tab to see real-time websocket messages
- **Test Notifications**: Allow browser notifications for full focus timer experience  
- **Performance**: Monitor MySQL performance with XAMPP phpMyAdmin
- **Data**: Sample data is automatically created for realistic demo

---
**Ready to demo?** Start with Step 1 and you'll be running the Smart Productivity Dashboard in minutes! 🚀
