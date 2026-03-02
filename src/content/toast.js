(() => {

  window.ST2YS = window.ST2YS || {};

  let activeToast = null;
  let autoDismissTimer = null;

  function show(message) {
    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }

    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
    }

    const doc = new DOMParser().parseFromString(`
      <div class="st2ys-toast" role="status" aria-live="polite">
        <span>${message}</span>
        <button class="st2ys-toast-close" aria-label="Dismiss">&#x2715;</button>
      </div>
    `, 'text/html');

    const toast = doc.body.firstElementChild;
    toast.querySelector('.st2ys-toast-close').addEventListener('click', () => {
      toast.remove();
      activeToast = null;

      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer);
        autoDismissTimer = null;
      }
    });

    document.body.appendChild(toast);
    activeToast = toast;

    const duration = window.ST2YS.Settings.getValue('TOAST_DURATION');
    if (duration > 0) {
      autoDismissTimer = setTimeout(() => {
        toast.remove();
        if (activeToast === toast) activeToast = null;

        autoDismissTimer = null;
      }, duration * 1000);
    }
  }

  window.ST2YS.Toast = { show };

})();
