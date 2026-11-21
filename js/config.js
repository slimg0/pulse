// ============================================================
//  PULSE — central config. Edit this file before you ship.
// ============================================================
window.PULSE_CONFIG = {
  // true  = Google test ads, simulated purchases in a browser.
  // false = REAL ads and purchases. Flip ONLY for the store release build.
  TEST_MODE: true,

  // AdMob ad unit IDs. The values below are Google's official TEST units.
  // Replace with your own (AdMob console > Apps > Ad units) for release.
  ads: {
    android: {
      rewarded:     'ca-app-pub-3940256099942544/5224354917',
      interstitial: 'ca-app-pub-3940256099942544/1033173712'
    },
    ios: {
      rewarded:     'ca-app-pub-3940256099942544/1712485313',
      interstitial: 'ca-app-pub-3940256099942544/4411468910'
    }
  },

  // RevenueCat public SDK keys (app.revenuecat.com > Project > API keys).
  revenuecat: {
    android: 'goog_REPLACE_ME',
    ios:     'appl_REPLACE_ME'
  },

  // Pop-up ad pacing. Kept gentle on purpose: players who feel spammed leave.
  interstitial: {
    freeRuns: 3,        // no pop-up ads during the first N runs
    everyNthGameOver: 3,
    minGapMs: 90000     // never closer than 90 s to any previous ad
  },

  freeShardsAd: { reward: 150, cooldownMs: 3 * 60 * 1000 },

  // Firebase Analytics (opt-in). Set to true ONLY after adding google-services.json
  // (Android) and GoogleService-Info.plist (iOS) — see REMAINING.md.
  analytics: { enabled: false },

  privacyUrl: 'https://example.com/pulse/privacy'   // REQUIRED by both stores
};
