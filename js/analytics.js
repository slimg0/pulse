// Firebase Analytics, opt-in only (required in France/EU: no stats before consent).
// Off until PULSE_CONFIG.analytics.enabled is true AND the Firebase config files are
// in the native projects (see REMAINING.md). Silent no-op in a browser.
window.PAnalytics = (function () {
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const FA = () => (cap && cap.Plugins && cap.Plugins.FirebaseAnalytics) || null;
  const available = () => native && !!(PULSE_CONFIG.analytics && PULSE_CONFIG.analytics.enabled) && !!FA();
  const on = () => available() && PState.get().stats === 1;

  // Collection is disabled by default in the native config; this switches it.
  async function applyConsent() {
    if (!available()) return;
    const yes = PState.get().stats === 1, st = yes ? 'GRANTED' : 'DENIED';
    try {
      await FA().setConsent({ type: 'ANALYTICS_STORAGE', status: st });
      // Ads data in Analytics stays denied: we never link analytics to ad profiles.
      await FA().setConsent({ type: 'AD_STORAGE', status: 'DENIED' });
      await FA().setEnabled({ enabled: yes });
    } catch (e) { console.warn('analytics consent', e); }
  }
  function setConsent(yes) { PState.get().stats = yes ? 1 : 0; PState.save(); return applyConsent(); }
  const needsConsent = () => available() && PState.get().stats === -1;

  // Event names follow Firebase's recommended game events where one exists,
  // so the built-in Firebase reports (retention, funnels) work out of the box.
  function log(name, params) {
    if (!on()) return;
    try { FA().logEvent({ name, params: params || {} }); } catch (e) {}
  }
  function screen(name) {
    if (!on()) return;
    try { FA().setCurrentScreen({ screenName: name }); } catch (e) {}
  }

  return { applyConsent, setConsent, needsConsent, available, log, screen };
})();
