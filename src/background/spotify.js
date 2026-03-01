browser.runtime.onMessage.addListener(msg => {
  if (!msg || msg.type !== 'FETCH_SPOTIFY_TRACK') {
    return;
  }

  const url = msg.url || '';
  if (!url.startsWith('https://open.spotify.com/embed/track/')) {
    return { ok: false, error: 'Not a Spotify track embed URL.' };
  }

  return (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        redirect: 'follow'
      });

      if (!res.ok) {
        return { ok: false, error: `Fetch failed: ${res.status} ${res.statusText}` };
      }

      const html = await res.text();
      return { ok: true, html };
    } catch (e) {
      return { ok: false, error: e };
    }
  })();
});