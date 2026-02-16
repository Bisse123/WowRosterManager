# Deployment Guide

## Quick Deployment Steps

### 1. Backend (Render - Free)

1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Settings:
   - **Name**: `wow-roster-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   ```
   PORT=3000
   GOOGLE_CLIENT_ID=<from Google Cloud Console>
   GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
   GOOGLE_REDIRECT_URI=https://<your-render-url>.onrender.com/auth/callback
   FRONTEND_URL=https://bisse123.github.io/WowRosterManager
   ```
6. Click **"Create Web Service"**
7. Copy your backend URL: `https://wow-roster-backend.onrender.com`

### 2. Frontend (GitHub Pages)

1. Create `frontend/.env.production`:
   ```
   VITE_BACKEND_URL=https://wow-roster-backend.onrender.com
   VITE_GOOGLE_CLIENT_ID=<from Google Cloud Console>
   ```

2. Install and deploy:
   ```bash
   cd frontend
   npm install
   npm run deploy
   ```

3. Enable GitHub Pages:
   - Go to your repo → Settings → Pages
   - Source: `gh-pages` branch
   - Save

4. Your site will be live at: `https://bisse123.github.io/WowRosterManager/`

### 3. Update Google OAuth

Go to [Google Cloud Console](https://console.cloud.google.com/) → Your Project → Credentials:

**Authorized JavaScript origins:**
- `https://bisse123.github.io`

**Authorized redirect URIs:**
- `https://wow-roster-backend.onrender.com/auth/callback`

Click **Save**.

## Testing

1. Visit your GitHub Pages URL
2. Login with Google
3. Enter a test spreadsheet ID
4. Create session and test drag-and-drop

## Notes

- Backend on Render free tier spins down after 15 min inactivity
- First request after spin-down takes ~30-60 seconds
- Consider upgrading to paid tier for always-on backend