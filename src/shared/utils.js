(() => {
  window.ST2YS = window.ST2YS || {};
  window.ST2YS.Utils = {
    normalizeText: s => (s || '').replace(/\s+/g, ' ').trim()
  };
})();