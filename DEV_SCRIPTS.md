# Development Scripts Guide

## Quick Start

### Install All Dependencies
```bash
npm run install:all
```

### Start Both Frontend and Backend
```bash
npm start
```

### Development Mode (with auto-reload)
```bash
npm run start:dev
```

## Individual Services

### Frontend Only
```bash
npm run start:frontend
```

### Backend Only
```bash
npm run start:backend
```

### Backend Development Mode
```bash
npm run dev:backend
```

## Build and Deploy

### Build Frontend
```bash
npm run build
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

## Database Setup

### Initialize Database
```bash
cd backend && npm run init-db
```

## Available Scripts

- `npm start` - Start both frontend and backend
- `npm run start:frontend` - Start React development server
- `npm run start:backend` - Start Express server
- `npm run start:dev` - Start both in development mode
- `npm run dev:backend` - Start backend with nodemon
- `npm run build` - Build React app for production
- `npm run deploy` - Build and deploy to GitHub Pages
- `npm run install:all` - Install dependencies for all projects
- `npm test` - Run frontend tests
- `npm run clean` - Clean all node_modules and build folders

## Environment Setup

1. Copy `.env.example` to `.env` in both frontend and backend directories
2. Configure your environment variables
3. Run `npm run install:all`
4. Run `npm run start:dev`