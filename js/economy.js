// Soft-currency rules + purchase crediting. No UI in here.
window.PEcon = (function () {
  const S = () => PState.get();
  const CAT = PULSE_CATALOG;
  const t = (k, v) => PI18n.t(k, v);

  function skin(id) { return CAT.skins.find(s => s.id === id) || CAT.skins[0]; }
  function skinName(k) { return t('skin.' + k.id); }
  function currentSkin() { return skin(S().skin); }
  function skinHue(sk, time) {
    if (sk.anim === 'rainbow') return (time * 70) % 360;
    if (sk.anim === 'aurora') return 165 + 55 * Math.sin(time * 1.4);
    return sk.hue;
  }
  function runReward(base) {
    const s = S();
    return Math.round(base * (1 + 0.1 * s.up.boost) * (s.double ? 2 : 1));
  }
  function upCost(u) { const l = S().up[u.id]; return l >= u.max ? null : u.cost(l); }

  function buyUpgrade(id) {
    const u = CAT.upgrades.find(x => x.id === id), s = S(), c = upCost(u);
    if (c == null) return 'max';
    if (s.shards < c) return 'poor';
    s.shards -= c; s.up[id]++; PState.save(); return 'ok';
  }
  function buySkin(id) {
    const k = skin(id), s = S();
    if (s.owned[id]) return 'owned';
    if (k.iap) return 'iap';
    if (s.shards < k.price) return 'poor';
    s.shards -= k.price; s.owned[id] = 1; s.skin = id; PState.save(); return 'ok';
  }
  function equip(id) { const s = S(); if (s.owned[id]) { s.skin = id; PState.save(); } }

  // ---------- purchase crediting ----------
  // One-off goodies (shards) are tracked with a per-product COUNT, not transaction ids:
  // credit = (purchases the store reports) - (purchases already credited).
  // That makes it safe to re-run at every launch: a crash right after payment is
  // recovered on the next launch, and nothing is ever credited twice.
  const product = id => CAT.products.find(x => x.id === id);
  const hasBonus = p => p && (p.shards || p.id === 'starter_pack');

  function applyFlags(id) {
    const s = S();
    if (id === 'remove_ads') s.noAds = 1;
    if (id === 'double_shards') s.double = 1;
    if (id === 'skin_prism') s.owned.prism = 1;
    if (id === 'skin_aurora') s.owned.aurora = 1;
    if (id === 'starter_pack') { s.owned.nova = 1; s.starter = 1; }
  }
  // Gives the one-off contents of `times` purchases. Returns shards added.
  function giveBonus(p, times) {
    const s = S(); let added = 0;
    if (p.shards) { added = p.shards * times; }
    if (p.id === 'starter_pack') {
      times = Math.min(times, 1 - (s.iapGranted[p.id] || 0));   // non-consumable: once ever
      if (times > 0) { added = 3000; s.up.shield = Math.max(s.up.shield, 1); }
    }
    if (times <= 0) return 0;
    s.shards += added;
    s.iapGranted[p.id] = (s.iapGranted[p.id] || 0) + times;
    return added;
  }

  // Sync with what the store says this player owns (RevenueCat customerInfo).
  // Returns the number of shards recovered from purchases not yet credited.
  function reconcile(info) {
    if (!info) return 0;
    const s = S(); let recovered = 0;
    (info.allPurchasedProductIdentifiers || []).forEach(id => { if (product(id)) applyFlags(id); });
    const counts = {};
    (info.nonSubscriptionTransactions || []).forEach(tx => { counts[tx.productIdentifier] = (counts[tx.productIdentifier] || 0) + 1; });
    if ((info.allPurchasedProductIdentifiers || []).includes('starter_pack')) counts.starter_pack = Math.max(1, counts.starter_pack || 0);
    Object.keys(counts).forEach(id => {
      const p = product(id); if (!hasBonus(p)) return;
      const missing = counts[id] - (s.iapGranted[id] || 0);
      if (missing > 0) recovered += giveBonus(p, missing);
    });
    PState.save();
    return recovered;
  }

  // Right after the store confirms a purchase. `info` = customerInfo returned with it (may be null).
  function onPurchased(id, info) {
    const p = product(id); if (!p) return;
    const before = S().iapGranted[id] || 0;
    reconcile(info);
    applyFlags(id);
    // Store data can lag a few seconds behind the payment: credit once now; the count
    // check above makes sure the later sync doesn't add it again.
    if (hasBonus(p) && (S().iapGranted[id] || 0) === before) giveBonus(p, 1);
    PState.save();
  }

  function isOwned(p) {
    const s = S();
    return p.type === 'non' && (
      (p.id === 'remove_ads' && s.noAds) || (p.id === 'double_shards' && s.double) ||
      (p.id === 'skin_prism' && s.owned.prism) || (p.id === 'skin_aurora' && s.owned.aurora) ||
      (p.id === 'starter_pack' && s.starter));
  }

  // "What am I saving for?" — the nearest thing the player can afford next.
  function nextGoal() {
    const s = S(); let best = null;
    CAT.skins.forEach(k => { if (!k.iap && !s.owned[k.id]) cand(t('skinSuffix', { name: skinName(k) }), k.price); });
    CAT.upgrades.forEach(u => { const c = upCost(u); if (c != null) cand(t('up.' + u.id), c); });
    function cand(name, cost) { if (!best || cost < best.cost) best = { name, cost }; }
    return best ? { name: best.name, need: Math.max(0, best.cost - s.shards), cost: best.cost } : null;
  }

  return { skin, skinName, currentSkin, skinHue, runReward, upCost, buyUpgrade, buySkin, equip,
           reconcile, onPurchased, isOwned, nextGoal };
})();
