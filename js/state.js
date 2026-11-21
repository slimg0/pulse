// Save data with a tamper checksum.
// NOTE: anything stored on the device can be edited by a determined user, so
// real-money purchases are NEVER trusted from here — they are re-verified with
// the store (via RevenueCat) on every launch. This checksum only stops casual
// edits of soft currency.
(function () {
  const KEY = 'pulse_save_v1', SALT = 'p!ulse-7f3a-' + 'k9';
  let tampered = false;

  function hash(str) {
    let h = 2166136261; const s = str + SALT;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  const DEFAULT = () => ({
    v: 1, shards: 0, best: 0, runs: 0, perfects: 0,
    owned: { cyan: 1 }, skin: 'cyan',
    up: { boost: 0, wide: 0, shield: 0 },
    noAds: 0, double: 0, starter: 0,
    streak: 0, lastDaily: 0, lastFree: 0,
    sound: 1, haptics: 1, sinceAd: 0, lastAd: 0,
    tutDone: 0, redSeen: 0, lang: '', stats: -1,   // stats: -1 = not asked yet, 0 = refused, 1 = allowed
    iapGranted: {}                     // purchases already credited, counted per product id
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return DEFAULT();
      const o = JSON.parse(raw);
      if (hash(o.d) !== o.s) { tampered = true; return DEFAULT(); }
      const d = JSON.parse(o.d), base = DEFAULT();
      return Object.assign(base, d, { up: Object.assign(base.up, d.up), owned: Object.assign({}, d.owned),
                                      iapGranted: Object.assign({}, d.iapGranted) });
    } catch (e) { return DEFAULT(); }
  }

  let S = load();
  function save() {
    try { const d = JSON.stringify(S); localStorage.setItem(KEY, JSON.stringify({ d, s: hash(d) })); } catch (e) {}
  }

  window.PState = { get: () => S, save, tampered: () => tampered };
})();
