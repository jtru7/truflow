/**
 * TRUFlow — To-Do List Module
 * Daily task list with priority, due dates, and overdue tracking.
 * Data model: { id, text, priority ('H'|'M'|'L'|''), dueDate ('YYYY-MM-DD'|null), done, createdDate }
 */

const TodoList = (() => {
  let _bound = false;
  let _selectedPriority = '';
  let _editingTaskId    = null;
  let _editModalPriority = '';

  // DOM refs — populated in init()
  let todoInput, addBtn, todoListEl, overdueSection, overdueListEl,
      priorityPick, dueDateInput, overdueBadge,
      editModal, editTextInput, editPriorityPick, editDueInput, editNotesInput,
      editClose, editCancel, editSave;

  function init() {
    todoInput        = document.getElementById('todo-input');
    addBtn           = document.getElementById('btn-add-todo');
    todoListEl       = document.getElementById('todo-list');
    overdueSection   = document.getElementById('todo-overdue-section');
    overdueListEl    = document.getElementById('todo-overdue-list');
    overdueBadge     = document.getElementById('todo-overdue-badge');
    priorityPick     = document.getElementById('todo-priority-pick');
    dueDateInput     = document.getElementById('todo-due');
    editModal        = document.getElementById('todo-edit-modal');
    editTextInput    = document.getElementById('todo-edit-text');
    editPriorityPick = document.getElementById('todo-edit-priority');
    editDueInput     = document.getElementById('todo-edit-due');
    editNotesInput   = document.getElementById('todo-edit-notes');
    editClose        = document.getElementById('todo-edit-close');
    editCancel       = document.getElementById('todo-edit-cancel');
    editSave         = document.getElementById('todo-edit-save');

    _render();

    if (!_bound) {
      addBtn.addEventListener('click', _handleAdd);
      todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') _handleAdd(); });

      if (priorityPick) {
        priorityPick.addEventListener('click', e => {
          const btn = e.target.closest('.todo-pri-btn');
          if (!btn) return;
          const p = btn.dataset.priority;
          _selectedPriority = _selectedPriority === p ? '' : p;
          _updatePriorityUI();
        });
      }

      // Edit modal bindings
      if (editClose)  editClose.addEventListener('click', _closeEditModal);
      if (editCancel) editCancel.addEventListener('click', _closeEditModal);
      if (editSave)   editSave.addEventListener('click', _saveEdit);
      if (editModal)  editModal.addEventListener('click', e => {
        if (e.target === editModal) _closeEditModal();
      });
      if (editPriorityPick) {
        editPriorityPick.addEventListener('click', e => {
          const btn = e.target.closest('.todo-pri-btn');
          if (!btn) return;
          const p = btn.dataset.priority;
          _editModalPriority = _editModalPriority === p ? '' : p;
          _updateEditPriorityUI();
        });
      }
      if (editTextInput) editTextInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') _saveEdit();
      });

      _bound = true;
    }
  }

  // --- Public ---

  function sortTasks(tasks) {
    return [...tasks].sort(_sortFn);
  }

  function categorize(tasks, today) {
    const d = today || _todayStr();
    return {
      overdue: tasks.filter(t => !t.done && t.dueDate && t.dueDate < d),
      active:  tasks.filter(t => !t.done && !(t.dueDate && t.dueDate < d)),
      done:    tasks.filter(t => t.done)
    };
  }

  // --- Private ---

  function _handleAdd() {
    const text = todoInput.value.trim();
    if (!text) return;

    const task = {
      id: Date.now().toString(),
      text,
      priority: _selectedPriority,
      dueDate: dueDateInput ? (dueDateInput.value || null) : null,
      done: false,
      createdDate: _todayStr()
    };

    const tasks = Storage.getTasks();
    tasks.push(task);
    Storage.saveTasks(tasks);

    todoInput.value = '';
    _selectedPriority = '';
    _updatePriorityUI();
    if (dueDateInput) dueDateInput.value = '';
    _render();
  }

  function _render() {
    const today = _todayStr();
    const { overdue, active, done } = categorize(Storage.getTasks(), today);

    // Update overdue badge in the panel heading
    if (overdueBadge) {
      if (overdue.length > 0) {
        overdueBadge.textContent = overdue.length;
        overdueBadge.style.display = 'inline-flex';
      } else {
        overdueBadge.style.display = 'none';
      }
    }

    const sortedActive  = sortTasks(active);
    const sortedOverdue = [...overdue].sort((a, b) =>
      (a.dueDate || '').localeCompare(b.dueDate || '')
    );

    // Render main list (active tasks + completed section)
    if (sortedActive.length === 0 && done.length === 0) {
      todoListEl.innerHTML = '<p class="placeholder-text">No tasks yet. Add one above.</p>';
    } else {
      let html = sortedActive.map(t => _taskHTML(t)).join('');
      if (done.length > 0) {
        html += `<div class="todo-done-divider">
          <span>Completed</span>
          <button class="todo-clear-btn">Clear all</button>
        </div>`;
        html += done.map(t => _taskHTML(t)).join('');
      }
      todoListEl.innerHTML = html;
      _bindTaskEvents(todoListEl);

      const clearBtn = todoListEl.querySelector('.todo-clear-btn');
      if (clearBtn) clearBtn.addEventListener('click', _clearCompleted);
    }

    // Render overdue section
    if (sortedOverdue.length === 0) {
      overdueSection.style.display = 'none';
    } else {
      overdueSection.style.display = 'block';
      overdueListEl.innerHTML = sortedOverdue.map(t => _taskHTML(t)).join('');
      _bindTaskEvents(overdueListEl);
    }
  }

  function _taskHTML(task) {
    const PRIORITY_CLASS = { H: 'high', M: 'medium', L: 'low' };
    const priorityBadge = task.priority
      ? `<span class="todo-priority ${PRIORITY_CLASS[task.priority]}">${task.priority}</span>`
      : '';
    const dueBadge = task.dueDate
      ? `<span class="todo-due">${_fmtDate(task.dueDate)}</span>`
      : '';
    const notesDot = task.notes
      ? `<span class="todo-note-dot" title="${_esc(task.notes)}">&#8226;</span>`
      : '';
    return `<div class="todo-item${task.done ? ' completed' : ''}" data-id="${task.id}">
      <input type="checkbox"${task.done ? ' checked' : ''}>
      ${priorityBadge}
      <span class="todo-text">${_esc(task.text)}</span>
      ${dueBadge}${notesDot}
      <button class="todo-edit-btn" title="Edit task">✏</button>
      <button class="todo-delete" title="Delete task">&times;</button>
    </div>`;
  }

  function _bindTaskEvents(container) {
    container.querySelectorAll('.todo-item').forEach(el => {
      const id = el.dataset.id;
      el.querySelector('input[type="checkbox"]').addEventListener('change', e => {
        _toggleDone(id, e.target.checked);
      });
      const editBtn = el.querySelector('.todo-edit-btn');
      if (editBtn) editBtn.addEventListener('click', e => {
        e.stopPropagation();
        _openEditModal(id);
      });
      el.querySelector('.todo-delete').addEventListener('click', () => {
        _deleteTask(id);
      });
    });
  }

  function _toggleDone(id, done) {
    const tasks = Storage.getTasks();
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.done = done;
    Storage.saveTasks(tasks);
    _render();
  }

  function _deleteTask(id) {
    Storage.saveTasks(Storage.getTasks().filter(t => t.id !== id));
    _render();
  }

  function _clearCompleted() {
    Storage.saveTasks(Storage.getTasks().filter(t => !t.done));
    _render();
  }

  // --- Edit modal ---

  function _openEditModal(id) {
    const task = Storage.getTasks().find(t => t.id === id);
    if (!task || !editModal) return;
    _editingTaskId     = id;
    _editModalPriority = task.priority || '';
    if (editTextInput)  editTextInput.value  = task.text;
    if (editDueInput)   editDueInput.value   = task.dueDate || '';
    if (editNotesInput) editNotesInput.value = task.notes || '';
    _updateEditPriorityUI();
    editModal.style.display = 'flex';
    if (editTextInput) editTextInput.focus();
  }

  function _closeEditModal() {
    if (editModal) editModal.style.display = 'none';
    _editingTaskId = null;
  }

  function _saveEdit() {
    if (!_editingTaskId) return;
    const text = editTextInput ? editTextInput.value.trim() : '';
    if (!text) return;
    const tasks = Storage.getTasks();
    const t = tasks.find(t => t.id === _editingTaskId);
    if (!t) return;
    t.text     = text;
    t.priority = _editModalPriority;
    t.dueDate  = editDueInput   ? (editDueInput.value || null)         : t.dueDate;
    t.notes    = editNotesInput ? (editNotesInput.value.trim() || null) : t.notes;
    Storage.saveTasks(tasks);
    _closeEditModal();
    _render();
  }

  function _updateEditPriorityUI() {
    if (!editPriorityPick) return;
    editPriorityPick.querySelectorAll('.todo-pri-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.priority === _editModalPriority);
    });
  }

  // --- Sort helpers ---

  function _sortFn(a, b) {
    const ORDER = { H: 0, M: 1, L: 2, '': 3 };
    const pa = ORDER[a.priority] ?? 3;
    const pb = ORDER[b.priority] ?? 3;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  }

  function _updatePriorityUI() {
    if (!priorityPick) return;
    priorityPick.querySelectorAll('.todo-pri-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.priority === _selectedPriority);
    });
  }

  function _todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function _fmtDate(dateStr) {
    const [, m, d] = dateStr.split('-').map(Number);
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${MONTHS[m - 1]} ${d}`;
  }

  function _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init, sortTasks, categorize };
})();
