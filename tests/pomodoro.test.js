/**
 * TRUFlow — Pomodoro Module Tests
 *
 * Relies on stub DOM elements defined in tests/index.html and
 * Pomodoro.init() being called once before these suites run.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clickStart()  { document.getElementById('pomo-start').click(); }
function clickReset()  { document.getElementById('pomo-reset').click(); }
function clickMinus()  { document.getElementById('pomo-minus').click(); }
function clickPlus()   { document.getElementById('pomo-plus').click();  }
function getDisplay()  { return document.getElementById('pomo-display').textContent; }
function getStatus()   { return document.getElementById('pomo-status').textContent;  }
function startBtn()    { return document.getElementById('pomo-start'); }
function minusBtn()    { return document.getElementById('pomo-minus'); }
function plusBtn()     { return document.getElementById('pomo-plus');  }

function freshInit() {
  Storage.clearAll();
  Storage.initDefaults();
  Pomodoro.init(); // re-reads storage; event listeners only bound once
}

// ─── Suites ──────────────────────────────────────────────────────────────────

describe('Pomodoro — formatTime', () => {
  it('formats zero as 00:00', () => {
    assertEqual(Pomodoro.formatTime(0), '00:00');
  });

  it('formats 25 minutes as 25:00', () => {
    assertEqual(Pomodoro.formatTime(1500), '25:00');
  });

  it('pads single-digit minutes and seconds', () => {
    assertEqual(Pomodoro.formatTime(599), '09:59');
  });

  it('formats 60 minutes as 60:00', () => {
    assertEqual(Pomodoro.formatTime(3600), '60:00');
  });

  it('formats 1 second as 00:01', () => {
    assertEqual(Pomodoro.formatTime(1), '00:01');
  });
});

describe('Pomodoro — Initialization', () => {
  it('shows 25:00 when no saved state', () => {
    freshInit();
    assertEqual(getDisplay(), '25:00');
  });

  it('starts in work mode', () => {
    freshInit();
    assertEqual(getStatus(), 'Work Session');
  });

  it('start button reads "Start" initially', () => {
    freshInit();
    assertEqual(startBtn().textContent, 'Start');
  });

  it('adjustment buttons are enabled initially', () => {
    freshInit();
    assert(!minusBtn().disabled, '-1 button should be enabled');
    assert(!plusBtn().disabled,  '+1 button should be enabled');
  });

  it('restores remaining time from saved state', () => {
    Storage.savePomodoroState({ remaining: 720, isRunning: false, mode: 'work' });
    Pomodoro.init();
    assertEqual(getDisplay(), '12:00');
  });

  it('restores break mode from saved state', () => {
    Storage.savePomodoroState({ remaining: 300, isRunning: false, mode: 'break' });
    Pomodoro.init();
    assertEqual(getStatus(), 'Break');
  });

  it('never auto-resumes even if saved state had isRunning: true', () => {
    Storage.savePomodoroState({ remaining: 900, isRunning: true, mode: 'work' });
    Pomodoro.init();
    assertEqual(startBtn().textContent, 'Start', 'Should still show Start, not Pause');
    assert(!Pomodoro.getState().isRunning, 'Should not be running after init');
  });
});

describe('Pomodoro — Reset', () => {
  it('resets display to 25:00', () => {
    freshInit();
    clickMinus(); // change the time first
    clickReset();
    assertEqual(getDisplay(), '25:00');
  });

  it('resets to work mode', () => {
    Storage.savePomodoroState({ remaining: 300, isRunning: false, mode: 'break' });
    Pomodoro.init();
    clickReset();
    assertEqual(getStatus(), 'Work Session');
  });

  it('saves correct state to storage after reset', () => {
    freshInit();
    clickReset();
    const state = Storage.getPomodoroState();
    assertEqual(state.remaining, 1500);
    assertEqual(state.mode, 'work');
    assertEqual(state.isRunning, false);
  });

  it('start button reads "Start" after reset from running', () => {
    freshInit();
    clickStart(); // start it
    clickReset(); // then reset
    assertEqual(startBtn().textContent, 'Start');
  });
});

describe('Pomodoro — Time Adjustment', () => {
  it('+1 min increases display by 1 minute', () => {
    freshInit(); // 25:00 = 1500s
    clickPlus();
    assertEqual(getDisplay(), '26:00');
  });

  it('-1 min decreases display by 1 minute', () => {
    freshInit(); // 25:00
    clickMinus();
    assertEqual(getDisplay(), '24:00');
  });

  it('cannot go below 1 minute (floor at 01:00)', () => {
    Storage.savePomodoroState({ remaining: 60, isRunning: false, mode: 'work' });
    Pomodoro.init();
    clickMinus(); // 60 - 60 = 0 → clamped to 60
    assertEqual(getDisplay(), '01:00');
  });

  it('cannot go above 60 minutes (ceiling at 60:00)', () => {
    Storage.savePomodoroState({ remaining: 3600, isRunning: false, mode: 'work' });
    Pomodoro.init();
    clickPlus(); // 3600 + 60 → clamped to 3600
    assertEqual(getDisplay(), '60:00');
  });

  it('saves state to storage after adjustment', () => {
    freshInit(); // 1500s
    clickPlus();
    assertEqual(Storage.getPomodoroState().remaining, 1560);
  });
});

describe('Pomodoro — Start / Pause', () => {
  it('start changes button text to "Pause"', () => {
    freshInit();
    clickStart();
    assertEqual(startBtn().textContent, 'Pause');
    clickReset(); // clean up interval
  });

  it('start disables adjustment buttons', () => {
    freshInit();
    clickStart();
    assert(minusBtn().disabled, '-1 should be disabled while running');
    assert(plusBtn().disabled,  '+1 should be disabled while running');
    clickReset();
  });

  it('pause restores "Start" text', () => {
    freshInit();
    clickStart();
    clickStart(); // second click = pause
    assertEqual(startBtn().textContent, 'Start');
  });

  it('pause re-enables adjustment buttons', () => {
    freshInit();
    clickStart();
    clickStart(); // pause
    assert(!minusBtn().disabled, '-1 should be re-enabled after pause');
    assert(!plusBtn().disabled,  '+1 should be re-enabled after pause');
  });

  it('getState reflects running status', () => {
    freshInit();
    clickStart();
    assert(Pomodoro.getState().isRunning, 'Should report isRunning: true');
    clickReset();
  });

  it('adjustment clicks are ignored while running', () => {
    freshInit(); // 1500s
    clickStart();
    clickPlus(); // should be ignored
    assertEqual(Pomodoro.getState().remaining, 1500);
    clickReset();
  });
});
