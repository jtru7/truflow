# TRUFlow

A personal productivity dashboard that combines four workflow tools into one:

- **Pomodoro Timer** — 25/5 focus sessions with chime alerts and tab countdown
- **Time Tracker** — Clock in/out to track how your week is spent, with editable entries and weekly reports
- **Kanban Board** — Project status tracking with drag-and-drop cards, checklists, and labels
- **Daily To-Do List** — Prioritized tasks with overdue tracking *(coming soon)*

## Getting Started

1. Clone this repo
2. Open `index.html` in your browser
3. That's it — no build tools, no dependencies

## Live Site

[jtru7.github.io/truflow](https://jtru7.github.io/truflow)

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- localStorage for data persistence
- Google Sheets (via Apps Script) for backup/sync *(coming soon)*

## Project Structure

```
truflow/
├── index.html          # App shell
├── css/styles.css      # All styling
├── js/
│   ├── app.js          # App init, panel orchestration, project details
│   ├── pomodoro.js     # Pomodoro timer
│   ├── timeTracker.js  # Clock-in/out, buckets, log editing, weekly report
│   ├── kanban.js       # Kanban board, drag-and-drop, card CRUD
│   ├── storage.js      # localStorage helpers
│   └── ...             # todoList, sheetsSync, settings (upcoming)
├── assets/chime.mp3    # Pomodoro chime
├── apps-script/        # Google Apps Script backend
├── tests/              # Browser-based test suite
├── CLAUDE.md           # AI assistant context
└── README.md           # This file
```

## Development Phases

- [x] Phase 1: Foundation (repo, layout, storage module, test runner)
- [x] Phase 2: Pomodoro Timer (countdown, +/- 1min, chime, tab title)
- [x] Phase 3: Time Tracker (clock-in/out, weekly totals, entry editing, weekly report)
- [x] Phase 4: Kanban Board (drag-and-drop, card CRUD, project details panel)
- [ ] Phase 5: Daily To-Do List
- [ ] Phase 6: Google Sheets Sync
- [ ] Phase 7: Settings & Polish

## Completed Features

### Pomodoro Timer
- 25-minute work / 5-minute break sessions
- +1 / -1 minute adjustment buttons (works while stopped)
- Audio chime + display flash on session end
- Browser tab shows live countdown

### Time Tracker
- Clock in/out against named buckets or Kanban projects
- Edit active session start time while clocked in
- Recent entries list (last 5) with per-entry edit/delete modal
- Weekly totals summary by bucket
- **Weekly report modal** — day-by-day breakdown (Mon–Sun) with per-bucket rows and daily/weekly totals

### Kanban Board
- 5 columns: Queue, In Progress, On Hold, Done, Backburner
- Drag-and-drop cards between columns
- Per-card: name, priority (H/M/L), description/notes, labels, checklist with progress bar
- **Project details panel** — left panel shows live details of the clocked-in project including interactive checklist

## Running Tests

Open `tests/index.html` in your browser to run the full test suite (no dependencies required).

## Backup & Restore

- **Sync**: Push all data to Google Sheets via the Sync button *(coming soon)*
- **Restore**: Pull data from Google Sheets to rebuild localStorage *(coming soon)*
