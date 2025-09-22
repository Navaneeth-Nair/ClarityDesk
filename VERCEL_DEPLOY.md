# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Method 1: One-Click Deploy
1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub account
4. Select the ClarityDesk repository
5. Vercel will auto-detect the settings from `vercel.json`

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Method 3: Package.json Script
```bash
npm run deploy:vercel
```

## ⚙️ Vercel Configuration

The project includes a `vercel.json` file with optimal settings:

```json
{
  "buildCommand": "cd frontend && npx react-scripts build",
  "outputDirectory": "frontend/build",
  "installCommand": "cd frontend && npm install"
}
```

## 🔧 Manual Configuration (if needed)

If auto-detection doesn't work, use these settings:

- **Framework Preset:** React
- **Root Directory:** `./` (project root)
- **Build Command:** `cd frontend && npx react-scripts build`
- **Output Directory:** `frontend/build`
- **Install Command:** `cd frontend && npm install`

## 🌍 Environment Variables

For production deployment, you may need to set:

- `REACT_APP_DEMO_MODE=true` (for static deployment)
- `REACT_APP_API_URL=` (leave empty for demo mode)

## 📦 What Gets Deployed

- React app built from `/frontend` directory
- Static files optimized for production
- Demo mode enabled (no backend required)
- All UI components and features visible

## 🔗 Live URL

After deployment, your app will be available at:
`https://your-project-name.vercel.app`