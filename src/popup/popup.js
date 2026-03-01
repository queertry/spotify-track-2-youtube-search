(() => {
  const UI = {
    DROP_ANYWHERE: {
      KEY: 'DROP_ANYWHERE',
      ELEMENT_ID: 'drop-anywhere',
      EVENT: 'change'
    },
    USE_CACHE: {
      KEY: 'USE_CACHE',
      ELEMENT_ID: 'use-cache',
      EVENT: 'change'
    }
  };

  function getInput(elementId) {
    return document.getElementById(elementId);
  }

  async function loadIntoUI() {
    await window.ST2YS.Settings.loadAll();

    for (const item of Object.values(UI)) {
      const input = getInput(item.ELEMENT_ID);
      if (!input) {
        console.error(`ST2YS: Could not load settings ${item.KEY} into element ${item.ELEMENT_ID} because the element could not be found.`);
        continue;
      }

      const meta  = window.ST2YS.Settings.getDefinition(item.KEY);
      const value = window.ST2YS.Settings.getValue(item.KEY);

      if (meta.type === 'boolean') {
        input.checked = !!value;
        continue;
      }

      input.value = value;
    }
  }

  function formatBytes(n) {
    if (n < 1024)        return `${n} bytes`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function loadCacheInfo() {
    const sizeElement = document.getElementById('cache-size');
    if (!sizeElement) {
      console.error('ST2YS: Could not load cache info, cache element not found');
      return;
    }

    const bytes = await window.ST2YS.Cache.getBytesUsed();
    sizeElement.textContent = formatBytes(bytes ?? 0);
    sizeElement.removeAttribute('aria-label');
  }

  function bindCacheUI() {
    const btn = document.getElementById('cache-clear');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      await window.ST2YS.Cache.clearAll();
      await loadCacheInfo();
    });
  }

  function bindUI() {
    for (const item of Object.values(UI)) {
      const element = getInput(item.ELEMENT_ID);
      if (!element) {
        console.error(`ST2YS: Could not bind event listener for setting ${item.KEY} and element ${item.ELEMENT_ID} because the element could not be found.`);
        continue;
      }

      const meta = window.ST2YS.Settings.getDefinition(item.KEY);
      element.addEventListener(item.EVENT, async () => {
        if (meta.type === 'boolean') {
          await window.ST2YS.Settings.setValue(item.KEY, !!element.checked);
          return;
        }

        await window.ST2YS.Settings.setValue(item.KEY, element.value);
      });
    }
  }

  function setupData() {
    const manifest = browser.runtime.getManifest();
    document.getElementById('version-number').textContent = manifest.version;
    document.getElementById('copyright-link').setAttribute('href', manifest.homepage_url);
  }

  async function init() {
    setupData();

    bindUI();
    bindCacheUI();

    await loadIntoUI();
    await loadCacheInfo();
  }

  document.addEventListener('DOMContentLoaded', init);
})();