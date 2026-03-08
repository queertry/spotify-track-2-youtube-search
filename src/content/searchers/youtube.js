(() => {
  class YouTubeSearcher extends window.ST2YS.Searchers.Base {
    constructor() {
      super({
        searchBarSelector:           'input.yt-searchbox-input',
        searchIconSelector:          'yt-searchbox button.ytSearchboxComponentSearchButton svg',
        searchUrl:                   'https://www.youtube.com/results?search_query=',
        firstSuggestionSelector:     '.ytSearchboxComponentSuggestionsContainer .ytSuggestionComponentSuggestion',
        suggestionContainerSelector: '.ytSearchboxComponentSuggestionsContainer',
      });
    }

    /**
     * @param {HTMLElement} suggestion
     */
    _clickSuggestion(suggestion) {
      suggestion.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0,
        buttons: 1,
        clientX: 0,
        clientY: 0
      }));
    }
  }

  window.ST2YS.Searchers         = window.ST2YS.Searchers || {};
  window.ST2YS.Searchers.YouTube = new YouTubeSearcher();
})();
