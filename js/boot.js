(function () {
  PUI.bindUI();
  if (PState.tampered()) { PUI.toast(PI18n.t('tTamper')); }
  PMoney.init().then(async () => {
    const rec = PMoney.takeRecovered();
    if (rec > 0) PUI.toast(PI18n.t('tRecovered', { n: PI18n.num(rec) }));
    PUI.refreshWallet();
    // Ask for stats only after the ads consent / tracking prompts are finished.
    await PAnalytics.applyConsent();
    PUI.maybeAskConsent();
  });
  // Dev helper (browser only): ?cheat=5000 adds shards in test mode.
  try {
    const m = /cheat=(\d+)/.exec(location.search);
    if (m && PULSE_CONFIG.TEST_MODE && !PMoney.native) { PState.get().shards += +m[1]; PState.save(); PUI.refreshWallet(); }
  } catch (e) {}
})();
