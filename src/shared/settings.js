(() => {
  let _schema = null;

  const cache = Object.create(null);
  const changeCallbacks = new Set();

  let loaded = false;
  let loadPromise = null;

  function coerce(key, value) {
    const setting = _schema?.[key];
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
    for (const [ key, definition ] of Object.entries(_schema)) {
      obj[key] = definition.default;
    }

    return obj;
  }

  async function loadAll() {
    console.info('ST2YS', 1);

    if (loadPromise) return loadPromise;
    if (loaded) return Promise.resolve();

    console.info('ST2YS', 2);

    loadPromise = (async () => {
      console.info('ST2YS', 3);
      await window.ST2YS.ResourceLoader.ready();
      _schema = window.ST2YS.Resources.Settings;
      console.info('ST2YS', 4);

      const defaults = getDefaultSettings();
      console.info('ST2YS', 5);

      const stored = await browser.storage.local.get(Object.keys(_schema));
      console.info('ST2YS', 6);

      for (const key of Object.keys(_schema)) {
        const raw = Object.prototype.hasOwnProperty.call(stored, key)
          ? stored[key]
          : defaults[key];

        cache[key] = coerce(key, raw);
      }

      console.info('ST2YS', 7);

      loaded = true;
      return Promise.resolve();
    })();

    return loadPromise;
  }

  function getValue(key) {
    if (!loaded) return undefined;
    return cache[key];
  }

  function getDefinition(key) {
    return _schema?.[key];
  }

  async function setValue(key, value) {
    if (!_schema?.[key]) return;

    const coercedValue = coerce(key, value);
    cache[key] = coercedValue;

    await browser.storage.local.set({ [key]: coercedValue });
  }

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    for (const [ key, change ] of Object.entries(changes)) {
      if (!_schema?.[key]) continue;

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
    get schema() { return _schema; },
    getDefinition,
    loadAll,
    getValue,
    setValue,
    onChange
  };
})();
