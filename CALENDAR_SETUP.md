# Google Calendar API Setup Guide

## Issue: Calendar API Not Enabled

The error you're seeing indicates that the Google Calendar API needs to be enabled in your Google Cloud Console.

## Quick Fix Steps:

### 1. Enable Google Calendar API
Visit this direct link for your project:
```
https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=340527516217
```

### 2. Click "Enable" Button
- You'll see the Google Calendar API page
- Click the blue "Enable" button
- Wait for it to process (usually takes 1-2 minutes)

### 3. Verify Setup
After enabling:
- Refresh your productivity dashboard
- Click "Connect Google Calendar" 
- The app should now fetch real calendar events

## Alternative: Use Demo Mode

If you prefer not to enable the API right now:
- The app automatically falls back to demo events
- All functionality works the same way
- You'll see sample calendar events instead of real ones

## What's Working Now:

✅ **Authentication**: Login/logout working perfectly
✅ **Session Persistence**: User stays logged in across page refreshes  
✅ **Dashboard**: Shows proper dashboard instead of login screen
✅ **Calendar Fallback**: Shows demo events when API isn't enabled
✅ **Error Handling**: User-friendly error messages
✅ **UI States**: Clear indicators for connection status

## Current Status:
- 🔐 **Auth**: ✅ Working
- 📱 **Dashboard**: ✅ Working  
- 📅 **Calendar Demo**: ✅ Working
- 📅 **Real Calendar**: ⏳ Requires API enablement

The app is fully functional - you just need to enable the Calendar API to see your real Google Calendar events instead of the demo events.