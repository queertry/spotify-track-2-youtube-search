(() => {
  const normalizeText = s => (s || '').replace(/\s+/g, ' ').trim();

  class ST2YSBaseAdapter {
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

    getSearchBar() {
      return document.querySelector(this._searchBarSelector);
    }

    getSearchIcon() {
      return document.querySelector(this._searchIconSelector);
    }

    _getFirstSuggestion() {
      return document.querySelector(this._firstSuggestionSelector);
    }

    _getSuggestionContainer() {
      return document.querySelector(this._suggestionContainerSelector);
    }

    _getSearchUrl(query) {
      return this._searchUrl + encodeURIComponent(query);
    }

    _clickSuggestion(suggestion) {
      suggestion.click();
    }

    _hideSuggestions() {
      const container = this._getSuggestionContainer();
      this._originalSuggestionOpacity = container.style.opacity;
      container.style.opacity = 0;
    }

    _revertSuggestionOpacity() {
      const container = this._getSuggestionContainer();
      container.style.opacity = this._originalSuggestionOpacity || 1;
      this._originalSuggestionOpacity = null;
    }

    _search(query) {
      const suggestion = this._getFirstSuggestion();

      const suggestionNormalized = suggestion && normalizeText(suggestion.textContent).toLowerCase();
      const suggestionMatchesQuery = suggestionNormalized === query.toLowerCase();

      if (suggestionMatchesQuery) {
        this._clickSuggestion(suggestion);
        return true;
      }

      const input = this.getSearchBar();
      const form = input && input.parentElement;
      if (form && typeof form.submit === 'function') {
        form.submit();
        return true;
      }

      window.location = this._getSearchUrl(query);
      return true;
    }

    performSearch(query, openInNewTab) {
      if (openInNewTab) {
        window.open(this._getSearchUrl(query), '_blank');
        return true;
      }

      const input = this.getSearchBar();
      if (!input) {
        console.error('ST2YS: Cannot find search input');
        return false;
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

  window.ST2YS = window.ST2YS || {};
  window.ST2YS.BaseAdapter = ST2YSBaseAdapter;
})();
