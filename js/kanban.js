/**
 * TRUFlow — Kanban Board Module
 * Card CRUD via modal, drag-and-drop between columns, full card fields.
 */

const Kanban = (() => {
  let _editingId = null;  // null = new card, string = editing existing
  let _draggedId = null;
  let _bound = false;

  // DOM refs — populated in init()
  let board, addBtn, modal, modalTitle, modalClose, modalCancel, modalSave,
      modalDelete, nameInput, descriptionInput, columnSelect, labelsList,
      labelInput, labelAddBtn, checklistList, checklistInput, checklistAddBtn,
      timeGoalInput;

  // Priority → border color map
  const PRIORITY_COLORS = {
    H: 'var(--color-high)',
    M: 'var(--color-medium)',
    L: 'var(--color-low)',
    '': 'var(--color-accent)'
  };

  // ─── Public ────────────────────────────────────────────────────────────────

  function init() {
    board            = document.getElementById('kanban-board');
    addBtn           = document.getElementById('btn-add-project');
    modal            = document.getElementById('card-modal');
    modalTitle       = document.getElementById('card-modal-title');
    modalClose       = document.getElementById('card-modal-close');
    modalCancel      = document.getElementById('card-modal-cancel');
    modalSave        = document.getElementById('card-modal-save');
    modalDelete      = document.getElementById('card-modal-delete');
    nameInput        = document.getElementById('card-name');
    descriptionInput = document.getElementById('card-description');
    columnSelect     = document.getElementById('card-column');
    labelsList       = document.getElementById('card-labels-list');
    labelInput       = document.getElementById('card-label-input');
    labelAddBtn      = document.getElementById('card-label-add-btn');
    checklistList    = document.getElementById('card-checklist-list');
    checklistInput   = document.getElementById('card-checklist-input');
    checklistAddBtn  = document.getElementById('card-checklist-add-btn');
    timeGoalInput    = document.getElementById('card-time-goal');

    _renderAll();

    if (!_bound) {
      addBtn.addEventListener('click', _openAddModal);
      modalClose.addEventListener('click', _closeModal);
      modalCancel.addEventListener('click', _closeModal);
      modalSave.addEventListener('click', _saveCard);
      modalDelete.addEventListener('click', _deleteCard);
      labelAddBtn.addEventListener('click', _addLabel);
      checklistAddBtn.addEventListener('click', _addChecklistItem);

      // labelInput is now a <select> — no keydown Enter handler needed
      checklistInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); _addChecklistItem(); } });
      nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); _saveCard(); } });

      // Close modal on backdrop click
      modal.addEventListener('click', e => { if (e.target === modal) _closeModal(); });

      // Drag-and-drop via event delegation on the board
      board.addEventListener('dragstart', _onDragStart);
      board.addEventListener('dragend', _onDragEnd);
      board.addEventListener('dragover', _onDragOver);
      board.addEventListener('dragleave', _onDragLeave);
      board.addEventListener('drop', _onDrop);

      _bound = true;
    }
  }

  function getState() {
    return { projects: Storage.getProjects() };
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  function _renderAll() {
    // Clear each column
    board.querySelectorAll('.column-cards').forEach(col => { col.innerHTML = ''; });

    const logs = Storage.getTimeLogs();
    Storage.getProjects().forEach(project => {
      const cardEl = _buildCard(project, logs);
      const col = board.querySelector(`.column-cards[data-column="${project.column}"]`);
      if (col) col.appendChild(cardEl);
    });
  }

  function _buildCard(project, logs) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.dataset.id = project.id;
    card.draggable = true;
    card.style.borderLeftColor = PRIORITY_COLORS[project.priority] || PRIORITY_COLORS[''];

    // Title row
    const titleRow = document.createElement('div');
    titleRow.className = 'card-title-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'card-name';
    nameEl.textContent = project.name;
    titleRow.appendChild(nameEl);

    if (project.priority) {
      const badge = document.createElement('span');
      badge.className = `card-priority-badge ${project.priority}`;
      badge.textContent = project.priority;
      titleRow.appendChild(badge);
    }

    card.appendChild(titleRow);

    // Labels
    if (project.labels && project.labels.length > 0) {
      const tagsEl = document.createElement('div');
      tagsEl.className = 'card-tags';
      project.labels.forEach(label => {
        const tag = document.createElement('span');
        tag.className = 'card-tag';
        tag.textContent = label;
        tagsEl.appendChild(tag);
      });
      card.appendChild(tagsEl);
    }

    // Checklist progress
    if (project.checklist && project.checklist.length > 0) {
      const done = project.checklist.filter(i => i.done).length;
      const total = project.checklist.length;
      const pct = Math.round((done / total) * 100);

      const progressEl = document.createElement('div');
      progressEl.className = 'card-progress';
      progressEl.innerHTML = `
        <span>${done}/${total} done</span>
        <div class="card-progress-bar">
          <div class="card-progress-fill" style="width:${pct}%"></div>
        </div>`;
      card.appendChild(progressEl);
    }

    // Total tracked time for this project
    const totalSecs = (logs || [])
      .filter(l => l.bucket === `project:${project.id}` && l.end)
      .reduce((sum, l) => sum + Math.round((new Date(l.end) - new Date(l.start)) / 1000), 0);

    const goalSecs = (project.timeGoal || 0) * 3600;

    if (goalSecs > 0) {
      const pct  = Math.min(100, Math.round((totalSecs / goalSecs) * 100));
      const over = totalSecs >= goalSecs;
      const goalEl = document.createElement('div');
      goalEl.className = 'card-goal';
      goalEl.innerHTML = `
        <span class="card-goal-text${over ? ' card-goal-over' : ''}">
          ${_fmtDuration(totalSecs)} of ${_fmtDuration(goalSecs)}
        </span>
        <div class="card-progress-bar">
          <div class="${over ? 'card-goal-fill-over' : 'card-goal-fill'}"
               style="width:${pct}%"></div>
        </div>`;
      card.appendChild(goalEl);
    } else if (totalSecs > 0) {
      const timeEl = document.createElement('div');
      timeEl.className = 'card-time';
      timeEl.textContent = _fmtDuration(totalSecs);
      card.appendChild(timeEl);
    }

    // Click to edit (ignore clicks on the progress bar checkboxes)
    card.addEventListener('click', () => _openEditModal(project.id));

    return card;
  }

  // ─── Modal ─────────────────────────────────────────────────────────────────

  function _openAddModal() {
    _editingId = null;
    nameInput.value = '';
    descriptionInput.value = '';
    _setPriority('L');
    columnSelect.value = 'queue';
    labelsList.innerHTML = '';
    checklistList.innerHTML = '';
    _populateLabelSelect();
    checklistInput.value = '';
    if (timeGoalInput) timeGoalInput.value = '';
    modalTitle.textContent = 'New Project';
    modalSave.textContent = 'Create';
    modalDelete.style.display = 'none';
    modal.style.display = 'flex';
    nameInput.focus();
  }

  function _openEditModal(id) {
    const projects = Storage.getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return;

    _editingId = id;
    nameInput.value = project.name;
    descriptionInput.value = project.description || '';
    _setPriority(project.priority || '');
    columnSelect.value = project.column;

    // Populate labels
    labelsList.innerHTML = '';
    (project.labels || []).forEach(label => _appendLabelChip(label));
    _populateLabelSelect();

    // Populate checklist
    checklistList.innerHTML = '';
    (project.checklist || []).forEach(item => _appendChecklistRow(item.id, item.text, item.done));

    checklistInput.value = '';
    if (timeGoalInput) timeGoalInput.value = project.timeGoal || '';
    modalTitle.textContent = 'Edit Project';
    modalSave.textContent = 'Save';
    modalDelete.style.display = 'inline-block';
    modal.style.display = 'flex';
    nameInput.focus();
  }

  function _closeModal() {
    modal.style.display = 'none';
    _editingId = null;
  }

  // ─── Save / Delete ─────────────────────────────────────────────────────────

  function _saveCard() {
    const name = nameInput.value.trim();
    if (!name) return;

    const description = descriptionInput.value.trim();
    const priority = _getPriority();
    const column = columnSelect.value;
    const labels = _getLabels();
    const checklist = _getChecklist();
    const timeGoal = parseFloat(timeGoalInput ? timeGoalInput.value : '') || 0;

    const projects = Storage.getProjects();

    if (_editingId === null) {
      const newProject = {
        id: Date.now().toString(),
        name,
        description,
        column,
        priority,
        labels,
        checklist,
        timeGoal,
        createdAt: new Date().toISOString()
      };
      projects.push(newProject);
    } else {
      const idx = projects.findIndex(p => p.id === _editingId);
      if (idx !== -1) {
        projects[idx] = { ...projects[idx], name, description, column, priority, labels, checklist, timeGoal };
      }
    }

    Storage.saveProjects(projects);
    if (typeof App !== 'undefined') App.refreshBucketDropdown();
    if (typeof App !== 'undefined') App.refreshProjectDetails();
    _renderAll();
    _closeModal();
  }

  function _deleteCard() {
    if (!_editingId) return;
    const projects = Storage.getProjects().filter(p => p.id !== _editingId);
    Storage.saveProjects(projects);
    if (typeof App !== 'undefined') App.refreshBucketDropdown();
    if (typeof App !== 'undefined') App.refreshProjectDetails();
    _renderAll();
    _closeModal();
  }

  // ─── Labels ────────────────────────────────────────────────────────────────

  function _populateLabelSelect() {
    const labels = Storage.getSettings().labels || [];
    labelInput.innerHTML = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = labels.length ? '— pick a label —' : '(no labels in Settings)';
    if (!labels.length) blank.disabled = true;
    labelInput.appendChild(blank);
    labels.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      labelInput.appendChild(opt);
    });
    labelInput.value = '';
  }

  function _addLabel() {
    const text = labelInput.value;
    if (!text) return;
    if (_getLabels().includes(text)) { labelInput.value = ''; return; }
    _appendLabelChip(text);
    labelInput.value = '';
  }

  function _appendLabelChip(text) {
    const item = document.createElement('div');
    item.className = 'card-label-item';
    item.dataset.label = text;

    const span = document.createElement('span');
    span.textContent = text;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'card-label-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => item.remove());

    item.appendChild(span);
    item.appendChild(removeBtn);
    labelsList.appendChild(item);
  }

  function _getLabels() {
    return Array.from(labelsList.querySelectorAll('.card-label-item'))
      .map(el => el.dataset.label);
  }

  // ─── Checklist ─────────────────────────────────────────────────────────────

  function _addChecklistItem() {
    const text = checklistInput.value.trim();
    if (!text) return;
    _appendChecklistRow(Date.now().toString(), text, false);
    checklistInput.value = '';
    checklistInput.focus();
  }

  function _appendChecklistRow(id, text, done) {
    const row = document.createElement('div');
    row.className = `card-checklist-item${done ? ' done' : ''}`;
    row.dataset.itemId = id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = done;
    checkbox.addEventListener('change', () => {
      row.classList.toggle('done', checkbox.checked);
    });

    const label = document.createElement('span');
    label.textContent = text;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'card-checklist-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => row.remove());

    row.appendChild(checkbox);
    row.appendChild(label);
    row.appendChild(removeBtn);
    checklistList.appendChild(row);
  }

  function _getChecklist() {
    return Array.from(checklistList.querySelectorAll('.card-checklist-item')).map(row => ({
      id: row.dataset.itemId,
      text: row.querySelector('span').textContent,
      done: row.querySelector('input[type="checkbox"]').checked
    }));
  }

  // ─── Priority helpers ──────────────────────────────────────────────────────

  function _setPriority(value) {
    const radios = modal.querySelectorAll('input[name="card-priority"]');
    radios.forEach(r => { r.checked = (r.value === value); });
  }

  function _getPriority() {
    const checked = modal.querySelector('input[name="card-priority"]:checked');
    return checked ? checked.value : '';
  }

  // ─── Drag and Drop ─────────────────────────────────────────────────────────

  function _onDragStart(e) {
    const card = e.target.closest('.kanban-card');
    if (!card) return;
    _draggedId = card.dataset.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function _onDragEnd(e) {
    const card = e.target.closest('.kanban-card');
    if (card) card.classList.remove('dragging');
    _draggedId = null;
    board.querySelectorAll('.column-cards').forEach(c => c.classList.remove('drag-over'));
  }

  function _onDragOver(e) {
    const col = e.target.closest('.column-cards');
    if (!col) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    col.classList.add('drag-over');
  }

  function _onDragLeave(e) {
    const col = e.target.closest('.column-cards');
    if (col && !col.contains(e.relatedTarget)) {
      col.classList.remove('drag-over');
    }
  }

  function _onDrop(e) {
    const col = e.target.closest('.column-cards');
    if (!col || !_draggedId) return;
    e.preventDefault();

    const newColumn = col.dataset.column;
    const projects = Storage.getProjects();
    const idx = projects.findIndex(p => p.id === _draggedId);
    if (idx !== -1 && projects[idx].column !== newColumn) {
      projects[idx].column = newColumn;
      Storage.saveProjects(projects);
    }

    col.classList.remove('drag-over');
    _renderAll();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function _fmtDuration(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  return { init, getState };
})();
