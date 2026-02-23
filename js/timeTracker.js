/**
 * TRUFlow — Time Tracker Module
 * Handles clock-in/out, elapsed display, and weekly bucket totals.
 */

const TimeTracker = (() => {
  let isRunning = false;
  let activeBucket = null;
  let startTime = null;     // Date object
  let intervalId = null;
  let _bound = false;
  let _editingLogId = null;
  let _weekOffset = 0;      // 0 = current week, -1 = last week, etc.

  // DOM refs — populated in init()
  let bucketSelect, toggleBtn, elapsedDisplay, weeklyContainer,
      startTimeDisplay, logList,
      logModal, logBucketDisplay, logDateInput, logStartInput, logEndInput,
      logModalClose, logModalCancel, logModalSave, logModalDelete,
      weeklyReportModal, weeklyReportBody, weeklyReportClose;

  function init() {
    bucketSelect     = document.getElementById('tracker-bucket');
    toggleBtn        = document.getElementById('tracker-toggle');
    elapsedDisplay   = document.getElementById('tracker-elapsed');
    weeklyContainer  = document.getElementById('tracker-weekly');
    startTimeDisplay = document.getElementById('tracker-start-time');
    logList          = document.getElementById('tracker-logs');
    logModal         = document.getElementById('log-modal');
    logBucketDisplay = document.getElementById('log-modal-bucket');
    logDateInput     = document.getElementById('log-date');
    logStartInput    = document.getElementById('log-start');
    logEndInput      = document.getElementById('log-end');
    logModalClose    = document.getElementById('log-modal-close');
    logModalCancel   = document.getElementById('log-modal-cancel');
    logModalSave     = document.getElementById('log-modal-save');
    logModalDelete    = document.getElementById('log-modal-delete');
    weeklyReportModal = document.getElementById('weekly-report-modal');
    weeklyReportBody  = document.getElementById('weekly-report-body');
    weeklyReportClose = document.getElementById('weekly-report-close');

    // Restore active session from storage (page reload mid-session)
    const saved = Storage.getActiveTimer();
    if (saved && saved.bucket && saved.startTime) {
      activeBucket = saved.bucket;
      startTime = new Date(saved.startTime);
      bucketSelect.value = activeBucket;
      _startElapsed();
      _setRunningUI();
      if (typeof App !== 'undefined') App.updateProjectDetails(activeBucket);
    }

    _renderWeeklyTotals();
    _renderLogList();

    if (!_bound) {
      toggleBtn.addEventListener('click', _handleToggle);
      if (logModalClose)  logModalClose.addEventListener('click', _closeLogModal);
      if (logModalCancel) logModalCancel.addEventListener('click', _closeLogModal);
      if (logModalSave)   logModalSave.addEventListener('click', _saveLogEdit);
      if (logModalDelete) logModalDelete.addEventListener('click', _deleteLog);
      if (logModal) logModal.addEventListener('click', e => { if (e.target === logModal) _closeLogModal(); });
      if (weeklyReportClose) weeklyReportClose.addEventListener('click', _closeWeeklyReport);
      if (weeklyReportModal) weeklyReportModal.addEventListener('click', e => { if (e.target === weeklyReportModal) _closeWeeklyReport(); });
      _bound = true;
    }
  }

  // --- Public ---

  function formatElapsed(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function calculateWeeklyTotals(logs) {
    const weekStart = _getWeekStart();
    const totals = {};

    logs.forEach(log => {
      if (!log.start || !log.end) return;
      const logStart = new Date(log.start);
      if (logStart < weekStart) return;

      const duration = Math.floor((new Date(log.end) - logStart) / 1000);
      if (duration <= 0) return;
      totals[log.bucket] = (totals[log.bucket] || 0) + duration;
    });

    return totals;
  }

  function getState() {
    return {
      isRunning,
      activeBucket,
      startTime: startTime ? startTime.toISOString() : null
    };
  }

  // --- Private ---

  function _handleToggle() {
    if (isRunning) {
      _clockOut();
    } else {
      _clockIn();
    }
  }

  function _clockIn() {
    const bucket = bucketSelect.value;
    if (!bucket) return; // no bucket selected — do nothing

    activeBucket = bucket;
    startTime = new Date();

    Storage.saveActiveTimer({ bucket, startTime: startTime.toISOString() });
    _startElapsed();
    _setRunningUI();
    if (typeof App !== 'undefined') App.updateProjectDetails(activeBucket);
  }

  function _clockOut() {
    const endTime = new Date();
    const log = {
      id: Date.now().toString(),
      bucket: activeBucket,
      start: startTime.toISOString(),
      end: endTime.toISOString()
    };

    const logs = Storage.getTimeLogs();
    logs.push(log);
    Storage.saveTimeLogs(logs);
    Storage.saveActiveTimer(null);

    _stopElapsed();
    _setIdleUI();
    _renderWeeklyTotals();
    _renderLogList();
    if (typeof App !== 'undefined') App.updateProjectDetails(null);
  }

  function _startElapsed() {
    isRunning = true;
    _updateElapsed();
    intervalId = setInterval(_updateElapsed, 1000);
  }

  function _stopElapsed() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    activeBucket = null;
    startTime = null;
  }

  function _updateElapsed() {
    const diff = Math.floor((new Date() - startTime) / 1000);
    elapsedDisplay.textContent = formatElapsed(diff);
    elapsedDisplay.classList.add('active');
  }

  function _setRunningUI() {
    toggleBtn.textContent = 'Clock Out';
    toggleBtn.classList.add('clocked-in');
    bucketSelect.disabled = true;
    if (startTimeDisplay) { startTimeDisplay.style.display = 'flex'; _renderStartTime(); }
  }

  function _setIdleUI() {
    toggleBtn.textContent = 'Clock In';
    toggleBtn.classList.remove('clocked-in');
    bucketSelect.disabled = false;
    elapsedDisplay.textContent = '0:00:00';
    elapsedDisplay.classList.remove('active');
    if (startTimeDisplay) startTimeDisplay.style.display = 'none';
  }

  function _renderWeeklyTotals() {
    if (!weeklyContainer) return;

    const totals = calculateWeeklyTotals(Storage.getTimeLogs());
    const entries = Object.entries(totals);

    if (entries.length === 0) {
      weeklyContainer.innerHTML = '';
      return;
    }

    // Sort by most time spent first
    entries.sort((a, b) => b[1] - a[1]);

    let html = `<div class="tracker-weekly-header">
      <span class="tracker-weekly-title">This Week</span>
      <button class="tracker-weekly-report-btn" title="View full weekly report">Report</button>
    </div>`;
    entries.forEach(([bucket, seconds]) => {
      const label = bucket.startsWith('project:')
        ? _resolveProjectName(bucket)
        : bucket;
      html += `<div class="tracker-weekly-row">
        <span class="tracker-weekly-bucket">${label}</span>
        <span class="tracker-weekly-time">${formatElapsed(seconds)}</span>
      </div>`;
    });

    weeklyContainer.innerHTML = html;
    const reportBtn = weeklyContainer.querySelector('.tracker-weekly-report-btn');
    if (reportBtn) reportBtn.addEventListener('click', _openWeeklyReport);
  }

  function _resolveProjectName(bucketKey) {
    const id = bucketKey.replace('project:', '');
    const project = Storage.getProjects().find(p => p.id === id);
    return project ? project.name : bucketKey;
  }

  function _getWeekStart(offset) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=Sun, 1=Mon...
    const diff = day === 0 ? -6 : 1 - day; // back to Monday
    d.setDate(d.getDate() + diff + (offset || 0) * 7);
    return d;
  }

  // ─── Editable start time ───────────────────────────────────────────────────

  function _renderStartTime() {
    if (!startTimeDisplay || !startTime) return;
    const h = String(startTime.getHours()).padStart(2, '0');
    const m = String(startTime.getMinutes()).padStart(2, '0');
    startTimeDisplay.innerHTML = `
      <span class="tracker-started-label">Started</span>
      <input type="time" id="tracker-start-input" class="tracker-time-input" value="${h}:${m}">
    `;
    document.getElementById('tracker-start-input').addEventListener('change', e => {
      const [newH, newM] = e.target.value.split(':').map(Number);
      if (isNaN(newH) || isNaN(newM)) return;
      const adjusted = new Date(startTime);
      adjusted.setHours(newH, newM, 0, 0);
      if (adjusted > new Date()) return; // disallow future start times
      startTime = adjusted;
      Storage.saveActiveTimer({ bucket: activeBucket, startTime: startTime.toISOString() });
    });
  }

  // ─── Recent entry list ─────────────────────────────────────────────────────

  function _renderLogList() {
    if (!logList) return;
    const recent = Storage.getTimeLogs().filter(l => l.end).slice(-5).reverse();
    if (recent.length === 0) { logList.innerHTML = ''; return; }
    let html = '<div class="tracker-logs-title">Recent Entries</div>';
    recent.forEach(log => {
      const start = new Date(log.start);
      const end   = new Date(log.end);
      const dur   = Math.floor((end - start) / 1000);
      const label = log.bucket.startsWith('project:') ? _resolveProjectName(log.bucket) : log.bucket;
      html += `<div class="tracker-log-entry">
        <span class="tracker-log-bucket" title="${label}">${label}</span>
        <span class="tracker-log-time">${_fmt12(start)}–${_fmt12(end)}</span>
        <span class="tracker-log-dur">${formatElapsed(dur)}</span>
        <button class="tracker-log-edit" data-id="${log.id}" title="Edit entry">✏</button>
      </div>`;
    });
    logList.innerHTML = html;
    logList.querySelectorAll('.tracker-log-edit').forEach(btn => {
      btn.addEventListener('click', () => _openLogModal(btn.dataset.id));
    });
  }

  function _fmt12(date) {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}:${m}${ampm}`;
  }

  // ─── Log edit modal ────────────────────────────────────────────────────────

  function _openLogModal(logId) {
    const log = Storage.getTimeLogs().find(l => l.id === logId);
    if (!log || !logModal) return;
    _editingLogId = logId;
    const s = new Date(log.start);
    const e = new Date(log.end);
    const label = log.bucket.startsWith('project:') ? _resolveProjectName(log.bucket) : log.bucket;
    if (logBucketDisplay) logBucketDisplay.textContent = label;
    if (logDateInput)  logDateInput.value  = _toDateVal(s);
    if (logStartInput) logStartInput.value = _toTimeVal(s);
    if (logEndInput)   logEndInput.value   = _toTimeVal(e);
    logModal.style.display = 'flex';
  }

  function _closeLogModal() {
    if (logModal) logModal.style.display = 'none';
    _editingLogId = null;
  }

  function _saveLogEdit() {
    if (!_editingLogId || !logDateInput || !logStartInput || !logEndInput) return;
    const date   = logDateInput.value;
    const startT = logStartInput.value;
    const endT   = logEndInput.value;
    if (!date || !startT || !endT) return;
    const newStart = new Date(`${date}T${startT}:00`);
    let   newEnd   = new Date(`${date}T${endT}:00`);
    if (newEnd <= newStart) newEnd.setDate(newEnd.getDate() + 1); // midnight crossover
    const logs = Storage.getTimeLogs();
    const idx  = logs.findIndex(l => l.id === _editingLogId);
    if (idx === -1) return;
    logs[idx].start = newStart.toISOString();
    logs[idx].end   = newEnd.toISOString();
    Storage.saveTimeLogs(logs);
    _closeLogModal();
    _renderWeeklyTotals();
    _renderLogList();
  }

  function _deleteLog() {
    if (!_editingLogId) return;
    Storage.saveTimeLogs(Storage.getTimeLogs().filter(l => l.id !== _editingLogId));
    _closeLogModal();
    _renderWeeklyTotals();
    _renderLogList();
  }

  function _toDateVal(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function _toTimeVal(d) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // ─── Weekly report modal ───────────────────────────────────────────────────

  function _openWeeklyReport() {
    if (!weeklyReportModal || !weeklyReportBody) return;
    _weekOffset = 0;
    _refreshWeeklyReport();
    weeklyReportModal.style.display = 'flex';
  }

  function _refreshWeeklyReport() {
    if (!weeklyReportBody) return;
    weeklyReportBody.innerHTML = _buildWeeklyReportHTML();
    const prevBtn = weeklyReportBody.querySelector('.wr-nav-prev');
    const nextBtn = weeklyReportBody.querySelector('.wr-nav-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { _weekOffset--; _refreshWeeklyReport(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { _weekOffset++; _refreshWeeklyReport(); });
  }

  function _closeWeeklyReport() {
    if (weeklyReportModal) weeklyReportModal.style.display = 'none';
  }

  function _buildWeeklyReportHTML() {
    const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const DAY_NAMES  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    const weekStart = _getWeekStart(_weekOffset);
    const weekEnd   = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    const logs = Storage.getTimeLogs().filter(l => l.start && l.end);
    const bucketDay = {}; // { bucket: [sec×7] }
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];

    logs.forEach(log => {
      const logStart    = new Date(log.start);
      const logMidnight = new Date(logStart.getFullYear(), logStart.getMonth(), logStart.getDate());
      const dayIdx      = Math.round((logMidnight - weekStart) / 86400000);
      if (dayIdx < 0 || dayIdx > 6) return;
      const dur = Math.floor((new Date(log.end) - logStart) / 1000);
      if (dur <= 0) return;
      if (!bucketDay[log.bucket]) bucketDay[log.bucket] = [0, 0, 0, 0, 0, 0, 0];
      bucketDay[log.bucket][dayIdx] += dur;
      dayTotals[dayIdx] += dur;
    });

    const buckets   = Object.keys(bucketDay);
    const weekTotal = dayTotals.reduce((a, b) => a + b, 0);
    const rangeStr  = `${MONTH_ABBR[weekStart.getMonth()]} ${weekStart.getDate()} \u2013 ${MONTH_ABBR[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;

    const navHTML = `<div class="wr-nav">
      <button class="wr-nav-btn wr-nav-prev">← Prev</button>
      <span class="wr-range">${rangeStr}</span>
      <button class="wr-nav-btn wr-nav-next"${_weekOffset === 0 ? ' disabled' : ''}>Next →</button>
    </div>`;

    if (buckets.length === 0) {
      return `${navHTML}<p class="placeholder-text" style="margin-top:12px;">No time logged this week.</p>`;
    }

    buckets.sort((a, b) =>
      bucketDay[b].reduce((x, y) => x + y, 0) - bucketDay[a].reduce((x, y) => x + y, 0)
    );

    let html = navHTML;
    html += `<div class="wr-grand-total">Week Total: <span>${formatElapsed(weekTotal)}</span></div>`;
    html += `<div class="wr-table-wrap"><table class="wr-table"><thead><tr>`;
    html += `<th class="wr-th-bucket"></th>`;
    days.forEach((d, i) => {
      html += `<th class="wr-th-day">${DAY_NAMES[i]}<br><small>${MONTH_ABBR[d.getMonth()]} ${d.getDate()}</small></th>`;
    });
    html += `<th class="wr-th-total">Total</th></tr></thead><tbody>`;

    buckets.forEach(bucket => {
      const label    = bucket.startsWith('project:') ? _resolveProjectName(bucket) : bucket;
      const rowTotal = bucketDay[bucket].reduce((x, y) => x + y, 0);
      html += `<tr><td class="wr-bucket-name" title="${label}">${label}</td>`;
      bucketDay[bucket].forEach(sec => {
        html += `<td class="wr-day-cell${sec > 0 ? '' : ' wr-empty'}">${sec > 0 ? _fmtHM(sec) : '\u2014'}</td>`;
      });
      html += `<td class="wr-row-total">${formatElapsed(rowTotal)}</td></tr>`;
    });

    html += `</tbody><tfoot><tr><td class="wr-foot-label">Day Total</td>`;
    dayTotals.forEach(sec => {
      html += `<td class="wr-day-total${sec > 0 ? '' : ' wr-empty'}">${sec > 0 ? _fmtHM(sec) : '\u2014'}</td>`;
    });
    html += `<td class="wr-row-total">${formatElapsed(weekTotal)}</td></tr></tfoot></table></div>`;

    return html;
  }

  function _fmtHM(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  }

  return { init, formatElapsed, calculateWeeklyTotals, getState };
})();
