(() => {
  async function initSettings() {
    await window.ST2YS.Settings.loadAll();
  }

  const SPOTIFY_PREFIX = 'https://open.spotify.com/track';

  const getSearchInput = () => document.querySelector('input.yt-searchbox-input');
  const normalizeText  = s  => (s || '').replace(/\s+/g, ' ').trim();

  let youtubeSearchIcon = null;

  function setLoading() {
    const icon = window.ST2YS.Icons.get('loading');
    icon.classList.add('st2ys-loading-icon');

    const searchIcon = document.querySelector('yt-searchbox button.ytSearchboxComponentSearchButton svg');
    if (searchIcon === null) {
      console.error('ST2YS: Cannot start loading, YouTube\'s search icon couldn\'t be found.');
      return;
    }

    youtubeSearchIcon = searchIcon;
    searchIcon.replaceWith(icon);
  }

  function stopLoading() {
    if (youtubeSearchIcon === null) {
      console.error('ST2YS: Cannot cancel loading animation, missing copy of original search icon');
      return;
    }

    document.querySelector('svg.st2ys-loading-icon').replaceWith(youtubeSearchIcon);
  }

  function getTrackId(trackLink) {
    trackLink = normalizeText(trackLink);
    if (!trackLink.startsWith(SPOTIFY_PREFIX)) return null;

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

    const title  = normalizeText(titleElement  && titleElement.innerText);
    const artist = normalizeText(artistElement && artistElement.innerText);

    if (!title || !artist) {
      console.error('ST2YS: Was not able to find title and/or artist');
      return null;
    }

    return { title, artist };
  };

  function setQueryAndSubmit(query) {
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

  async function handle(trackLink) {
    setLoading();

    trackLink = normalizeText(trackLink);
    if (!trackLink.startsWith(SPOTIFY_PREFIX)) {
      stopLoading();
      return;
    }

    const trackId = getTrackId(trackLink);
    if (!trackId) {
      stopLoading();
      console.error('ST2YS: Could not extract track id');
      return;
    }

    const cached = await window.ST2YS.Cache.get(trackId);
    if (cached) {
      setQueryAndSubmit(cached);
      return;
    }

    const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    const resp = await browser.runtime.sendMessage({
      type: 'FETCH_SPOTIFY_TRACK',
      url: embedUrl
    });

    if (!resp || !resp.ok) {
      stopLoading();
      console.error('ST2YS: Could not fetch spotify embed page');
      if (resp.error) {
        console.error('ST2YS: ' + resp.error);
      }

      return;
    }

    const meta = parseSpotifyEmbedHtml(resp.html);
    if (!meta) {
      stopLoading();
      return;
    }

    const query = `${meta.title} ${meta.artist}`;
    window.ST2YS.Cache.set(trackId, query).catch(() => {});
    setQueryAndSubmit(query);
  }

  function onPaste(e) {
    const input = getSearchInput();
    if (!input) {
      console.error('ST2YS: Cannot find search input');
      return;
    }

    if (e.target !== input) return;

    handle(e.clipboardData && e.clipboardData.getData('text/plain'));
    e.preventDefault();
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

    handle(e.dataTransfer && e.dataTransfer.getData('text/plain'));
    e.preventDefault();
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
    await initSettings();

    // Attach now, and also retry briefly in case YouTube swaps the input
    document.body.addEventListener('dragover', onDragOver, true);
    document.body.addEventListener('drop', onDrop, true);

    if (attach()) return;

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (attach() || tries >= 30) window.clearInterval(timer);
    }, 500);
  })();
  
})();