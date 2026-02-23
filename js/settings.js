/**
 * TRUFlow — Settings Module
 * Manages the settings modal: Pomodoro durations, Time Tracker buckets, and Kanban labels.
 */

const Settings = (() => {
  let _pendingBuckets = [];
  let _pendingLabels  = [];
  let _bound = false;

  // DOM refs — populated in init()
  let modal, pomoDurationInput, breakDurationInput,
      bucketsListEl, bucketInput, bucketAddBtn,
      labelsListEl, labelInput, labelAddBtn,
      syncUrlInput,
      btnOpen, btnClose, btnCancel, btnSave;

  function init() {
    modal              = document.getElementById('settings-modal');
    pomoDurationInput  = document.getElementById('settings-pomo-duration');
    breakDurationInput = document.getElementById('settings-break-duration');
    bucketsListEl      = document.getElementById('settings-buckets-list');
    bucketInput        = document.getElementById('settings-bucket-input');
    bucketAddBtn       = document.getElementById('settings-bucket-add');
    labelsListEl       = document.getElementById('settings-labels-list');
    labelInput         = document.getElementById('settings-label-input');
    labelAddBtn        = document.getElementById('settings-label-add');
    syncUrlInput       = document.getElementById('settings-sync-url');
    btnOpen            = document.getElementById('btn-settings');
    btnClose           = document.getElementById('settings-close');
    btnCancel          = document.getElementById('settings-cancel');
    btnSave            = document.getElementById('settings-save');

    if (!_bound) {
      if (btnOpen)      btnOpen.addEventListener('click', _open);
      if (btnClose)     btnClose.addEventListener('click', _close);
      if (btnCancel)    btnCancel.addEventListener('click', _close);
      if (btnSave)      btnSave.addEventListener('click', _save);
      if (bucketAddBtn) bucketAddBtn.addEventListener('click', _addBucket);
      if (bucketInput)  bucketInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') _addBucket();
      });
      if (labelAddBtn)  labelAddBtn.addEventListener('click', _addLabel);
      if (labelInput)   labelInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') _addLabel();
      });
      if (modal) modal.addEventListener('click', e => {
        if (e.target === modal) _close();
      });
      _bound = true;
    }
  }

  // --- Private ---

  function _open() {
    const s = Storage.getSettings();
    if (pomoDurationInput)  pomoDurationInput.value  = s.pomoDuration  || 25;
    if (breakDurationInput) breakDurationInput.value = s.breakDuration || 5;
    _pendingBuckets = [...(s.buckets || [])];
    _pendingLabels  = [...(s.labels  || [])];
    if (syncUrlInput) syncUrlInput.value = s.syncUrl || '';
    _renderBuckets();
    _renderLabels();
    if (modal) modal.style.display = 'flex';
  }

  function _close() {
    if (modal) modal.style.display = 'none';
    _pendingBuckets = [];
    _pendingLabels  = [];
  }

  function _save() {
    const pomo = parseInt(pomoDurationInput  ? pomoDurationInput.value  : 25, 10);
    const brk  = parseInt(breakDurationInput ? breakDurationInput.value : 5,  10);
    if (isNaN(pomo) || pomo < 1 || pomo > 60) return;
    if (isNaN(brk)  || brk  < 1 || brk  > 30) return;

    const s = Storage.getSettings();
    s.pomoDuration  = pomo;
    s.breakDuration = brk;
    s.buckets       = [..._pendingBuckets];
    s.labels        = [..._pendingLabels];
    s.syncUrl       = syncUrlInput ? syncUrlInput.value.trim() : (s.syncUrl || '');
    Storage.saveSettings(s);

    if (typeof App         !== 'undefined') App.refreshBucketDropdown();
    if (typeof Pomodoro    !== 'undefined' && !Pomodoro.getState().isRunning) Pomodoro.reset();
    if (typeof SheetsSync  !== 'undefined') SheetsSync.init();

    _close();
  }

  function _renderBuckets() {
    if (!bucketsListEl) return;
    if (_pendingBuckets.length === 0) {
      bucketsListEl.innerHTML = '<p class="settings-buckets-empty">No buckets yet.</p>';
      return;
    }
    bucketsListEl.innerHTML = _pendingBuckets.map((b, i) => `
      <div class="settings-bucket-item">
        <span class="settings-bucket-name">${_esc(b)}</span>
        <button class="settings-bucket-remove" data-index="${i}" title="Remove">&times;</button>
      </div>`).join('');

    bucketsListEl.querySelectorAll('.settings-bucket-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        _pendingBuckets.splice(parseInt(btn.dataset.index, 10), 1);
        _renderBuckets();
      });
    });
  }

  function _addBucket() {
    if (!bucketInput) return;
    const name = bucketInput.value.trim();
    if (!name) return;
    if (_pendingBuckets.includes(name)) { bucketInput.value = ''; return; }
    _pendingBuckets.push(name);
    bucketInput.value = '';
    _renderBuckets();
  }

  function _renderLabels() {
    if (!labelsListEl) return;
    if (_pendingLabels.length === 0) {
      labelsListEl.innerHTML = '<p class="settings-buckets-empty">No labels yet.</p>';
      return;
    }
    labelsListEl.innerHTML = _pendingLabels.map((l, i) => `
      <div class="settings-bucket-item">
        <span class="settings-bucket-name">${_esc(l)}</span>
        <button class="settings-bucket-remove" data-index="${i}" title="Remove">&times;</button>
      </div>`).join('');

    labelsListEl.querySelectorAll('.settings-bucket-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        _pendingLabels.splice(parseInt(btn.dataset.index, 10), 1);
        _renderLabels();
      });
    });
  }

  function _addLabel() {
    if (!labelInput) return;
    const name = labelInput.value.trim();
    if (!name) return;
    if (_pendingLabels.includes(name)) { labelInput.value = ''; return; }
    _pendingLabels.push(name);
    labelInput.value = '';
    _renderLabels();
  }

  function _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init };
})();
