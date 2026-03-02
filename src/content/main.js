(() => {
  async function initSettings() {
    await window.ST2YS.Settings.loadAll();
  }

  const SPOTIFY_HTTP_PREFIX   = 'https://open.spotify.com/track';
  const SPOTIFY_NATIVE_PREFIX = 'spotify:track:';

  const getSearchInput = () => document.querySelector('input.yt-searchbox-input');
  const normalizeText  = s  => (s || '').replace(/\s+/g, ' ').trim();

  let youtubeSearchIcon = null;
  let loadingIcon = null;
  let isHandling = false;
  let shiftHeld = false;

  function setLoading() {
    const icon = window.ST2YS.Icons.get('loading');
    icon.classList.add('st2ys-loading-icon');

    const searchIcon = document.querySelector('yt-searchbox button.ytSearchboxComponentSearchButton svg');
    if (searchIcon === null) {
      console.error('ST2YS: Cannot start loading, YouTube\'s search icon couldn\'t be found.');
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

  function getTrackId(trackLink) {
    trackLink = normalizeText(trackLink);

    if (trackLink.startsWith(SPOTIFY_HTTP_PREFIX)) {
      try {
        const url = new URL(trackLink);
        const parts = url.pathname.split('/').filter(x => !!x);

        if (parts[0] !== 'track') return null;
        if (!parts[1]) return null;

        return parts[1];
      } catch (e) {
        console.error('ST2YS:', e);
        return null;
      }
    }

    if (trackLink.startsWith(SPOTIFY_NATIVE_PREFIX)) {
      const id = trackLink.slice(SPOTIFY_NATIVE_PREFIX.length);
      return id || null;
    }

    return null;
  }

  function parseSpotifyEmbedHtml(html) {
    if (!html) {
      console.error('ST2YS: Did not receive any HTML');
      return null;
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      console.error('ST2YS: Cannot parse HTML');
      return null;
    }

    const titleElement  = doc.querySelector('h1 a');
    const artistElement = doc.querySelector('h2 a');

    const title  = normalizeText(titleElement  && titleElement.textContent);
    const artist = normalizeText(artistElement && artistElement.textContent);

    if (!title || !artist) {
      console.error('ST2YS: Was not able to find title and/or artist');
      return null;
    }

    return { title, artist };
  };

  function setQueryAndSubmit(query, openInNewTab) {
    if (openInNewTab) {
      window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(query), '_blank');
      return true;
    }

    const input = getSearchInput();
    if (!input) {
      stopLoading();
      console.error('ST2YS: Cannot find search input');
      return false;
    }

    input.value = query;

    // Make YouTube react to the value change
    input.dispatchEvent(new Event('input',  { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    const form = input.parentElement;
    if (!form || typeof form.submit !== 'function') {
      stopLoading();
      console.error('ST2YS: Cannot find form to submit');
      return false;
    } 

    form.submit();
    return true;
  }

  async function handle(trackLink, openInNewTab) {
    if (isHandling) return;
    isHandling = true;

    try {
      setLoading();

      const trackId = getTrackId(normalizeText(trackLink));
      if (!trackId) {
        stopLoading();
        console.error('ST2YS: Failed to extract track id');
        window.ST2YS.Toast.show('Failed to extract a track ID from the link.');
        return;
      }

      const cached = await window.ST2YS.Cache.get(trackId);
      if (cached) {
        setQueryAndSubmit(cached, openInNewTab);
        return;
      }

      const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
      const resp = await browser.runtime.sendMessage({
        type: 'FETCH_SPOTIFY_TRACK',
        url: embedUrl
      });

      if (!resp || !resp.ok) {
        stopLoading();
        console.error('ST2YS: Failed to fetch spotify embed page');
        if (resp && resp.error) console.error('ST2YS: ' + resp.error);
        window.ST2YS.Toast.show('Failed to reach Spotify to fetch track info.');
        return;
      }

      const meta = parseSpotifyEmbedHtml(resp.html);
      if (!meta) {
        stopLoading();
        window.ST2YS.Toast.show('Failed to read the track title and artist from Spotify\'s response.');
        return;
      }

      const query = `${meta.title} ${meta.artist}`;
      window.ST2YS.Cache.set(trackId, query).catch(() => {});
      setQueryAndSubmit(query, openInNewTab);
    } finally {
      isHandling = false;
    }
  }

  function onPaste(e) {
    const input = getSearchInput();
    if (!input) {
      console.error('ST2YS: Cannot find search input');
      return;
    }

    if (e.target !== input) return;

    const text = e.clipboardData && e.clipboardData.getData('text/plain');
    if (!getTrackId(text)) return;
    e.preventDefault();

    // paste has no e.shiftKey — use the tracked shiftHeld flag instead
    handle(text, window.ST2YS.Settings.getValue('OPEN_IN_NEW_TAB') || shiftHeld);
  }

  function onDrop(e) {
    const input = getSearchInput();
    if (!input) {
      console.error('ST2YS: Cannot find search input');
      return;
    }

    const isDroppingOnInput = e.target === input;
    if (!window.ST2YS.Settings.getValue('DROP_ANYWHERE') && !isDroppingOnInput) {
      return;
    }

    const text = e.dataTransfer && e.dataTransfer.getData('text/plain');
    if (!getTrackId(text)) return;
    e.preventDefault();

    // drop exposes shiftKey directly
    handle(text, window.ST2YS.Settings.getValue('OPEN_IN_NEW_TAB') || e.shiftKey);
  }

  function onDragOver(e) {
    const input = getSearchInput();
    if (!input) return;

    const isDroppingOnInput = e.target === input;
    if (!window.ST2YS.Settings.getValue('DROP_ANYWHERE') && !isDroppingOnInput) {
      return;
    }

    // Required to allow drop
    e.preventDefault();
  }

  function attach() {
    const input = getSearchInput();
    if (!input) return false;

    input.addEventListener('paste', onPaste, true);

    return true;
  }

  (async () => {
    console.info('ST2YS: Loading extension...');
    await initSettings();

    // Track Shift key state to override a potential FALSE value of OPEN_IN_NEW_TAB specifically when pasting the link
    document.addEventListener('keydown', e => { if (e.key === 'Shift') shiftHeld = true;  }, true);
    document.addEventListener('keyup',   e => { if (e.key === 'Shift') shiftHeld = false; }, true);

    // Allow drag-and-drop of tracks onto the page as a whole
    document.body.addEventListener('dragover', onDragOver, true);
    document.body.addEventListener('drop', onDrop, true);

    // Attach now, and also retry briefly in case YouTube swaps the input
    if (attach()){
      console.info('ST2YS: Extension loaded successfully.');
      return;
    } 

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      const attached = attach();

      if (attached || tries >= 30) {
        if (!attached && tries >= 30) {
          console.error('ST2YS: Extension failed to load.');
        }

        window.clearInterval(timer);
      }
    }, 500);
  })();
  
})();