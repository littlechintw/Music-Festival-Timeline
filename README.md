# Music Festival Planner

A Vue 3 + Vite static web app for music festival schedule planning, with PWA, offline support, JSON-driven dynamic festival loading, and GitHub Pages deployment.

## Features
- Festival list, detail, and timeline views
- My Plan (offline, notifications, Google Calendar export)
- Dynamic theme from festival logo
- JSON editor for community submissions
- PWA: offline, service worker, manifest
- GitHub Action for festival data pipeline

## Project Structure
```
/src
  /assets
  /components
  /stores
  /views
  /router
  /editor
  /pwa
  /utils
/public
/festivals
/.github/workflows
vite.config.js
```

## Getting Started
1. `npm install`
2. `npm run dev`
3. Visit `http://localhost:5173`

## Festival JSON Example
See `festivals/example-festival.json`.

## Data Pipeline
Festival JSONs are validated and published to a live branch via GitHub Actions.

## License
MIT
