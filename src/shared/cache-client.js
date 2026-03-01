(() => {

  window.ST2YS = window.ST2YS || {};

  function isCacheEnabled() {
    return window.ST2YS.Settings.getValue('USE_CACHE');
  }

  function call(operation, payload) {
    if (!isCacheEnabled()) return Promise.resolve(null);
    return browser.runtime.sendMessage({
      type: 'ST2YS_CACHE',
      operation,
      ...(payload || {})
    });
  }

  function callAlways(operation, payload) {
    // Bypasses isCacheEnabled — for clearAll and getBytesUsed in popup context.
    return browser.runtime.sendMessage({
      type: 'ST2YS_CACHE',
      operation,
      ...(payload || {})
    });
  }

  window.ST2YS.Cache = {
    get(key)        { return call('get',  { key }); },
    set(key, value) { return call('set',  { key, value }); },
    del(key)        { return call('del',  { key }); },
    clearAll()      { return callAlways('clearAll'); },
    getBytesUsed()  { return callAlways('getBytesUsed'); }
  };

})();
