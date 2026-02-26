```markdown
# Wow Roster Manager (Simple Website)

A small, frontend-only static web app for managing a World of Warcraft raid roster. This repository currently contains a simple React + Vite single-page app. Data is stored locally in the browser (localStorage)

**Status:** Simple frontend site (branch: `simple_website`).

## Features

- Drag & drop roster management
- Automatic raid buff/coverage detection
- Add/edit/remove players and alt specs
- Responsive design for desktop and mobile
- Export / import via TSV

## Tech Stack

- **Frontend:** React, Vite
- **Drag & Drop:** @dnd-kit
- **Persistence:** Browser `localStorage` (client-side)
- **Build / Deploy:** Vite, optional `gh-pages` deploy script

## Prerequisites

- Node.js 18+ and npm

## Local development

1. Install dependencies and run the dev server:

```bash
cd frontend
npm install
npm run dev
```

2. Open the site at the address shown by Vite (usually http://localhost:5173).

## Build and preview

```bash
cd frontend
npm run build
npm run preview
```

## Deploy to GitHub Pages (optional)

The frontend contains a convenience script that uses `gh-pages` to publish the `dist` folder.

```bash
cd frontend
npm run deploy
```

Note: You only need to deploy if you want to host the static site. No backend is necessary.


## Where to look in the code

- Frontend app entry: [frontend/src/main.jsx](frontend/src/main.jsx#L1)
- Main app component: [frontend/src/App.jsx](frontend/src/App.jsx#L1)
- Styles: [frontend/src/styles/App.css](frontend/src/styles/App.css#L1)

## Support

Open an issue in this repository if you need help or want to suggest changes.

---

Simple site maintained with ❤️ — enjoy!
```
