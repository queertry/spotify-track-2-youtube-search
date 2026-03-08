(() => {
  const searcher = (window.location.hostname === 'music.youtube.com')
    ? window.ST2YS.Searchers.YouTubeMusic
    : window.ST2YS.Searchers.YouTube;

  // Ordered list of resolvers; first whose canHandle() returns true wins.
  // To add support for a new service, register its resolver here.
  const resolvers = [
    window.ST2YS.Resolvers.Spotify,
  ];

  let youtubeSearchIcon = null;
  let loadingIcon = null;
  let isHandling = false;
  let shiftHeld = false;

  function findResolver(rawContent) {
    return resolvers.find(r => r.canHandle(rawContent)) || null;
  }

  function setLoading() {
    const icon = window.ST2YS.Icons.get('loading');
    icon.classList.add('st2ys-loading-icon');

    const searchIcon = searcher.getSearchIcon();
    if (searchIcon === null) {
      console.error('ST2YS: Cannot start loading, search icon couldn\'t be found.');
      return;
    }

    loadingIcon = icon;
    youtubeSearchIcon = searchIcon;

    searchIcon.replaceWith(icon);
  }

  function stopLoading() {
    if (youtubeSearchIcon === null) {
      console.error('ST2YS: Cannot cancel loading animation, missing copy of original search icon');
      return;
    }

    loadingIcon.replaceWith(youtubeSearchIcon);

    loadingIcon = null;
    youtubeSearchIcon = null;
  }

  async function handle(resolver, rawContent, openInNewTab) {
    if (isHandling) return;
    isHandling = true;

    try {
      setLoading();

      let track;

      try {
        track = await resolver.extract(rawContent);
      } catch (e) {
        console.error('ST2YS:', e.message || e);
        window.ST2YS.Toast.show(e.message || 'An unexpected error occurred.');
        return;
      }

      await searcher.search(track, openInNewTab);
    } finally {
      stopLoading();
      isHandling = false;
    }
  }

  function onPaste(e) {
    const input = searcher.getSearchBar();
    if (!input) {
      console.error('ST2YS: Cannot find search input');
      return;
    }

    if (e.target !== input) return;

    const text = e.clipboardData && e.clipboardData.getData('text/plain');
    const resolver = findResolver(text);
    if (!resolver) return;

    e.preventDefault();

    // paste has no e.shiftKey — use the tracked shiftHeld flag instead
    handle(resolver, text, window.ST2YS.Settings.getValue('OPEN_IN_NEW_TAB') || shiftHeld);
  }

  function onDrop(e) {
    const input = searcher.getSearchBar();
    if (!input) return;

    const isDroppingOnInput = e.target === input;
    if (!window.ST2YS.Settings.getValue('DROP_ANYWHERE') && !isDroppingOnInput) {
      return;
    }

    const text = e.dataTransfer && e.dataTransfer.getData('text/plain');
    const resolver = findResolver(text);
    if (!resolver) return;

    e.preventDefault();

    // drop exposes shiftKey directly
    handle(resolver, text, window.ST2YS.Settings.getValue('OPEN_IN_NEW_TAB') || e.shiftKey);
  }

  function onDragOver(e) {
    const input = searcher.getSearchBar();
    if (!input) return;

    const isDroppingOnInput = e.target === input;
    if (!window.ST2YS.Settings.getValue('DROP_ANYWHERE') && !isDroppingOnInput) {
      return;
    }

    // Required to allow drop
    e.preventDefault();
  }

  function attach() {
    const input = searcher.getSearchBar();
    if (!input) return false;

    input.addEventListener('paste', onPaste, true);
    return true;
  }

  (async () => {
    console.info('ST2YS: Loading main logic...');
    await window.ST2YS.Settings.loadAll();

    // Track Shift key state to override a potential FALSE value of OPEN_IN_NEW_TAB specifically when pasting the link
    document.addEventListener('keydown', e => { if (e.key === 'Shift') shiftHeld = true;  }, true);
    document.addEventListener('keyup',   e => { if (e.key === 'Shift') shiftHeld = false; }, true);

    // Allow drag-and-drop of tracks onto the page as a whole
    document.body.addEventListener('dragover', onDragOver, true);
    document.body.addEventListener('drop', onDrop, true);

    // Attach now, and also retry briefly in case YouTube swaps the input
    if (attach()){
      console.info('ST2YS: Main logic loaded successfully.');
      return;
    }

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      const attached = attach();

      if (attached || tries >= 30) {
        if (!attached && tries >= 30) {
          console.error('ST2YS: Main logic failed to load.');
        }

        window.clearInterval(timer);
      }
    }, 500);
  })();

})();