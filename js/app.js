/**
 * TRUFlow — App Initialization
 * Bootstraps the application and wires up panel modules.
 */

const App = (() => {
  function init() {
    // Initialize localStorage with defaults on first run
    Storage.initDefaults();

    // Populate the time tracker bucket dropdown from settings
    populateBucketDropdown();

    // Wire up settings modal
    setupSettingsModal();

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

  function setupSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const btnOpen = document.getElementById('btn-settings');
    const btnClose = document.getElementById('settings-close');

    btnOpen.addEventListener('click', () => {
      modal.style.display = 'flex';
    });

    btnClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Expose for other modules to call when projects change
  function refreshBucketDropdown() {
    populateBucketDropdown();
  }

  return {
    init,
    refreshBucketDropdown
  };
})();

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
