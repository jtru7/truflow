/**
 * TRUFlow — Google Sheets Sync Module
 * Push (backup) and pull (restore) all data via an Apps Script web app.
 */

const SheetsSync = (() => {
  let _syncBtn, _restoreBtn;
  let _bound = false;

  function init() {
    _syncBtn    = document.getElementById('btn-sync');
    _restoreBtn = document.getElementById('btn-restore');

    if (!_bound) {
      if (_syncBtn)    _syncBtn.addEventListener('click', push);
      if (_restoreBtn) _restoreBtn.addEventListener('click', pull);
      _bound = true;
    }

    _updateButtonState();
  }

  function _getUrl() {
    return (Storage.getSettings().syncUrl || '').trim();
  }

  function _updateButtonState() {
    const has = !!_getUrl();
    if (_syncBtn) {
      _syncBtn.disabled = !has;
      _syncBtn.title = has ? 'Sync to Google Sheets' : 'Add a Sync URL in Settings first';
    }
    if (_restoreBtn) {
      _restoreBtn.disabled = !has;
      _restoreBtn.title = has ? 'Restore from Google Sheets' : 'Add a Sync URL in Settings first';
    }
  }

  async function push() {
    const url = _getUrl();
    if (!url) return;
    _setBusy(_syncBtn, 'Syncing\u2026');
    try {
      const resp = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(Storage.exportAll())
      });
      const result = await resp.json();
      if (!result.ok) throw new Error(result.error || 'Sync failed');
      _setDone(_syncBtn, '\u2713 Synced', true);
    } catch (err) {
      console.error('SheetsSync.push:', err);
      _setDone(_syncBtn, '\u2717 Failed', false);
    }
  }

  async function pull() {
    const url = _getUrl();
    if (!url) return;
    if (!confirm('Restore from Google Sheets?\n\nThis will overwrite your local data with the last saved backup.')) return;
    _setBusy(_restoreBtn, 'Restoring\u2026');
    try {
      const resp = await fetch(url);
      const result = await resp.json();
      if (!result.ok) throw new Error(result.error || 'No backup found');
      Storage.importAll(result.data);
      if (typeof App       !== 'undefined') App.refreshBucketDropdown();
      if (typeof App       !== 'undefined') App.refreshProjectDetails();
      if (typeof Kanban    !== 'undefined') Kanban.init();
      if (typeof TodoList  !== 'undefined') TodoList.init();
      if (typeof Pomodoro  !== 'undefined') Pomodoro.init();
      _setDone(_restoreBtn, '\u2713 Restored', true);
    } catch (err) {
      console.error('SheetsSync.pull:', err);
      _setDone(_restoreBtn, '\u2717 Failed', false);
    }
  }

  function _setBusy(btn, label) {
    if (!btn) return;
    btn.dataset.orig = btn.textContent;
    btn.textContent = label;
    btn.disabled = true;
  }

  function _setDone(btn, label, success) {
    if (!btn) return;
    btn.textContent = label;
    btn.style.color = success ? 'var(--color-success)' : 'var(--color-danger)';
    setTimeout(() => {
      btn.textContent = btn.dataset.orig || btn.textContent;
      btn.style.color = '';
      btn.disabled = false;
      delete btn.dataset.orig;
    }, 2500);
  }

  return { init, push, pull };
})();
