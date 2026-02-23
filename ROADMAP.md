# TRUFlow — Feature Roadmap

Suggested improvements, roughly sorted by value vs. effort. Not a commitment — just a running list to pull from.

---

## High Priority

- **Google Sheets sync (Phase 6)** — data backup/restore via Apps Script. Biggest risk: localStorage can be wiped. Already architected in `Storage.exportAll()` / `Storage.importAll()`.

- **To-do task editing** — tasks are currently add-or-delete only. Can't fix a typo, change priority, or update due date after creation. Need an edit modal or inline tap-to-edit.

- **Pomodoro session counter** — simple "✓ 3 today" tally below the timer. Increment on each `_complete()` for work mode, persist to localStorage. Very motivating.

---

## Medium Priority

- **Clear completed tasks** — "Clear completed" button in the to-do panel (or auto-clear after 24h). Done tasks currently accumulate forever.

- **Time goal per project** — set an estimated total hours on a Kanban card. Show a mini progress bar toward that goal using the tracked time already displayed on cards.

- **Scratchpad / quick notes** — small freeform textarea, persists to localStorage. No structure, just a quick-save sticky-note area somewhere in the left or right panel.

- **CSV time log export** — download all time logs as a `.csv` file. One button, `Blob` download. Independent of Google Sheets; useful as a backup or for analysis elsewhere.

- **To-do task notes** — tasks only have text, priority, and due date. A notes field in an edit modal would let you attach context without creating a Kanban card for everything.

---

## Polish / UX

- **Keyboard shortcuts** — `Ctrl+I` to clock in/out, `Space` to start/pause Pomodoro, `Ctrl+Enter` to add task, `Escape` to close any open modal.

- **Pomodoro ↔ Time Tracker link** — optionally auto-log a time entry to the active bucket when a Pomodoro work session ends. Currently fully separate systems.

- **Sound toggle** — let users mute or adjust the Pomodoro chime volume in Settings. Right now it's always on.

- **Overdue task badge** — a visible count of overdue tasks somewhere prominent (e.g., panel heading or browser tab title).

---

## Lower Priority / Later

- **Card archiving** — move "Done" column cards to a hidden archive instead of letting them pile up. Archive viewable via a modal.

- **Label manager** — currently labels are free-text per card with no global list. A managed label set (like buckets) would allow consistent reuse and filtering.

- **Recurring to-do tasks** — tasks that repeat daily or weekly (e.g., "Check email", "Team standup"). Auto-recreate on the appropriate day.

- **Mobile responsiveness** — app is desktop-only (three-panel layout). A stacked single-column layout for narrow screens would extend usability.

---

## Completed

- [x] Three-panel layout, localStorage storage module, browser-based test runner
- [x] Pomodoro timer (work/break, +/- 1 min, chime, flash, tab countdown)
- [x] Time tracker (clock-in/out, buckets, elapsed, editable start time, recent entries, edit/delete logs)
- [x] Weekly totals sidebar + weekly report modal with Prev/Next navigation
- [x] Kanban board (5 columns, drag-and-drop, card CRUD, labels, checklist, priority, total time on card)
- [x] Project details panel (auto-updates on clock-in, interactive checklist)
- [x] Daily to-do list (H/M/L priority, due dates, overdue section, sort)
- [x] Settings modal (Pomodoro durations, bucket management)
- [x] Deep navy + bronze color theme
- [x] Font upgrade to Inter
