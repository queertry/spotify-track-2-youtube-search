(() => {
  function toElementId(key) {
    return key.toLowerCase().replace(/_/g, '-');
  }

  function resolveInputType(def) {
    return def.inputType ?? (def.type === 'boolean' ? 'checkbox' : 'number');
  }

  function buildSettingsUI() {
    const schema = window.ST2YS.Settings.schema;

    for (const [ key, def ] of Object.entries(schema)) {
      const elementId = toElementId(key);
      const hintId    = `${elementId}-hint`;
      const inputType = resolveInputType(def);

      const section = document.getElementById(def.section);
      if (!section) {
        console.error(`ST2YS: Section "${def.section}" not found for setting ${key}`);
        continue;
      }

      const label = document.createElement('label');
      label.className = 'setting-label';
      label.setAttribute('aria-describedby', hintId);

      if (inputType === 'select') {
        const span = document.createElement('span');
        span.textContent = def.label;
        label.appendChild(span);

        const select = document.createElement('select');
        select.id = elementId;

        for (const opt of (def.options ?? [])) {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          select.appendChild(option);
        }

        label.appendChild(select);
      } else {
        const input = document.createElement('input');
        input.type = inputType;
        input.id   = elementId;
        label.appendChild(input);
        label.appendChild(document.createTextNode(def.label));
      }

      const hint = document.createElement('div');
      hint.id          = hintId;
      hint.className   = 'hint';
      hint.textContent = def.hint;

      section.appendChild(label);
      section.appendChild(hint);
    }
  }

  function loadIntoUI() {
    const schema = window.ST2YS.Settings.schema;

    for (const [ key, def ] of Object.entries(schema)) {
      const elementId = toElementId(key);
      const input     = document.getElementById(elementId);
      if (!input) {
        console.error(`ST2YS: Failed to load setting ${key} into element #${elementId} because the element could not be found.`);
        continue;
      }

      if (resolveInputType(def) === 'checkbox') {
        input.checked = !!window.ST2YS.Settings.getValue(key);
      } else {
        input.value = String(window.ST2YS.Settings.getValue(key));
      }
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
      console.error('ST2YS: Failed to load cache info, cache element not found');
      return;
    }

    const { bytes, count } = await window.ST2YS.Cache.getStats();
    const trackLabel = count === 1 ? 'track' : 'tracks';

    sizeElement.textContent = count > 0 ? `${count} ${trackLabel} (${formatBytes(bytes)}) stored in cache` : `0 tracks stored in cache`;
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
    const schema = window.ST2YS.Settings.schema;

    for (const [ key, def ] of Object.entries(schema)) {
      const elementId = toElementId(key);
      const element   = document.getElementById(elementId);
      if (!element) {
        console.error(`ST2YS: Failed to bind event listener for setting ${key} and element #${elementId} because the element could not be found.`);
        continue;
      }

      element.addEventListener('change', async () => {
        if (resolveInputType(def) === 'checkbox') {
          await window.ST2YS.Settings.setValue(key, !!element.checked);
        } else {
          await window.ST2YS.Settings.setValue(key, element.value);
        }
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
    await window.ST2YS.Settings.loadAll();

    buildSettingsUI();
    bindUI();

    bindCacheUI();
    loadIntoUI();

    await loadCacheInfo();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
