(() => {

  const PREFIX      = 'cache_';
  const INDEX_KEY   = 'cache__index';
  const TTL_MS      = 30 * 24 * 60 * 60 * 1000; // 30 days
  const MAX_ENTRIES = 2000;
  const MAX_BYTES   = 5 * 1024 * 1024; // 5MB

  const textEncoder = new TextEncoder();
  const bytesOf     = value => textEncoder.encode(String(value)).length;
  const prefixedKey = key => `${PREFIX}${key}`;

  let pruneInProgress = null;

  async function loadIndex() {
    const stored = await browser.storage.local.get(INDEX_KEY);
    return stored[INDEX_KEY] || {};
  }

  async function saveIndex(index) {
    await browser.storage.local.set({ [INDEX_KEY]: index });
  }

  function schedulePrune() {
    if (pruneInProgress) return;

    pruneInProgress = (async () => {
      try {
        await pruneNow();
      } finally {
        pruneInProgress = null;
      }
    })();

    pruneInProgress.catch(() => {});
  }

  async function computeTotalBytes(index) {
    if (index === undefined) index = await loadIndex();

    let total = 0;
    for (const meta of Object.values(index)) {
      total += (meta && meta.bytes) ? meta.bytes : 0;
    }

    return total;
  }

  async function pruneNow() {
    let index = await loadIndex();
    const currentTime = Date.now();

    // 1) Remove expired entries
    const expiredKeys = [];

    for (const [ key, meta ] of Object.entries(index)) {
      if (!meta) continue;
      if (!meta.expiresAt) continue;
      if (meta.expiresAt > currentTime) continue;

      expiredKeys.push(key);
    }

    if (expiredKeys.length) {
      await browser.storage.local.remove(expiredKeys.map(prefixedKey));
      for (const key of expiredKeys) delete index[key];
    }

    // 2) Enforce limits (LRU (= least recently used) by lastAccess)
    const allKeys = Object.keys(index);
    if (!allKeys.length) {
      await browser.storage.local.remove(INDEX_KEY);
      return;
    }

    let totalBytes = await computeTotalBytes(index);

    const isOverEntries = () =>
      (typeof MAX_ENTRIES === 'number') &&
      (MAX_ENTRIES >= 0) &&
      (Object.keys(index).length > MAX_ENTRIES);

    const isOverBytes = () =>
      (typeof MAX_BYTES === 'number') &&
      (MAX_BYTES >= 0) &&
      (totalBytes > MAX_BYTES);

    if (!isOverEntries() && !isOverBytes()) {
      await saveIndex(index);
      return;
    }

    const keysSortedByLeastRecentlyUsed = Object.keys(index).sort((a, b) => {
      const timeA = (index[a] && index[a].lastAccess) ? index[a].lastAccess : 0;
      const timeB = (index[b] && index[b].lastAccess) ? index[b].lastAccess : 0;
      return timeA - timeB;
    });

    const keysToRemove = [];
    for (const key of keysSortedByLeastRecentlyUsed) {
      if (!isOverEntries() && !isOverBytes()) break;

      keysToRemove.push(key);
      totalBytes -= (index[key] && index[key].bytes) ? index[key].bytes : 0;
      delete index[key];
    }

    if (keysToRemove.length) {
      await browser.storage.local.remove(keysToRemove.map(prefixedKey));
    }

    await saveIndex(index);
  }

  function scheduleTouchUpdate(index, key) {
    // fire-and-forget lastAccess update
    const meta = index[key];
    if (!meta) return;

    meta.lastAccess = Date.now();
    index[key] = meta;

    saveIndex(index).catch(() => {});
  }

  async function get(key) {
    if (typeof key !== 'string') throw new TypeError('key must be a string');

    const storageKey = prefixedKey(key);

    let index  = await loadIndex();
    const meta = index[key];
    if (!meta) {
      console.debug('ST2YS Cache: miss (not in index)', key);
      return null;
    }

    if (meta.expiresAt && meta.expiresAt <= Date.now()) {
      console.debug('ST2YS Cache: miss (expired)', key);
      await browser.storage.local.remove(storageKey);
      delete index[key];
      await saveIndex(index);

      schedulePrune();
      return null;
    }

    const stored = await browser.storage.local.get(storageKey);
    const value = stored[storageKey];

    if (value == null) {
      console.debug('ST2YS Cache: miss (value missing from storage)', key);
      delete index[key];
      await saveIndex(index);

      schedulePrune();
      return null;
    }

    console.debug('ST2YS Cache: hit', key, '→', value);
    scheduleTouchUpdate(index, key);
    schedulePrune();

    return value;
  }

  async function set(key, value) {
    if (typeof key !== 'string') throw new TypeError('key must be a string');
    if (value == null) throw new TypeError('value is required');

    const currentTime = Date.now();
    const expiresAt = (TTL_MS != null) ? (currentTime + TTL_MS) : null;

    const storageKey = prefixedKey(key);

    await browser.storage.local.set({ [storageKey]: value });

    let index = await loadIndex();
    index[key] = {
      expiresAt,
      lastAccess: currentTime,
      bytes: bytesOf(JSON.stringify(value)) + bytesOf(key)
    };

    console.debug('ST2YS Cache: set', key, '→', value);
    await saveIndex(index);
    schedulePrune();
  }

  async function del(key) {
    if (typeof key !== 'string') throw new TypeError('key must be a string');

    let index = await loadIndex();
    if (!index[key]) return;

    await browser.storage.local.remove(prefixedKey(key));
    delete index[key];
    await saveIndex(index);
  }

  async function clearAll() {
    const index = await loadIndex();
    const keys = Object.keys(index);

    if (keys.length) {
      await browser.storage.local.remove(keys.map(prefixedKey));
    }

    await browser.storage.local.remove(INDEX_KEY);
    console.debug('ST2YS Cache: cleared', keys.length, 'entries');
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.type !== 'ST2YS_CACHE') return;

    switch (message.operation) {
      case 'get':          return get(message.key);
      case 'set':          return set(message.key, message.value);
      case 'del':          return del(message.key);
      case 'clearAll':     return clearAll();
      case 'getBytesUsed': return computeTotalBytes();
    }
  });

})();
