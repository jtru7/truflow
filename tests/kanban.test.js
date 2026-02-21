/**
 * TRUFlow — Kanban Module Tests
 *
 * Relies on stub DOM elements defined in tests/index.html and
 * Kanban.init() being called once before these suites run.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clickAddProject()  { document.getElementById('btn-add-project').click(); }
function clickModalSave()   { document.getElementById('card-modal-save').click(); }
function clickModalCancel() { document.getElementById('card-modal-cancel').click(); }
function clickModalDelete() { document.getElementById('card-modal-delete').click(); }

function setCardName(val)   { document.getElementById('card-name').value = val; }
function setCardColumn(val) { document.getElementById('card-column').value = val; }
function setCardPriority(val) {
  const radio = document.querySelector(`input[name="card-priority"][value="${val}"]`);
  if (radio) radio.checked = true;
}

function addLabel(text) {
  document.getElementById('card-label-input').value = text;
  document.getElementById('card-label-add-btn').click();
}

function addChecklistItem(text) {
  document.getElementById('card-checklist-input').value = text;
  document.getElementById('card-checklist-add-btn').click();
}

function getColumnCards(column) {
  return document.querySelectorAll(`.column-cards[data-column="${column}"] .kanban-card`);
}

function freshKanbanInit() {
  Storage.clearAll();
  Storage.initDefaults();
  Kanban.init();
}

// Quick helper: add a card with just a name and save it
function addCard(name, column = 'queue', priority = 'L') {
  clickAddProject();
  setCardName(name);
  setCardColumn(column);
  setCardPriority(priority);
  clickModalSave();
}

// ─── Suites ──────────────────────────────────────────────────────────────────

describe('Kanban — Initialization', () => {
  it('renders no cards when storage is empty', () => {
    freshKanbanInit();
    const allCards = document.querySelectorAll('.kanban-card');
    assertEqual(allCards.length, 0);
  });

  it('renders saved projects into the correct columns on init', () => {
    Storage.clearAll();
    Storage.initDefaults();
    Storage.saveProjects([
      { id: '1', name: 'Alpha', column: 'queue',       priority: 'H', labels: [], checklist: [], createdAt: '' },
      { id: '2', name: 'Beta',  column: 'in-progress', priority: 'L', labels: [], checklist: [], createdAt: '' }
    ]);
    Kanban.init();
    assertEqual(getColumnCards('queue').length, 1);
    assertEqual(getColumnCards('in-progress').length, 1);
    assertEqual(getColumnCards('done').length, 0);
  });

  it('shows the correct card name after init', () => {
    Storage.clearAll();
    Storage.initDefaults();
    Storage.saveProjects([
      { id: '1', name: 'My Project', column: 'queue', priority: '', labels: [], checklist: [], createdAt: '' }
    ]);
    Kanban.init();
    const card = document.querySelector('.column-cards[data-column="queue"] .kanban-card');
    assert(card !== null, 'Card should exist');
    assert(card.textContent.includes('My Project'), 'Card should show project name');
  });
});

describe('Kanban — Add Project', () => {
  it('creates a project in storage when saved', () => {
    freshKanbanInit();
    addCard('Test Project');
    assertEqual(Storage.getProjects().length, 1);
  });

  it('saves the correct name', () => {
    freshKanbanInit();
    addCard('Design Sprint');
    assertEqual(Storage.getProjects()[0].name, 'Design Sprint');
  });

  it('saves the correct column', () => {
    freshKanbanInit();
    addCard('Backlog Item', 'backburner', 'L');
    assertEqual(Storage.getProjects()[0].column, 'backburner');
  });

  it('saves the correct priority', () => {
    freshKanbanInit();
    addCard('Urgent Task', 'queue', 'H');
    assertEqual(Storage.getProjects()[0].priority, 'H');
  });

  it('saves the description', () => {
    freshKanbanInit();
    clickAddProject();
    setCardName('Documented Project');
    document.getElementById('card-description').value = 'Some notes here.';
    clickModalSave();
    assertEqual(Storage.getProjects()[0].description, 'Some notes here.');
  });

  it('description defaults to empty string when not provided', () => {
    freshKanbanInit();
    addCard('No Notes');
    assertEqual(Storage.getProjects()[0].description, '');
  });

  it('does not create a project when name is empty', () => {
    freshKanbanInit();
    clickAddProject();
    setCardName('');
    clickModalSave();
    assertEqual(Storage.getProjects().length, 0);
  });

  it('renders the new card in the correct column', () => {
    freshKanbanInit();
    addCard('Queue Card', 'queue');
    assertEqual(getColumnCards('queue').length, 1);
  });

  it('adds a createdAt timestamp', () => {
    freshKanbanInit();
    addCard('Timestamped');
    const project = Storage.getProjects()[0];
    assert(typeof project.createdAt === 'string' && project.createdAt.length > 0, 'Should have createdAt');
  });
});

describe('Kanban — Labels', () => {
  it('saves labels to the project', () => {
    freshKanbanInit();
    clickAddProject();
    setCardName('Labelled Project');
    addLabel('frontend');
    addLabel('urgent');
    clickModalSave();
    const project = Storage.getProjects()[0];
    assertDeepEqual(project.labels, ['frontend', 'urgent']);
  });

  it('empty label input does not add a label', () => {
    freshKanbanInit();
    clickAddProject();
    setCardName('Clean Project');
    document.getElementById('card-label-input').value = '';
    document.getElementById('card-label-add-btn').click();
    clickModalSave();
    assertDeepEqual(Storage.getProjects()[0].labels, []);
  });
});

describe('Kanban — Checklist', () => {
  it('saves checklist items to the project', () => {
    freshKanbanInit();
    clickAddProject();
    setCardName('Project With Tasks');
    addChecklistItem('Write tests');
    addChecklistItem('Deploy app');
    clickModalSave();
    const checklist = Storage.getProjects()[0].checklist;
    assertEqual(checklist.length, 2);
    assertEqual(checklist[0].text, 'Write tests');
    assertEqual(checklist[1].text, 'Deploy app');
  });

  it('new checklist items default to not done', () => {
    freshKanbanInit();
    clickAddProject();
    setCardName('Undone Tasks');
    addChecklistItem('Task A');
    clickModalSave();
    assertEqual(Storage.getProjects()[0].checklist[0].done, false);
  });
});

describe('Kanban — Edit Project', () => {
  it('updates the project name in storage', () => {
    freshKanbanInit();
    addCard('Original Name');
    // Click the rendered card to open edit modal
    const card = document.querySelector('.kanban-card');
    card.click();
    setCardName('Updated Name');
    clickModalSave();
    assertEqual(Storage.getProjects()[0].name, 'Updated Name');
  });

  it('updates the column in storage', () => {
    freshKanbanInit();
    addCard('Move Me', 'queue');
    document.querySelector('.kanban-card').click();
    setCardColumn('done');
    clickModalSave();
    assertEqual(Storage.getProjects()[0].column, 'done');
  });

  it('moves the card to the new column in the DOM', () => {
    freshKanbanInit();
    addCard('Movable', 'queue');
    document.querySelector('.kanban-card').click();
    setCardColumn('in-progress');
    clickModalSave();
    assertEqual(getColumnCards('queue').length, 0);
    assertEqual(getColumnCards('in-progress').length, 1);
  });
});

describe('Kanban — Delete Project', () => {
  it('removes the project from storage', () => {
    freshKanbanInit();
    addCard('To Be Deleted');
    document.querySelector('.kanban-card').click();
    clickModalDelete();
    assertEqual(Storage.getProjects().length, 0);
  });

  it('removes the card from the DOM', () => {
    freshKanbanInit();
    addCard('Goodbye Card');
    document.querySelector('.kanban-card').click();
    clickModalDelete();
    assertEqual(document.querySelectorAll('.kanban-card').length, 0);
  });

  it('does not delete when no project is being edited', () => {
    freshKanbanInit();
    addCard('Safe Card');
    // Don't open the modal — just call delete directly (should be no-op)
    clickModalDelete();
    assertEqual(Storage.getProjects().length, 1);
  });
});

describe('Kanban — Multiple Projects', () => {
  it('distributes multiple projects across columns', () => {
    freshKanbanInit();
    addCard('Card A', 'queue');
    addCard('Card B', 'done');
    addCard('Card C', 'queue');
    assertEqual(getColumnCards('queue').length, 2);
    assertEqual(getColumnCards('done').length, 1);
  });

  it('editing one project does not affect others', () => {
    freshKanbanInit();
    addCard('First');
    addCard('Second');
    const cards = document.querySelectorAll('.kanban-card');
    cards[0].click(); // open first
    setCardName('First Updated');
    clickModalSave();
    const projects = Storage.getProjects();
    assertEqual(projects.length, 2);
    assert(projects.some(p => p.name === 'Second'), 'Second project should be unchanged');
  });
});
