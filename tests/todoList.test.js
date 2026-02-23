// ─── TodoList Tests ────────────────────────────────────────────────────────

describe('TodoList — categorize', () => {
  const TODAY     = '2026-02-20';
  const YESTERDAY = '2026-02-19';
  const TOMORROW  = '2026-02-21';

  const tasks = [
    { id: '1', text: 'Overdue task',  priority: 'H', dueDate: YESTERDAY, done: false, createdDate: YESTERDAY },
    { id: '2', text: 'Today task',    priority: 'M', dueDate: TODAY,     done: false, createdDate: TODAY },
    { id: '3', text: 'No date task',  priority: '',  dueDate: null,      done: false, createdDate: TODAY },
    { id: '4', text: 'Future task',   priority: 'L', dueDate: TOMORROW,  done: false, createdDate: TODAY },
    { id: '5', text: 'Done task',     priority: '',  dueDate: null,      done: true,  createdDate: TODAY },
    { id: '6', text: 'Done overdue',  priority: 'H', dueDate: YESTERDAY, done: true,  createdDate: YESTERDAY }
  ];

  it('puts past-due incomplete tasks in overdue', () => {
    const { overdue } = TodoList.categorize(tasks, TODAY);
    assertEqual(overdue.length, 1);
    assertEqual(overdue[0].id, '1');
  });

  it('puts same-day, future, and no-date incomplete tasks in active', () => {
    const { active } = TodoList.categorize(tasks, TODAY);
    const ids = active.map(t => t.id).sort();
    assertDeepEqual(ids, ['2', '3', '4']);
  });

  it('puts done tasks in done regardless of due date', () => {
    const { done } = TodoList.categorize(tasks, TODAY);
    assertEqual(done.length, 2);
  });

  it('task with no due date is always active (never overdue)', () => {
    const t = [{ id: 'a', text: 'x', priority: '', dueDate: null, done: false, createdDate: TODAY }];
    const { active, overdue } = TodoList.categorize(t, TODAY);
    assertEqual(active.length, 1);
    assertEqual(overdue.length, 0);
  });

  it('done task with past due date is done, not overdue', () => {
    const t = [{ id: 'b', text: 'y', priority: 'H', dueDate: YESTERDAY, done: true, createdDate: YESTERDAY }];
    const { overdue, done } = TodoList.categorize(t, TODAY);
    assertEqual(overdue.length, 0);
    assertEqual(done.length, 1);
  });

  it('returns empty arrays when no tasks', () => {
    const { overdue, active, done } = TodoList.categorize([], TODAY);
    assertEqual(overdue.length, 0);
    assertEqual(active.length, 0);
    assertEqual(done.length, 0);
  });
});

describe('TodoList — sortTasks', () => {
  it('sorts H before M before L before none', () => {
    const tasks = [
      { id: '1', priority: '',  dueDate: null },
      { id: '2', priority: 'L', dueDate: null },
      { id: '3', priority: 'H', dueDate: null },
      { id: '4', priority: 'M', dueDate: null }
    ];
    const sorted = TodoList.sortTasks(tasks);
    assertDeepEqual(sorted.map(t => t.priority), ['H', 'M', 'L', '']);
  });

  it('sorts by due date ascending within same priority', () => {
    const tasks = [
      { id: '1', priority: 'M', dueDate: '2026-02-25' },
      { id: '2', priority: 'M', dueDate: '2026-02-21' },
      { id: '3', priority: 'M', dueDate: '2026-02-22' }
    ];
    const sorted = TodoList.sortTasks(tasks);
    assertDeepEqual(sorted.map(t => t.id), ['2', '3', '1']);
  });

  it('tasks without due date come after tasks with due date at same priority', () => {
    const tasks = [
      { id: '1', priority: 'H', dueDate: null },
      { id: '2', priority: 'H', dueDate: '2026-02-21' }
    ];
    const sorted = TodoList.sortTasks(tasks);
    assertEqual(sorted[0].id, '2');
    assertEqual(sorted[1].id, '1');
  });

  it('does not mutate the original array', () => {
    const tasks = [
      { id: '1', priority: 'L', dueDate: null },
      { id: '2', priority: 'H', dueDate: null }
    ];
    TodoList.sortTasks(tasks);
    assertEqual(tasks[0].id, '1'); // original order preserved
  });

  it('handles empty array', () => {
    const result = TodoList.sortTasks([]);
    assertEqual(result.length, 0);
  });
});
