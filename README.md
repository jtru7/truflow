# TRUFlow

A personal productivity dashboard that combines four workflow tools into one:

- **Pomodoro Timer** — 25/5 focus sessions with chime alerts
- **Time Tracker** — Clock in/out to track how your 40-hour week is spent
- **Kanban Board** — Project status tracking with drag-and-drop cards
- **Daily To-Do List** — Prioritized tasks with overdue tracking

## Getting Started

1. Clone this repo
2. Open `index.html` in your browser
3. That's it — no build tools, no dependencies

## Live Site

[jtru7.github.io/truflow](https://jtru7.github.io/truflow)

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- localStorage for data persistence
- Google Sheets (via Apps Script) for backup/sync

## Project Structure

```
truflow/
├── index.html          # App shell
├── css/styles.css      # Styling
├── js/                 # JavaScript modules
├── assets/             # Audio files
├── apps-script/        # Google Apps Script backend
├── tests/              # Browser-based test suite
├── CLAUDE.md           # AI assistant context
└── README.md           # This file
```

## Development Phases

- [x] Phase 1: Foundation (repo, layout, storage)
- [ ] Phase 2: Pomodoro Timer
- [ ] Phase 3: Time Tracker
- [ ] Phase 4: Kanban Board
- [ ] Phase 5: Daily To-Do List
- [ ] Phase 6: Google Sheets Sync
- [ ] Phase 7: Polish & QA

## Running Tests

Open `tests/index.html` in your browser to run the test suite.

## Backup & Restore

- **Sync**: Push all data to Google Sheets via the Sync button
- **Restore**: Pull data from Google Sheets to rebuild localStorage
