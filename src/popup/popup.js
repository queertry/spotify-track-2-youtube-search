(() => {
  const UI = {
    DROP_ANYWHERE: {
      KEY: 'DROP_ANYWHERE',
      ELEMENT_ID: 'drop-anywhere',
      EVENT: 'change'
    }
  };

  function getInput(elementId) {
    return document.getElementById(elementId);
  }

  async function loadIntoUI() {
    await window.ST2YS.Settings.loadAll();

    for (const item of Object.values(UI)) {
      const input = getInput(item.ELEMENT_ID);
      if (!input) {
        console.error(`ST2YS: Could not load settings ${item.KEY} into element ${item.ELEMENT_ID} because the element could not be found.`);
        continue;
      }

      const meta  = window.ST2YS.Settings.getDefinition(item.KEY);
      const value = window.ST2YS.Settings.getValue(item.KEY);

      if (meta.type === 'boolean') {
        input.checked = !!value;
        continue;
      }

      input.value = value;
    }
  }

  function bindUI() {
    for (const item of Object.values(UI)) {
      const element = getInput(item.ELEMENT_ID);
      if (!element) {
        console.error(`ST2YS: Could not bind event listener for setting ${item.KEY} and element ${item.ELEMENT_ID} because the element could not be found.`);
        continue;
      }

      const meta = window.ST2YS.Settings.getDefinition(item.KEY);
      element.addEventListener(item.EVENT, async () => {
        if (meta.type === 'boolean') {
          await window.ST2YS.Settings.setValue(item.KEY, !!element.checked);
          return;
        }

        await window.ST2YS.Settings.setValue(item.KEY, element.value);
      });
    }
  }

  async function init() {
    bindUI();
    await loadIntoUI();
  }

  document.addEventListener('DOMContentLoaded', init);
})();