# Smart Productivity Dashboard for Remote Teams

A lightweight, demo-ready productivity dashboard designed for remote students, freelancers, and small startup teams.

## Features

### Core Features
- **Task Manager**: Add, update, and mark tasks as complete with deadlines
- **Real-time Collaboration**: Shared task lists and live updates between users
- **Productivity Insights**: Simple statistics showing tasks completed per day
- **Focus Timer**: Pomodoro-style timer with notifications

### Technical Stack
- **Frontend**: React.js with modern hooks and state management
- **Backend**: Node.js with Express.js
- **Database**: MySQL for reliable data persistence
- **Real-time**: Socket.io for live collaboration
- **Styling**: CSS3 with responsive design

## Quick Start

📋 **[See SETUP.md for detailed setup instructions](./SETUP.md)**

### Prerequisites
- Node.js (v14+)
- MySQL (v5.7+ or v8.0+)
- npm or yarn

### Quick Demo Setup
1. Install XAMPP and start MySQL
2. Run backend: `cd backend && npm start`
3. Run frontend: `cd frontend && npm start`
4. Open http://localhost:3000

### Installation

1. Clone and navigate to the project:
```bash
cd codefest2k25hackathon
```

2. Set up the database:
   - Install and start MySQL server
   - Create a database named `productivity_dashboard` (or update the name in `.env`)

3. Configure environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env file with your MySQL credentials
```

4. Install backend dependencies:
```bash
npm install
```

5. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm start
```

3. Open your browser to `http://localhost:3000`

## Database Configuration

The application uses MySQL with the following default settings:
- **Host**: localhost
- **Port**: 3306
- **Database**: productivity_dashboard
- **User**: root
- **Password**: (empty)

Update the `.env` file in the backend directory to match your MySQL configuration:

## Project Structure

```
codefest2k25hackathon/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── database/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Demo Instructions

1. **Multi-user Testing**: Open the app in multiple browser tabs or different browsers to test real-time collaboration
2. **Task Management**: Create tasks with deadlines and watch them sync across all connected users
3. **Productivity Tracking**: Complete tasks to see daily statistics update in real-time
4. **Focus Timer**: Use the Pomodoro timer to enhance productivity

## Target Audience
- Remote students managing coursework and group projects
- Freelancers tracking client tasks and deadlines
- Small startup teams coordinating daily activities

## Demo Ready Features
- ✅ Multi-user real-time task sharing
- ✅ Live productivity statistics
- ✅ Responsive design for all devices
- ✅ Focus timer with browser notifications
- ✅ Persistent data storage

Built for the CodeFest 2025 Hackathon - Smart Productivity Dashboard Challenge.
