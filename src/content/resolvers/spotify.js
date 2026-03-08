(() => {
  const SPOTIFY_HTTP_PREFIX   = 'https://open.spotify.com/track';
  const SPOTIFY_NATIVE_PREFIX = 'spotify:track:';

  class SpotifyResolver extends window.ST2YS.Resolvers.Base {
    canHandle(rawContent) {
      const s = window.ST2YS.Utils.normalizeText(rawContent);
      return s.startsWith(SPOTIFY_HTTP_PREFIX) || s.startsWith(SPOTIFY_NATIVE_PREFIX);
    }

    async extract(rawContent) {
      const trackId = this._parseTrackId(window.ST2YS.Utils.normalizeText(rawContent));
      if (!trackId) {
        throw new window.ST2YS.Errors.InvalidLinkError();
      }

      const cached = await window.ST2YS.Cache.get(trackId);
      if (cached) {
        return cached;
      }

      const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
      const resp = await browser.runtime.sendMessage({
        type: 'FETCH_SPOTIFY_TRACK',
        url: embedUrl
      });

      if (!resp || !resp.ok) {
        if (resp && resp.error) console.error('ST2YS:', resp.error);
        throw new window.ST2YS.Errors.FetchFailedError();
      }

      const track = this._parseEmbedHtml(resp.html);
      window.ST2YS.Cache.set(trackId, track).catch(() => {});

      return track;
    }

    _parseTrackId(trackLink) {
      if (trackLink.startsWith(SPOTIFY_HTTP_PREFIX)) {
        try {
          const url   = new URL(trackLink);
          const parts = url.pathname.split('/').filter(x => !!x);

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

    _parseEmbedHtml(html) {
      if (!html) {
        console.error('ST2YS: Did not receive any HTML');
        throw new window.ST2YS.Errors.ParseFailedError();
      }

      const doc           = new DOMParser().parseFromString(html, 'text/html');
      const titleElement  = doc.querySelector('h1 a');
      const artistElement = doc.querySelector('h2 a');
      const title         = window.ST2YS.Utils.normalizeText(titleElement  && titleElement.textContent);
      const artist        = window.ST2YS.Utils.normalizeText(artistElement && artistElement.textContent);

      if (!title || !artist) {
        console.error('ST2YS: Was not able to find title and/or artist');
        throw new window.ST2YS.Errors.ParseFailedError();
      }

      return { title, artist };
    }
  }

  window.ST2YS.Resolvers         = window.ST2YS.Resolvers || {};
  window.ST2YS.Resolvers.Spotify = new SpotifyResolver();
})();
