(() => {

  const cache = Object.create(null);

  window.ST2YS = window.ST2YS || {};
  window.ST2YS.Icons = window.ST2YS.Icons || {};

  window.ST2YS.Icons.get = icon => {
    if (typeof cache[icon] !== "undefined") {
      return cache[icon];
    }

    const propertyExists = typeof window.ST2YS.Icons._library[icon] !== "undefined";
    const isFunction     = propertyExists && (typeof window.ST2YS.Icons._library[icon] === "function");

    if (isFunction) {
      const raw = window.ST2YS.Icons._library[icon]();

      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'image/svg+xml');

      return cache[icon] = doc.documentElement;
    }

    return null;
  };

})();