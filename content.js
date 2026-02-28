(() => {
  const SPOTIFY_PREFIX = 'https://open.spotify.com/track';

  const getSearchInput = () => document.querySelector('input.yt-searchbox-input');
  const normalizeText  = s  => (s || '').replace(/\s+/g, ' ').trim();

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
      console.error('ST2YS: Cannot find search input');
      return false;
    }

    input.value = query;

    // Make YouTube react to the value change
    input.dispatchEvent(new Event('input',  { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    const form = input.parentElement;
    if (!form || typeof form.submit !== 'function') {
      console.error('ST2YS: Cannot find form to submit');
      return false;
    } 

    form.submit();
    return true;
  };

  async function handle(trackLink) {
    trackLink = normalizeText(trackLink);
    if (!trackLink.startsWith(SPOTIFY_PREFIX)) return;

    const trackId = getTrackId(trackLink);
    if (!trackId) {
      console.error('ST2YS: Could not extract track id');
      return;
    }

    const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    const resp = await browser.runtime.sendMessage({
      type: 'FETCH_SPOTIFY_TRACK',
      url: embedUrl
    });

    if (!resp || !resp.ok) {
      console.error('ST2YS: Could not fetch spotify embed page');
      if (resp.error) {
        console.error('ST2YS: ' + resp.error);
      }

      return;
    }

    const meta = parseSpotifyEmbedHtml(resp.html);
    if (!meta) return;

    const query = `${meta.title} ${meta.artist}`;
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

    if (e.target !== input) return;

    handle(e.dataTransfer && e.dataTransfer.getData('text/plain'));
    e.preventDefault();
  }

  function onDragOver(e) {
    const input = getSearchInput();
    if (!input) return;

    if (e.target !== input) return;

    // Required to allow drop
    e.preventDefault();
  }

  function attach() {
    const input = getSearchInput();
    if (!input) return false;

    input.addEventListener('paste', onPaste, true);
    input.addEventListener('dragover', onDragOver, true);
    input.addEventListener('drop', onDrop, true);

    return true;
  }

  // Attach now, and also retry briefly in case YouTube swaps the input
  if (attach()) return;

  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (attach() || tries >= 30) window.clearInterval(timer);
  }, 500);
})();