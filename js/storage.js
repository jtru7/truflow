/**
 * TRUFlow — Storage Module
 * Handles all localStorage read/write operations.
 * All keys are prefixed with "truflow_" to avoid collisions.
 */

const Storage = (() => {
  const PREFIX = 'truflow_';

  // --- Core helpers ---

  function getItem(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`Storage.getItem("${key}") failed:`, e);
      return null;
    }
  }

  function setItem(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage.setItem("${key}") failed:`, e);
    }
  }

  function removeItem(key) {
    localStorage.removeItem(PREFIX + key);
  }

  // --- Domain-specific accessors ---

  // Projects (Kanban cards)
  function getProjects() {
    return getItem('projects') || [];
  }

  function saveProjects(projects) {
    setItem('projects', projects);
  }

  // Tasks (Daily to-do list)
  function getTasks() {
    return getItem('tasks') || [];
  }

  function saveTasks(tasks) {
    setItem('tasks', tasks);
  }

  // Time logs — array of { id, bucket, start, end }
  function getTimeLogs() {
    return getItem('timeLogs') || [];
  }

  function saveTimeLogs(logs) {
    setItem('timeLogs', logs);
  }

  // Active timer — { bucket, startTime } or null
  function getActiveTimer() {
    return getItem('activeTimer');
  }

  function saveActiveTimer(timer) {
    if (timer === null) {
      removeItem('activeTimer');
    } else {
      setItem('activeTimer', timer);
    }
  }

  // Pomodoro state — { remaining, isRunning, mode }
  function getPomodoroState() {
    return getItem('pomodoroState');
  }

  function savePomodoroState(state) {
    setItem('pomodoroState', state);
  }

  // Settings — { buckets, labels, pomoDuration, breakDuration }
  function getSettings() {
    return getItem('settings') || defaultSettings();
  }

  function saveSettings(settings) {
    setItem('settings', settings);
  }

  function defaultSettings() {
    return {
      buckets: ['Email', 'Meetings', 'Tinkering/Research', 'Whirlwind', 'EDCOR'],
      labels: [],
      pomoDuration: 25,
      breakDuration: 5,
      kanbanColumns: ['queue', 'in-progress', 'on-hold', 'done', 'backburner']
    };
  }

  // --- Export all data (for sync) ---

  function exportAll() {
    return {
      projects: getProjects(),
      tasks: getTasks(),
      timeLogs: getTimeLogs(),
      settings: getSettings(),
      exportedAt: new Date().toISOString()
    };
  }

  // --- Import all data (from sync/restore) ---

  function importAll(data) {
    if (data.projects) saveProjects(data.projects);
    if (data.tasks) saveTasks(data.tasks);
    if (data.timeLogs) saveTimeLogs(data.timeLogs);
    if (data.settings) saveSettings(data.settings);
  }

  // --- Clear all TRUFlow data ---

  function clearAll() {
    const keys = ['projects', 'tasks', 'timeLogs', 'settings', 'activeTimer', 'pomodoroState'];
    keys.forEach(key => removeItem(key));
  }

  // --- Initialize defaults if first run ---

  function initDefaults() {
    if (!getItem('settings')) {
      saveSettings(defaultSettings());
    }
    if (!getItem('projects')) {
      saveProjects([]);
    }
    if (!getItem('tasks')) {
      saveTasks([]);
    }
    if (!getItem('timeLogs')) {
      saveTimeLogs([]);
    }
  }

  // Public API
  return {
    getItem,
    setItem,
    removeItem,
    getProjects,
    saveProjects,
    getTasks,
    saveTasks,
    getTimeLogs,
    saveTimeLogs,
    getActiveTimer,
    saveActiveTimer,
    getPomodoroState,
    savePomodoroState,
    getSettings,
    saveSettings,
    defaultSettings,
    exportAll,
    importAll,
    clearAll,
    initDefaults
  };
})();
