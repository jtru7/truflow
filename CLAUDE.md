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
│   ├── app.js              # App init, panel orchestration, project details panel
│   ├── pomodoro.js         # Pomodoro timer logic
│   ├── timeTracker.js      # Clock-in/out, buckets, log editing, weekly report
│   ├── kanban.js           # Kanban board, drag-and-drop, card CRUD
│   ├── todoList.js         # Daily to-do list (upcoming)
│   ├── storage.js          # localStorage helpers (all keys prefixed truflow_)
│   ├── sheetsSync.js       # Google Sheets sync (upcoming)
│   └── settings.js         # Settings/preferences (upcoming)
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
- **Cross-module calls guarded** — e.g., `if (typeof App !== 'undefined')` so modules work standalone in tests

## Data Model (localStorage keys)
- `truflow_projects` — Kanban card array
- `truflow_tasks` — To-do item array
- `truflow_timeLogs` — Clock-in/out session array `{ id, bucket, start (ISO), end (ISO) }`
- `truflow_settings` — User preferences (buckets, labels, durations)
- `truflow_activeTimer` — Currently active clock-in session `{ bucket, startTime (ISO) }` or null
- `truflow_pomodoroState` — Pomodoro timer state

## UI Layout
Three-panel dashboard:
- **Left:** Pomodoro timer (top), Clock-in/out + weekly totals + recent entries (middle), Project details (bottom)
- **Center:** Kanban board with 5 columns (Queue, In Progress, On Hold, Done, Backburner)
- **Right:** Daily to-do list with priority sorting and overdue section

## Implemented Features

### Pomodoro (`js/pomodoro.js`)
- 25/5 default, +/- 1min buttons (disabled while running), chime + display flash, browser tab countdown

### Time Tracker (`js/timeTracker.js`)
- Bucket dropdown (named buckets + Kanban projects as `project:<id>`)
- Clock-in/out; one session at a time
- Editable start time while clocked in (rejects future times)
- Weekly totals by bucket (Mon–Sun), sorted by most time
- "Report" link opens weekly report modal: Mon–Sun columns × bucket rows, day totals, week total
- Recent entries list (last 5), each with ✏ edit button → log edit modal (date, start, end, delete)
- Midnight-crossover handling: if edited end ≤ start, adds 1 day to end

### Kanban (`js/kanban.js`)
- 5-column board: Queue, In Progress, On Hold, Done, Backburner
- Drag-and-drop between columns
- Card modal: name, priority (H/M/L/none), column, description, labels, checklist
- `App.refreshBucketDropdown()` called after save/delete (guarded)
- `App.refreshProjectDetails()` called after save/delete (guarded)

### App / Project Details (`js/app.js`)
- Populates tracker bucket dropdown from settings + projects
- `updateProjectDetails(bucket)` — renders active project info in left panel bottom
- `refreshProjectDetails()` — re-renders after Kanban card edit
- Project details shows: name, priority badge, column status, description, labels, interactive checklist

## Bucket Convention
- Named buckets: plain string, e.g. `"Email"`, `"Meetings"`
- Project buckets: `"project:<id>"` — resolved to project name via `_resolveProjectName()`

## Git Conventions
- Repo: `jtru7/truflow`
- Committer: `Trujillo <jtru7@byui.edu>`
- Branch: `master`
- Commit style: conventional (e.g., "feat: add pomodoro timer", "fix: bucket dropdown")

## Testing
- Open `tests/index.html` in browser to run all tests
- Tests use a simple assertion-based runner (no external dependencies)
- All new DOM refs in modules must be null-guarded so tests pass without `app.js`
- Test stubs live in `tests/index.html` hidden divs

## Upcoming
- Phase 5: Daily To-Do List (`js/todoList.js`)
- Phase 6: Google Sheets Sync (`js/sheetsSync.js`)
- Phase 7: Settings panel — bucket management, Pomodoro duration config
