(() => {
  const SETTINGS = {
    DROP_ANYWHERE: {
      type: 'boolean',
      default: false
    },
    USE_CACHE: {
      type: 'boolean',
      default: true
    }
  };

  const cache = Object.create(null);
  const changeCallbacks = new Set();

  let loaded = false;
  let loadPromise = null;

  function coerce(key, value) {
    const setting = SETTINGS[key];
    if (!setting) return value;

    if (setting.type === 'boolean') return !!value;
    if (setting.type === 'string') return (value || '').toString();

    if (setting.type === 'number') {
      const n = Number(value);
      return Number.isFinite(n) ? n : setting.default;
    }

    return value;
  }

  function getDefaultSettings() {
    const obj = {};
    for (const [ key, definition ] of Object.entries(SETTINGS)) {
      obj[key] = definition.default;
    }

    return obj;
  }

  async function loadAll() {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      const defaults = getDefaultSettings();
      const stored = await browser.storage.local.get(Object.keys(SETTINGS));

      for (const key of Object.keys(SETTINGS)) {
        const raw = Object.prototype.hasOwnProperty.call(stored, key)
          ? stored[key]
          : defaults[key];

        cache[key] = coerce(key, raw);
      }

      loaded = true;
      return { ...cache };
    })();

    return loadPromise;
  }

  function getValue(key) {
    if (!loaded) {
      return coerce(key, SETTINGS[key]?.default);
    }

    return cache[key];
  }

  function getDefinition(key) {
    return SETTINGS[key];
  }

  async function setValue(key, value) {
    if (!SETTINGS[key]) return;

    const coercedValue = coerce(key, value);
    cache[key] = coercedValue;

    await browser.storage.local.set({ [key]: coercedValue });
  }

   browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    for (const [ key, change ] of Object.entries(changes)) {
      if (!SETTINGS[key]) continue;

      const value = coerce(key, change.newValue);
      cache[key] = value;

      for (const cb of changeCallbacks) {
        try { cb(key, value); } catch (e) { /* ignore */ }
      }
    }
  });

  function onChange(callback) {
    if (typeof callback !== 'function') return () => {};
    changeCallbacks.add(callback);
    return () => changeCallbacks.delete(callback);
  }

  window.ST2YS = window.ST2YS || {};
  window.ST2YS.Settings = {
    schema: SETTINGS,
    getDefinition,
    loadAll,
    getValue,
    setValue,
    onChange
  };
})();