/**
 * TRUFlow — Pomodoro Timer Module
 * Manages the work/break countdown, UI updates, and state persistence.
 */

const Pomodoro = (() => {
  let remaining = 0;      // seconds left in current session
  let isRunning = false;
  let mode = 'work';      // 'work' | 'break'
  let intervalId = null;
  let _bound = false;     // prevents duplicate event listeners on re-init

  // DOM refs — populated in init()
  let display, startBtn, resetBtn, minusBtn, plusBtn, statusEl;

  function init() {
    display   = document.getElementById('pomo-display');
    startBtn  = document.getElementById('pomo-start');
    resetBtn  = document.getElementById('pomo-reset');
    minusBtn  = document.getElementById('pomo-minus');
    plusBtn   = document.getElementById('pomo-plus');
    statusEl  = document.getElementById('pomo-status');

    // Restore persisted state (but never auto-resume — user must click Start)
    const saved = Storage.getPomodoroState();
    if (saved && typeof saved.remaining === 'number') {
      remaining = saved.remaining;
      mode = saved.mode || 'work';
    } else {
      _resetToDefaults();
    }

    _updateDisplay();
    _updateStatus();

    if (!_bound) {
      startBtn.addEventListener('click', _toggleStart);
      resetBtn.addEventListener('click', reset);
      minusBtn.addEventListener('click', () => _adjustTime(-60));
      plusBtn.addEventListener('click',  () => _adjustTime(60));
      _bound = true;
    }
  }

  // --- Public ---

  function reset() {
    _pause();
    _resetToDefaults();
    _updateDisplay();
    _updateStatus();
    _saveState();
    document.title = 'TRUFlow';
  }

  // --- Private ---

  function _toggleStart() {
    if (isRunning) {
      _pause();
    } else {
      _start();
    }
  }

  function _start() {
    isRunning = true;
    startBtn.textContent = 'Pause';
    minusBtn.disabled = true;
    plusBtn.disabled = true;
    intervalId = setInterval(_tick, 1000);
    _saveState();
  }

  function _pause() {
    if (!isRunning) return;
    isRunning = false;
    startBtn.textContent = 'Start';
    minusBtn.disabled = false;
    plusBtn.disabled = false;
    clearInterval(intervalId);
    intervalId = null;
    _saveState();
    document.title = 'TRUFlow';
  }

  function _tick() {
    if (remaining <= 0) {
      _complete();
      return;
    }
    remaining--;
    _updateDisplay();
    document.title = `${formatTime(remaining)} — TRUFlow`;
    _saveState();
  }

  function _complete() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    startBtn.textContent = 'Start';
    minusBtn.disabled = false;
    plusBtn.disabled = false;

    _playChime();
    _flashDisplay();

    // Switch modes
    const settings = Storage.getSettings();
    if (mode === 'work') {
      mode = 'break';
      remaining = (settings.breakDuration || 5) * 60;
    } else {
      mode = 'work';
      remaining = (settings.pomoDuration || 25) * 60;
    }

    _updateDisplay();
    _updateStatus();
    _saveState();
    document.title = 'TRUFlow';
  }

  function _adjustTime(deltaSecs) {
    if (isRunning) return;
    const MIN = 60;      // 1 minute floor
    const MAX = 3600;    // 60 minute ceiling
    remaining = Math.min(MAX, Math.max(MIN, remaining + deltaSecs));
    _updateDisplay();
    _saveState();
  }

  function _resetToDefaults() {
    const settings = Storage.getSettings();
    mode = 'work';
    remaining = (settings.pomoDuration || 25) * 60;
  }

  function _updateDisplay() {
    display.textContent = formatTime(remaining);
  }

  function _updateStatus() {
    statusEl.textContent = mode === 'work' ? 'Work Session' : 'Break';
    // Tint the status label to hint the current mode
    statusEl.style.color = mode === 'break'
      ? 'var(--color-success)'
      : '';
  }

  function _saveState() {
    Storage.savePomodoroState({ remaining, isRunning, mode });
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function getState() {
    return { remaining, isRunning, mode };
  }

  function _playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Three-note ascending chime: C5 → E5 → G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.28;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        osc.start(t);
        osc.stop(t + 0.9);
      });
    } catch (e) {}
  }

  function _flashDisplay() {
    display.classList.add('pomo-flash');
    // Remove class after animation ends (3 iterations × 0.5s each = 1.5s)
    setTimeout(() => display.classList.remove('pomo-flash'), 1500);
  }

  return { init, reset, formatTime, getState };
})();
