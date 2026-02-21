/**
 * TRUFlow — Time Tracker Module Tests
 *
 * Relies on stub DOM elements defined in tests/index.html and
 * TimeTracker.init() being called once before these suites run.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clickToggle()      { document.getElementById('tracker-toggle').click(); }
function getToggleText()    { return document.getElementById('tracker-toggle').textContent; }
function getElapsedText()   { return document.getElementById('tracker-elapsed').textContent; }
function getBucketSelect()  { return document.getElementById('tracker-bucket'); }
function selectBucket(val)  { getBucketSelect().value = val; }

function freshTrackerInit() {
  Storage.clearAll();
  Storage.initDefaults();
  TimeTracker.init();
}

// ─── Helpers for calculateWeeklyTotals ───────────────────────────────────────

function isoThisWeek(dayOffset = 0, hour = 9) {
  // Returns an ISO string for a time this week (Monday + dayOffset, at given hour)
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const toMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + toMonday + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isoLastWeek(hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── Suites ──────────────────────────────────────────────────────────────────

describe('TimeTracker — formatElapsed', () => {
  it('formats 0 seconds as 0:00:00', () => {
    assertEqual(TimeTracker.formatElapsed(0), '0:00:00');
  });

  it('formats 61 seconds as 0:01:01', () => {
    assertEqual(TimeTracker.formatElapsed(61), '0:01:01');
  });

  it('formats 3600 seconds as 1:00:00', () => {
    assertEqual(TimeTracker.formatElapsed(3600), '1:00:00');
  });

  it('formats 3661 seconds as 1:01:01', () => {
    assertEqual(TimeTracker.formatElapsed(3661), '1:01:01');
  });

  it('formats 86399 seconds as 23:59:59', () => {
    assertEqual(TimeTracker.formatElapsed(86399), '23:59:59');
  });

  it('pads minutes and seconds but not hours', () => {
    assertEqual(TimeTracker.formatElapsed(3665), '1:01:05');
  });
});

describe('TimeTracker — calculateWeeklyTotals', () => {
  it('returns empty object for no logs', () => {
    assertDeepEqual(TimeTracker.calculateWeeklyTotals([]), {});
  });

  it('returns empty object for logs from last week', () => {
    const logs = [{
      id: '1',
      bucket: 'Email',
      start: isoLastWeek(9),
      end: isoLastWeek(10)
    }];
    assertDeepEqual(TimeTracker.calculateWeeklyTotals(logs), {});
  });

  it('includes logs from this week', () => {
    const start = isoThisWeek(0, 9);  // Monday 9am
    const end   = isoThisWeek(0, 10); // Monday 10am
    const logs = [{ id: '1', bucket: 'Email', start, end }];
    const totals = TimeTracker.calculateWeeklyTotals(logs);
    assertEqual(totals['Email'], 3600);
  });

  it('sums multiple logs for the same bucket', () => {
    const logs = [
      { id: '1', bucket: 'Meetings', start: isoThisWeek(0, 9), end: isoThisWeek(0, 10) },
      { id: '2', bucket: 'Meetings', start: isoThisWeek(1, 9), end: isoThisWeek(1, 10) }
    ];
    const totals = TimeTracker.calculateWeeklyTotals(logs);
    assertEqual(totals['Meetings'], 7200);
  });

  it('tracks separate buckets independently', () => {
    const logs = [
      { id: '1', bucket: 'Email',    start: isoThisWeek(0, 9),  end: isoThisWeek(0, 10) },
      { id: '2', bucket: 'Meetings', start: isoThisWeek(0, 11), end: isoThisWeek(0, 12) }
    ];
    const totals = TimeTracker.calculateWeeklyTotals(logs);
    assertEqual(totals['Email'], 3600);
    assertEqual(totals['Meetings'], 3600);
  });

  it('excludes logs with no end time', () => {
    const logs = [{ id: '1', bucket: 'Email', start: isoThisWeek(0, 9), end: null }];
    assertDeepEqual(TimeTracker.calculateWeeklyTotals(logs), {});
  });

  it('excludes logs with missing start', () => {
    const logs = [{ id: '1', bucket: 'Email', start: null, end: isoThisWeek(0, 10) }];
    assertDeepEqual(TimeTracker.calculateWeeklyTotals(logs), {});
  });
});

describe('TimeTracker — Clock In', () => {
  it('does nothing if no bucket is selected', () => {
    freshTrackerInit();
    selectBucket('');
    clickToggle();
    assertEqual(Storage.getActiveTimer(), null);
    assertEqual(TimeTracker.getState().isRunning, false);
  });

  it('clocks in when a bucket is selected', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle();
    assert(TimeTracker.getState().isRunning, 'Should be running after clock in');
  });

  it('saves active timer to storage on clock in', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle();
    const saved = Storage.getActiveTimer();
    assert(saved !== null, 'Active timer should be saved');
    assertEqual(saved.bucket, 'Email');
    assert(typeof saved.startTime === 'string', 'startTime should be a string');
  });

  it('changes button text to "Clock Out"', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle();
    assertEqual(getToggleText(), 'Clock Out');
  });

  it('disables the bucket select while running', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle();
    assert(getBucketSelect().disabled, 'Bucket select should be disabled while clocked in');
  });
});

describe('TimeTracker — Clock Out', () => {
  it('clocks out and saves a time log', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle(); // clock in
    clickToggle(); // clock out
    const logs = Storage.getTimeLogs();
    assertEqual(logs.length, 1);
    assertEqual(logs[0].bucket, 'Email');
    assert(typeof logs[0].start === 'string', 'Log should have a start');
    assert(typeof logs[0].end === 'string',   'Log should have an end');
  });

  it('clears active timer from storage on clock out', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle(); // clock in
    clickToggle(); // clock out
    assertEqual(Storage.getActiveTimer(), null);
  });

  it('changes button text back to "Clock In"', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle(); // clock in
    clickToggle(); // clock out
    assertEqual(getToggleText(), 'Clock In');
  });

  it('re-enables the bucket select after clock out', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle(); // clock in
    clickToggle(); // clock out
    assert(!getBucketSelect().disabled, 'Bucket select should be enabled after clock out');
  });

  it('reports isRunning: false after clock out', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle(); // clock in
    clickToggle(); // clock out
    assert(!TimeTracker.getState().isRunning, 'Should not be running after clock out');
  });

  it('resets elapsed display to 0:00:00 after clock out', () => {
    freshTrackerInit();
    selectBucket('Email');
    clickToggle(); // clock in
    clickToggle(); // clock out
    assertEqual(getElapsedText(), '0:00:00');
  });
});

describe('TimeTracker — State Restoration', () => {
  it('resumes running if active timer is in storage on init', () => {
    Storage.clearAll();
    Storage.initDefaults();
    Storage.saveActiveTimer({
      bucket: 'Email',
      startTime: new Date(Date.now() - 5000).toISOString() // started 5s ago
    });
    TimeTracker.init();
    assert(TimeTracker.getState().isRunning, 'Should resume running from saved state');
    // Clean up
    document.getElementById('tracker-toggle').click(); // clock out
  });

  it('reports correct bucket from restored state', () => {
    Storage.clearAll();
    Storage.initDefaults();
    Storage.saveActiveTimer({
      bucket: 'Meetings',
      startTime: new Date(Date.now() - 3000).toISOString()
    });
    TimeTracker.init();
    assertEqual(TimeTracker.getState().activeBucket, 'Meetings');
    document.getElementById('tracker-toggle').click(); // clock out
  });
});
