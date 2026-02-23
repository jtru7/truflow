/**
 * TRUFlow — App Initialization
 * Bootstraps the application and wires up panel modules.
 */

const App = (() => {
  let _currentBucket = null; // bucket currently shown in project details panel

  function init() {
    // Initialize localStorage with defaults on first run
    Storage.initDefaults();

    // Initialize modules
    Pomodoro.init();

    // Populate the time tracker bucket dropdown from settings
    // Must run before TimeTracker.init() so the select has options for state restore
    populateBucketDropdown();
    TimeTracker.init();
    Kanban.init();
    TodoList.init();

    Settings.init();
    if (typeof SheetsSync !== 'undefined') SheetsSync.init();

    console.log('TRUFlow initialized.');
  }

  function populateBucketDropdown() {
    const select = document.getElementById('tracker-bucket');
    const settings = Storage.getSettings();
    const projects = Storage.getProjects();

    // Clear existing options (except the placeholder)
    select.innerHTML = '<option value="">-- Select Bucket --</option>';

    // Add setting-defined buckets
    settings.buckets.forEach(bucket => {
      const opt = document.createElement('option');
      opt.value = bucket;
      opt.textContent = bucket;
      select.appendChild(opt);
    });

    // Add project names as buckets
    projects.forEach(project => {
      const opt = document.createElement('option');
      opt.value = `project:${project.id}`;
      opt.textContent = project.name;
      select.appendChild(opt);
    });
  }

  // Expose for other modules to call when projects change
  function refreshBucketDropdown() {
    populateBucketDropdown();
  }

  // Called by TimeTracker on clock-in/out to update the left panel
  function updateProjectDetails(bucket) {
    _currentBucket = bucket;
    const content = document.getElementById('project-details-content');
    if (!content) return;

    if (!bucket || !bucket.startsWith('project:')) {
      content.innerHTML = '<p class="placeholder-text">Clock into a project to see its details here.</p>';
      return;
    }

    const id = bucket.replace('project:', '');
    const project = Storage.getProjects().find(p => p.id === id);

    if (!project) {
      content.innerHTML = '<p class="placeholder-text">Project not found.</p>';
      return;
    }

    _renderProjectDetails(content, project);
  }

  // Re-renders the current project details (call after editing a Kanban card)
  function refreshProjectDetails() {
    updateProjectDetails(_currentBucket);
  }

  function _renderProjectDetails(container, project) {
    const PRIORITY_LABELS = { H: 'High', M: 'Med', L: 'Low' };
    const COLUMN_LABELS = {
      'queue': 'Queue', 'in-progress': 'In Progress',
      'on-hold': 'On Hold', 'done': 'Done', 'backburner': 'Backburner'
    };

    let html = `
      <div class="pd-header">
        <span class="pd-name">${_esc(project.name)}</span>
        ${project.priority ? `<span class="pd-badge pd-badge-${project.priority}">${PRIORITY_LABELS[project.priority] || project.priority}</span>` : ''}
      </div>
      <div class="pd-status">${COLUMN_LABELS[project.column] || project.column}</div>`;

    if (project.description) {
      html += `<div class="pd-description">${_esc(project.description).replace(/\n/g, '<br>')}</div>`;
    }

    if (project.labels && project.labels.length > 0) {
      html += '<div class="pd-labels">';
      project.labels.forEach(lbl => {
        html += `<span class="pd-label">${_esc(lbl)}</span>`;
      });
      html += '</div>';
    }

    if (project.checklist && project.checklist.length > 0) {
      const doneCount = project.checklist.filter(i => i.done).length;
      html += `<div class="pd-checklist-header">${doneCount}/${project.checklist.length} done</div>
        <div class="pd-checklist">`;
      project.checklist.forEach(item => {
        html += `<label class="pd-checklist-item${item.done ? ' done' : ''}">
          <input type="checkbox" data-pid="${_esc(project.id)}" data-iid="${_esc(item.id)}"${item.done ? ' checked' : ''}>
          <span>${_esc(item.text)}</span>
        </label>`;
      });
      html += '</div>';
    }

    container.innerHTML = html;

    // Wire up interactive checklist checkboxes
    container.querySelectorAll('.pd-checklist-item input').forEach(cb => {
      cb.addEventListener('change', () => {
        const projects = Storage.getProjects();
        const proj = projects.find(p => p.id === cb.dataset.pid);
        if (!proj) return;
        const item = proj.checklist.find(i => i.id === cb.dataset.iid);
        if (!item) return;
        item.done = cb.checked;
        Storage.saveProjects(projects);
        cb.closest('.pd-checklist-item').classList.toggle('done', cb.checked);
        // Update progress header
        const all = container.querySelectorAll('.pd-checklist-item input');
        const done = Array.from(all).filter(c => c.checked).length;
        const hdr = container.querySelector('.pd-checklist-header');
        if (hdr) hdr.textContent = `${done}/${all.length} done`;
      });
    });
  }

  function _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    init,
    refreshBucketDropdown,
    updateProjectDetails,
    refreshProjectDetails
  };
})();

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
