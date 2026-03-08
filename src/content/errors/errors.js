(() => {
  class InvalidLinkError extends Error {
    constructor() {
      super('Failed to extract a track ID from the link.');
      this.name = 'InvalidLinkError';
    }
  }

  class FetchFailedError extends Error {
    constructor() {
      super('Failed to reach the upstream to fetch track info.');
      this.name = 'FetchFailedError';
    }
  }

  class ParseFailedError extends Error {
    constructor() {
      super("Failed to read the track title and artist from the upstream's response.");
      this.name = 'ParseFailedError';
    }
  }

  class MethodNotImplementedError extends Error {
    constructor() {
      super('This method must be implemented by a subclass.');
      this.name = 'MethodNotImplementedError';
    }
  }

  window.ST2YS        = window.ST2YS        || {};
  window.ST2YS.Errors = window.ST2YS.Errors || {};

  window.ST2YS.Errors.InvalidLinkError          = InvalidLinkError;
  window.ST2YS.Errors.FetchFailedError          = FetchFailedError;
  window.ST2YS.Errors.ParseFailedError          = ParseFailedError;
  window.ST2YS.Errors.MethodNotImplementedError = MethodNotImplementedError;
})();
