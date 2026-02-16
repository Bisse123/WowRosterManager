# WoW Guild Roster Manager

A real-time collaborative World of Warcraft retail guild raid roster management system. Share a link with your guild members to collaboratively manage your raid roster with drag-and-drop functionality, automatic raid buff detection, and Google Sheets integration.

## Features

- 🎮 **Real-time Collaboration**: Multiple users can edit the roster simultaneously
- 🔗 **Shareable Links**: Create sessions and share links with guild members
- 👁️ **Read-only Mode**: Share view-only links for roster visibility
- 🎯 **Drag & Drop**: Easily move players between Main Roster, Trials, and Bench
- 📊 **Auto-detection**: Automatic raid buff and utility coverage checking
- 🎨 **WoW Theme**: Authentic WoW class colors and dark theme
- 💾 **Google Sheets Sync**: Load and save roster data to Google Sheets
- 📱 **Responsive**: Works on desktop and mobile devices

## Architecture

This application consists of two parts:
- **Frontend**: Static React app (hosted on GitHub Pages)
- **Backend**: Node.js server (hosted separately on Render/Railway/Heroku)

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Sheets API enabled
- Google OAuth 2.0 credentials
- A hosting service for the backend (Render, Railway, Heroku, etc.)

## Google Sheets Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Google Sheets API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. **Add authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `https://bisse123.github.io` (production - your GitHub Pages URL)
7. **Add authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-backend-url.onrender.com/auth/callback` (production - your backend URL)
8. Download the credentials JSON
9. Copy the **Client ID** and **Client Secret**

### 2. Prepare Your Google Sheet

Create a Google Sheet with the following columns:

| Player Name | Class | Main Spec Role | Alt 1 Class | Alt 1 Spec Role | Alt 2 Class | Alt 2 Spec Role | Status | Notes |
|-------------|-------|----------------|-------------|-----------------|-------------|-----------------|--------|-------|
| Example     | Paladin | Healer       | -           | -               | -           | -               | Main   | JL    |

**Valid values:**
- **Class**: Death Knight, Demon Hunter, Druid, Evoker, Hunter, Mage, Monk, Paladin, Priest, Rogue, Shaman, Warlock, Warrior
- **Role**: Tank, Healer, Melee DPS, Ranged DPS
- **Status**: Main, Trial, Bench

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Bisse123/WowRosterManager.git
cd WowRosterManager
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Deployment

### Backend Deployment (Render - Free Tier)

1. **Create a Render account** at [render.com](https://render.com)

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Select the `backend` directory as the root
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Add Environment Variables** in Render dashboard:
   ```
   PORT=3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=https://your-app.onrender.com/auth/callback
   FRONTEND_URL=https://bisse123.github.io/WowRosterManager
   ```

4. **Deploy** and copy your backend URL (e.g., `https://wow-roster-backend.onrender.com`)

### Frontend Deployment (GitHub Pages)

1. **Update Frontend Environment**

   Create `frontend/.env.production`:
   ```env
   VITE_BACKEND_URL=https://your-backend-url.onrender.com
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

2. **Deploy to GitHub Pages**:
   ```bash
   cd frontend
   npm run deploy
   ```

3. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Source: `gh-pages` branch
   - Save

Your app will be live at: `https://bisse123.github.io/WowRosterManager/`

### Update Google OAuth URLs

After deployment, update your Google OAuth credentials with production URLs:
- **Authorized JavaScript origins**: `https://bisse123.github.io`
- **Authorized redirect URIs**: `https://your-backend-url.onrender.com/auth/callback`

## Local Development

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Usage

### Creating a Session

1. Click **"Login with Google"**
2. Authorize the application
3. Enter your **Google Spreadsheet ID**
4. Click **"Create Session"**

### Sharing with Guild Members

1. Click **"Copy Share Link"** for editable access
2. Click **"Copy Read-only Link"** for view-only access
3. Share via Discord/in-game

### Managing the Roster

- **Drag and Drop**: Move players between rosters
- **Add Player**: Quick entry form
- **Select Player**: Highlight for all users
- **Search**: Filter by name
- **Save**: Persist to Google Sheets

## Tech Stack

- **Frontend**: React, Vite, Socket.io-client, DnD Kit
- **Backend**: Node.js, Express, Socket.io, Google APIs
- **Hosting**: GitHub Pages (frontend) + Render (backend)

## Troubleshooting

### CORS Errors
Make sure `FRONTEND_URL` in backend matches your GitHub Pages URL exactly.

### OAuth Redirect Mismatch
Ensure all URLs in Google Cloud Console match your deployed URLs (no trailing slashes).

### Backend Not Responding
Check Render logs. Free tier may spin down after inactivity (takes 30-60s to restart).

### WebSocket Connection Issues
Ensure your backend supports WebSocket connections (Render does by default).

## Future Enhancements

- [ ] Persistent storage with Redis/PostgreSQL
- [ ] Auto-save functionality
- [ ] Export roster formatting
- [ ] Historical snapshots
- [ ] Blizzard API integration

## License

MIT License

## Support

Open an issue on GitHub for support.

---

**For the Horde! For the Alliance!** 🎮