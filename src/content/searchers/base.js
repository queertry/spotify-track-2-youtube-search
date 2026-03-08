(() => {
  class BaseSearcher {
    constructor({
      searchBarSelector, searchIconSelector, searchUrl,
      firstSuggestionSelector, suggestionContainerSelector,
      searchWait = 200
    }) {
      this._searchBarSelector           = searchBarSelector;
      this._searchIconSelector          = searchIconSelector;
      this._searchUrl                   = searchUrl;
      this._firstSuggestionSelector     = firstSuggestionSelector;
      this._suggestionContainerSelector = suggestionContainerSelector;
      this._searchWait                  = searchWait;
      this._originalSuggestionOpacity   = null;
    }

    /**
     * @returns {?HTMLElement}
     */
    getSearchBar() {
      return document.querySelector(this._searchBarSelector);
    }

    /**
     * @returns {?HTMLElement}
     */
    getSearchIcon() {
      return document.querySelector(this._searchIconSelector);
    }

    /**
     * @returns {?HTMLElement}
     */
    _getFirstSuggestion() {
      return document.querySelector(this._firstSuggestionSelector);
    }

    /**
     * @returns {?HTMLElement}
     */
    _getSuggestionContainer() {
      return document.querySelector(this._suggestionContainerSelector);
    }

    /**
     * @param {string} query
     * @returns {string}
     */
    _getSearchUrl(query) {
      return this._searchUrl + encodeURIComponent(query);
    }

    /**
     * Builds the search query string from a Track object.
     * Override in subclasses for service-specific query formatting.
     *
     * @param {{ title: string, artist: string }} track
     * @returns {string}
     */
    _buildQuery(track) {
      return `${track.title} ${track.artist}`;
    }

    /**
     * @param {HTMLElement} suggestion
     */
    _clickSuggestion(suggestion) {
      suggestion.click();
    }

    _hideSuggestions() {
      const container = this._getSuggestionContainer();
      if (!container) return;
      
      this._originalSuggestionOpacity = container.style.opacity;
      container.style.opacity = 0;
    }

    _revertSuggestionOpacity() {
      const container = this._getSuggestionContainer();
      if (!container) return;

      container.style.opacity = this._originalSuggestionOpacity || 1;
      this._originalSuggestionOpacity = null;
    }

    /**
     * Performs the actual search itself
     * @param {string} query
     * @returns {boolean}
     */
    _search(query) {
      const suggestion = this._getFirstSuggestion();

      const suggestionNormalized   = suggestion && window.ST2YS.Utils.normalizeText(suggestion.textContent).toLowerCase();
      const suggestionMatchesQuery = suggestionNormalized === query.toLowerCase();

      if (suggestionMatchesQuery) {
        this._clickSuggestion(suggestion);
        return true;
      }

      const input = this.getSearchBar();
      const form  = input && input.parentElement;
      if (form && typeof form.submit === 'function') {
        form.submit();
        return true;
      }

      window.location = this._getSearchUrl(query);
      return true;
    }

    /**
     * Searches for the given track on this site.
     *
     * @param {{ title: string, artist: string }} track
     * @param {boolean} openInNewTab
     * @returns {Promise<void>}
     */
    search(track, openInNewTab) {
      const query = this._buildQuery(track);

      if (openInNewTab) {
        window.open(this._getSearchUrl(query), '_blank');
        return Promise.resolve();
      }

      const input = this.getSearchBar();
      if (!input) {
        console.error('ST2YS: Cannot find search input');
        return Promise.resolve();
      }

      const preferSmoothSearch = window.ST2YS.Settings.getValue('PREFER_SMOOTH_SEARCH');

      input.value = query;
      if (preferSmoothSearch) {
        this._hideSuggestions();
        input.focus();
      }

      input.dispatchEvent(new Event('input',  { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

      if (preferSmoothSearch) {
        const that = this;
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              const success = that._search(query);
              if (success) {
                resolve();
                return;
              }

              reject();
            } finally {
              that._revertSuggestionOpacity();
            }
          }, this._searchWait);
        });
      }

      const success = this._search(query);
      if (success) return Promise.resolve();
      return Promise.reject();
    }
  }

  window.ST2YS                = window.ST2YS || {};
  window.ST2YS.Searchers      = window.ST2YS.Searchers || {};
  window.ST2YS.Searchers.Base = BaseSearcher;
})();
