(() => {
  class BaseResolver {
    /**
     * Returns true if this resolver can attempt to handle the given raw content.
     * Synchronous and fast (string prefix / regex only).
     * Does NOT guarantee that extract() will succeed.
     *
     * @param {string} rawContent
     * @returns {boolean}
     */
    canHandle(rawContent) {
      return false;
    }

    /**
     * Resolves raw content (a service-specific URL or text) to a Track object.
     * Throws a specific error from window.ST2YS.Errors on failure.
     *
     * @param {string} rawContent
     * @returns {Promise<{ title: string, artist: string }>}
     */
    async extract(rawContent) {
      throw new window.ST2YS.Errors.MethodNotImplementedError();
    }
  }

  window.ST2YS                = window.ST2YS           || {};
  window.ST2YS.Resolvers      = window.ST2YS.Resolvers || {};
  window.ST2YS.Resolvers.Base = BaseResolver;
})();
