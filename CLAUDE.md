# TRUFlow — AI Assistant Context

## What is TRUFlow?
A personal productivity dashboard that combines a Pomodoro timer, time tracker (clock-in/out), Kanban project board, and daily to-do list into a single web app. Built for desktop use only, hosted on GitHub Pages.

## Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript — no frameworks, no build tools
- **Storage:** localStorage (active data) + Google Sheets via Apps Script (sync/backup)
- **Hosting:** GitHub Pages at `jtru7.github.io/truflow`
- **Testing:** Browser-based test runner at `tests/index.html`

## File Structure
```
truflow/
├── index.html              # Single-page app shell
├── css/styles.css          # All styling
├── js/
│   ├── app.js              # App init, panel orchestration
│   ├── pomodoro.js         # Pomodoro timer logic
│   ├── timeTracker.js      # Clock-in/out, buckets
│   ├── kanban.js           # Kanban board, drag-and-drop, card CRUD
│   ├── todoList.js         # Daily to-do list
│   ├── storage.js          # localStorage helpers (all keys prefixed truflow_)
│   ├── sheetsSync.js       # Google Sheets sync
│   └── settings.js         # Settings/preferences
├── assets/chime.mp3        # Pomodoro completion sound
├── apps-script/Code.gs     # Google Apps Script backend
├── tests/                  # Browser-based unit tests
├── CLAUDE.md               # This file
└── README.md
```

## Architecture Decisions
- **No database** — localStorage is primary, Google Sheets is backup
- **No npm/node** — everything runs in the browser
- **Single HTML page** — all panels rendered in index.html
- **Module pattern** — each JS file exposes a module via IIFE (e.g., `Storage`, `App`, `Pomodoro`)
- **All localStorage keys** prefixed with `truflow_` to avoid collisions

## Data Model (localStorage keys)
- `truflow_projects` — Kanban card array
- `truflow_tasks` — To-do item array
- `truflow_timeLogs` — Clock-in/out session array
- `truflow_settings` — User preferences (buckets, labels, durations)
- `truflow_activeTimer` — Currently active clock-in session or null
- `truflow_pomodoroState` — Pomodoro timer state

## UI Layout
Three-panel dashboard:
- **Left:** Pomodoro timer (top), Clock-in/out (middle), Project details (bottom)
- **Center:** Kanban board with 5 columns (Queue, In Progress, On Hold, Done, Backburner)
- **Right:** Daily to-do list with priority sorting and overdue section

## Key Features
1. **Pomodoro:** 25/5 default, +/- 1min buttons, chime + flash, browser tab countdown
2. **Time Tracker:** Customizable buckets, one clock at a time, weekly totals
3. **Kanban:** Drag-and-drop cards, checklists, labels, priority, archive to Sheets
4. **To-Do:** Priority H/M/L, due dates, auto-carry incomplete tasks, overdue section
5. **Sync:** Manual push/pull to one Google Sheet with multiple tabs

## Git Conventions
- Repo: `jtru7/truflow`
- Committer: `Trujillo <jtru7@byui.edu>`
- Branch: `main` only
- Commit style: conventional (e.g., "feat: add pomodoro timer", "fix: bucket dropdown")

## Testing
- Open `tests/index.html` in browser to run all tests
- Tests use a simple assertion-based runner (no external dependencies)
