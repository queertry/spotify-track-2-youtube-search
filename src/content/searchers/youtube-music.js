(() => {
  class YouTubeMusicSearcher extends window.ST2YS.Searchers.Base {
    constructor() {
      super({
        searchBarSelector:           '.search-container input.ytmusic-search-box',
        searchIconSelector:          '.search-container yt-icon-button svg',
        searchUrl:                   'https://music.youtube.com/search?q=',
        firstSuggestionSelector:     '#suggestion-list ytmusic-search-suggestion',
        suggestionContainerSelector: '#suggestion-list',
      });
    }
  }

  window.ST2YS.Searchers              = window.ST2YS.Searchers || {};
  window.ST2YS.Searchers.YouTubeMusic = new YouTubeMusicSearcher();
})();
