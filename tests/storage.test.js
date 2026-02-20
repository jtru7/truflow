/**
 * TRUFlow — Storage Module Tests
 */

// Clear any leftover test data before running
Storage.clearAll();

describe('Storage — Core Helpers', () => {
  it('should store and retrieve a value', () => {
    Storage.setItem('test_key', { foo: 'bar' });
    const result = Storage.getItem('test_key');
    assertDeepEqual(result, { foo: 'bar' });
    Storage.removeItem('test_key');
  });

  it('should return null for missing keys', () => {
    const result = Storage.getItem('nonexistent_key');
    assertEqual(result, null);
  });

  it('should remove items', () => {
    Storage.setItem('to_remove', 'value');
    Storage.removeItem('to_remove');
    assertEqual(Storage.getItem('to_remove'), null);
  });
});

describe('Storage — Default Initialization', () => {
  it('should initialize defaults on first run', () => {
    Storage.clearAll();
    Storage.initDefaults();

    const settings = Storage.getSettings();
    assert(settings !== null, 'Settings should exist');
    assert(Array.isArray(settings.buckets), 'Buckets should be an array');
    assertEqual(settings.pomoDuration, 25);
    assertEqual(settings.breakDuration, 5);
  });

  it('should include default buckets', () => {
    const settings = Storage.getSettings();
    assert(settings.buckets.includes('Email'), 'Should have Email bucket');
    assert(settings.buckets.includes('Meetings'), 'Should have Meetings bucket');
    assert(settings.buckets.includes('Whirlwind'), 'Should have Whirlwind bucket');
    assert(settings.buckets.includes('EDCOR'), 'Should have EDCOR bucket');
  });

  it('should initialize empty arrays for projects, tasks, timeLogs', () => {
    assertDeepEqual(Storage.getProjects(), []);
    assertDeepEqual(Storage.getTasks(), []);
    assertDeepEqual(Storage.getTimeLogs(), []);
  });

  it('should not overwrite existing settings on re-init', () => {
    const settings = Storage.getSettings();
    settings.pomoDuration = 30;
    Storage.saveSettings(settings);

    Storage.initDefaults();

    assertEqual(Storage.getSettings().pomoDuration, 30);
  });
});

describe('Storage — Projects', () => {
  it('should save and retrieve projects', () => {
    const projects = [
      { id: '1', name: 'Project A', column: 'queue' },
      { id: '2', name: 'Project B', column: 'in-progress' }
    ];
    Storage.saveProjects(projects);
    assertDeepEqual(Storage.getProjects(), projects);
  });
});

describe('Storage — Tasks', () => {
  it('should save and retrieve tasks', () => {
    const tasks = [
      { id: '1', text: 'Do something', priority: 'high', completed: false },
      { id: '2', text: 'Do another thing', priority: 'low', completed: true }
    ];
    Storage.saveTasks(tasks);
    assertDeepEqual(Storage.getTasks(), tasks);
  });
});

describe('Storage — Time Logs', () => {
  it('should save and retrieve time logs', () => {
    const logs = [
      { id: '1', bucket: 'Email', start: '2026-02-20T09:00:00Z', end: '2026-02-20T09:30:00Z' }
    ];
    Storage.saveTimeLogs(logs);
    assertDeepEqual(Storage.getTimeLogs(), logs);
  });
});

describe('Storage — Active Timer', () => {
  it('should save and retrieve active timer', () => {
    const timer = { bucket: 'Meetings', startTime: '2026-02-20T10:00:00Z' };
    Storage.saveActiveTimer(timer);
    assertDeepEqual(Storage.getActiveTimer(), timer);
  });

  it('should clear active timer when set to null', () => {
    Storage.saveActiveTimer(null);
    assertEqual(Storage.getActiveTimer(), null);
  });
});

describe('Storage — Export / Import', () => {
  it('should export all data', () => {
    Storage.clearAll();
    Storage.initDefaults();
    Storage.saveProjects([{ id: '1', name: 'Test' }]);
    Storage.saveTasks([{ id: '1', text: 'Task' }]);

    const exported = Storage.exportAll();
    assert(exported.exportedAt, 'Should have exportedAt timestamp');
    assertEqual(exported.projects.length, 1);
    assertEqual(exported.tasks.length, 1);
    assert(Array.isArray(exported.timeLogs), 'TimeLogs should be an array');
    assert(exported.settings !== null, 'Settings should exist');
  });

  it('should import data and overwrite localStorage', () => {
    Storage.clearAll();
    const data = {
      projects: [{ id: '99', name: 'Imported' }],
      tasks: [{ id: '99', text: 'Imported Task' }],
      timeLogs: [],
      settings: Storage.defaultSettings()
    };
    Storage.importAll(data);

    assertEqual(Storage.getProjects()[0].name, 'Imported');
    assertEqual(Storage.getTasks()[0].text, 'Imported Task');
  });
});

describe('Storage — Clear All', () => {
  it('should clear all TRUFlow data', () => {
    Storage.initDefaults();
    Storage.saveProjects([{ id: '1' }]);
    Storage.clearAll();

    assertDeepEqual(Storage.getProjects(), []);
    assertDeepEqual(Storage.getTasks(), []);
    assertDeepEqual(Storage.getTimeLogs(), []);
    assertEqual(Storage.getActiveTimer(), null);
  });
});
