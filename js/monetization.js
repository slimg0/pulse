// Ads (AdMob) + purchases (RevenueCat) behind one tiny API.
// In a browser it falls back to clearly-labelled simulations so you can test the
// whole flow without any account. On a device it uses the native plugins.
window.PMoney = (function () {
  const C = PULSE_CONFIG;
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const platform = native ? cap.getPlatform() : 'web';
  const plug = n => (cap && cap.Plugins && cap.Plugins[n]) || null;
  const ids = C.ads[platform] || {};
  const prices = {};          // real localised prices from the store
  let ready = false, recovered = 0;

  // ---------- init ----------
  async function init() {
    if (!native) return;
    const AdMob = plug('AdMob');
    if (AdMob) {
      try {
        // iOS: App Tracking Transparency prompt
        if (platform === 'ios' && AdMob.trackingAuthorizationStatus) {
          const st = await AdMob.trackingAuthorizationStatus();
          if (st.status === 'notDetermined' && AdMob.requestTrackingAuthorization) await AdMob.requestTrackingAuthorization();
        }
        // EU/UK consent (GDPR / UMP) — mandatory for AdMob in France.
        const info = await AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
      } catch (e) { console.warn('consent', e); }
      try {
        await AdMob.initialize({ initializeForTesting: C.TEST_MODE });
        ready = true; preloadRewarded(); preloadInterstitial();
      } catch (e) { console.warn('admob', e); }
    }
    const RC = plug('Purchases');
    if (RC) {
      try {
        await RC.configure({ apiKey: C.revenuecat[platform] });
        await refreshPrices();
        recovered = await syncOwned();
      } catch (e) { console.warn('revenuecat', e); }
    }
  }

  // ---------- ads ----------
  const preloadRewarded = () => { try { plug('AdMob').prepareRewardVideoAd({ adId: ids.rewarded, isTesting: C.TEST_MODE }); } catch (e) {} };
  const preloadInterstitial = () => { try { plug('AdMob').prepareInterstitial({ adId: ids.interstitial, isTesting: C.TEST_MODE }); } catch (e) {} };

  // Resolves true ONLY if the player earned the reward.
  function showRewarded() {
    if (!native) return window.PUI.mockAd(PI18n.t('adRewarded'), true);
    return new Promise(async resolve => {
      const AdMob = plug('AdMob'); let earned = false, done = false, subs = [];
      const finish = v => { if (done) return; done = true; subs.forEach(s => { try { s.remove(); } catch (e) {} }); preloadRewarded(); resolve(v); };
      try {
        subs.push(await AdMob.addListener('onRewardedVideoAdReward', () => { earned = true; }));
        subs.push(await AdMob.addListener('onRewardedVideoAdDismissed', () => finish(earned)));
        subs.push(await AdMob.addListener('onRewardedVideoAdFailedToShow', () => finish(false)));
        const r = await AdMob.showRewardVideoAd();
        if (r && r.amount !== undefined) earned = true;
      } catch (e) { finish(false); }
    });
  }

  async function showInterstitial() {
    if (!native) return window.PUI.mockAd(PI18n.t('adPopup'), false);
    try { await plug('AdMob').showInterstitial(); } catch (e) {}
    preloadInterstitial();
  }

  async function privacyOptions() {
    const AdMob = plug('AdMob');
    if (native && AdMob && AdMob.showPrivacyOptionsForm) { try { await AdMob.showPrivacyOptionsForm(); } catch (e) {} }
  }

  // ---------- purchases ----------
  async function refreshPrices() {
    const RC = plug('Purchases'); if (!RC) return;
    const { products } = await RC.getProducts({ productIdentifiers: PULSE_CATALOG.products.map(p => p.id), type: 'NON_SUBSCRIPTION' });
    products.forEach(p => { prices[p.identifier] = p.priceString; });
  }
  // Runs at every launch: re-applies owned items and credits any paid pack that a
  // crash prevented from being credited. Returns shards recovered.
  async function syncOwned() {
    const RC = plug('Purchases'); if (!RC) return 0;
    const { customerInfo } = await RC.getCustomerInfo();
    return PEcon.reconcile(customerInfo);
  }
  async function restorePurchases() {
    if (!native) return { ok: C.TEST_MODE, simulated: true };
    try {
      const { customerInfo } = await plug('Purchases').restorePurchases();
      PEcon.reconcile(customerInfo);
      return { ok: true };
    } catch (e) { return { ok: false }; }
  }
  // Returns {ok, info} or {cancelled}. The store has already taken payment when ok.
  async function buy(id) {
    if (!native) return C.TEST_MODE ? { ok: true, simulated: true, info: null } : { ok: false };
    try {
      const RC = plug('Purchases');
      const { products } = await RC.getProducts({ productIdentifiers: [id], type: 'NON_SUBSCRIPTION' });
      if (!products.length) return { ok: false };
      const r = await RC.purchaseStoreProduct({ product: products[0] });
      return { ok: true, info: r && r.customerInfo };
    } catch (e) {
      return e && e.userCancelled ? { cancelled: true } : { ok: false };
    }
  }

  const priceOf = p => prices[p.id] || p.price;

  return { init, native, showRewarded, showInterstitial, privacyOptions,
           buy, restorePurchases, priceOf, simulated: !native && C.TEST_MODE,
           takeRecovered() { const r = recovered; recovered = 0; return r; } };
})();
