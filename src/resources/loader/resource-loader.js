(() => {
  window.ST2YS = window.ST2YS || {};
  window.ST2YS.Resources = window.ST2YS.Resources || {};

  const BASE = browser.runtime.getURL(typeof RESOURCES_BASE !== 'undefined' ? RESOURCES_BASE : 'src/resources/');

  async function load({ name, label }) {
    console.info('ST2YS', { name, label });

    if (!name.endsWith('.json')) {
      throw new Error('ST2YS ResourceLoader: Cannot load non-json resource file');
    }

    const resp = await fetch(BASE + name);
    if (!resp.ok) throw new Error(`ST2YS ResourceLoader: Failed to load "${name}" (${resp.status})`);

    const data = await resp.json();
    window.ST2YS.Resources[label] = data;

    return data;
  }

  const _readyPromise = fetch(BASE + 'index.json')
    .then(r => r.json()).then(contents => Promise.all(contents.files.map(load).filter(x => !!x)));

  window.ST2YS.ResourceLoader = {
    ready: () => _readyPromise
  };
})();
