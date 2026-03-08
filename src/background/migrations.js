(() => {
  // Each migration runs once when the extension updates past its introducedIn version.
  // Migrations are run in order; add new entries at the bottom.
  const migrations = [
    {
      introducedIn: '1.4.0',
      async run() {
        // Cache format changed from strings to { title, artist } objects.
        // Entries from older versions cannot be transformed without re-fetching,
        // so we clear the cache entirely.
        await self.ST2YS_BGCache.clearAll();
      }
    },
  ];

  function compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i] || 0) - (pb[i] || 0);
      if (diff !== 0) return diff;
    }

    return 0;
  }

  async function runMigrations(fromVersion) {
    const currentVersion = browser.runtime.getManifest().version;
    const applicable = migrations.filter(m =>
      compareVersions(m.introducedIn, fromVersion) > 0 &&
      compareVersions(m.introducedIn, currentVersion) <= 0
    );

    for (const migration of applicable) {
      console.info(`ST2YS Migrations: running v${migration.introducedIn}`);
      try {
        await migration.run();
        console.info(`ST2YS Migrations: v${migration.introducedIn} completed`);
      } catch (e) {
        console.error(`ST2YS Migrations: v${migration.introducedIn} failed`, e);
      }
    }
  }

  browser.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
    if (reason !== 'update') return;
    runMigrations(previousVersion || '0.0.0').catch(e =>
      console.error('ST2YS Migrations: unexpected error', e)
    );
  });
})();
