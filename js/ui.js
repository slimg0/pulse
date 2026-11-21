// All screens and flows: menu, game over, shop, daily gift, tutorial, ads pacing, back button.
window.PUI = (function () {
  const $ = id => document.getElementById(id);
  const S = () => PState.get();
  const CAT = PULSE_CATALOG, C = PULSE_CONFIG;
  const t = (k, v) => PI18n.t(k, v), fmt = n => PI18n.num(n);
  const A = PAnalytics;
  const HOUR = 3600e3;
  let tab = 'skins', lastCommit = null, doubled = false, tutHideT;

  // ---------- helpers ----------
  function buzz(ms) {
    if (!S().haptics) return;
    try {
      const H = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics;
      if (H) { H.impact({ style: ms > 30 ? 'HEAVY' : ms > 12 ? 'MEDIUM' : 'LIGHT' }); return; }
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }
  let toastT;
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2400);
  }
  const show = id => $(id).classList.remove('hidden');
  const hide = id => $(id).classList.add('hidden');
  const visible = id => !$(id).classList.contains('hidden');
  function refreshWallet() {
    document.querySelectorAll('.shardCount').forEach(e => { e.textContent = fmt(S().shards); });
    $('menuBest').textContent = fmt(S().best);
    $('dailyDot').classList.toggle('hidden', !dailyReady());
    document.documentElement.style.setProperty('--h', Math.round(PEcon.skinHue(PEcon.currentSkin(), 0)));
  }

  // ---------- simulated ad (test mode only) ----------
  function mockAd(label, rewarded) {
    return new Promise(resolve => {
      const secs = rewarded ? 3 : 1.5;
      $('adLabel').textContent = label;
      $('adSkip').style.display = rewarded ? '' : 'none';
      const btn = $('adClose'), bar = $('adBar');
      btn.disabled = true; btn.textContent = t('wait');
      bar.style.transition = 'none'; bar.style.width = '0%'; show('adModal');
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = 'width ' + secs + 's linear'; bar.style.width = '100%'; }));
      const tm = setTimeout(() => { btn.disabled = false; btn.textContent = rewarded ? t('claim') : t('close'); }, secs * 1000);
      const done = v => { clearTimeout(tm); hide('adModal'); btn.onclick = null; $('adSkip').onclick = null; resolve(v); };
      btn.onclick = () => done(true);
      $('adSkip').onclick = () => done(false);
    });
  }

  // ---------- daily gift ----------
  // Ready after 20h; a clock set backwards never re-opens it.
  function dailyReady() { const s = S(), now = Date.now(); return now >= s.lastDaily && now - s.lastDaily >= 20 * HOUR; }
  function claimDaily() {
    const s = S(), now = Date.now();
    if (!dailyReady()) {
      const left = Math.max(1, Math.ceil((20 * HOUR - (now - s.lastDaily)) / HOUR));
      toast(t('tNextGift', { n: left })); return;
    }
    s.streak = (s.lastDaily && now - s.lastDaily > 48 * HOUR) ? 1 : s.streak + 1;
    const day = (s.streak - 1) % 7, amt = CAT.dailyRewards[day];
    s.shards += amt; s.lastDaily = now; PState.save();
    A.log('earn_virtual_currency', { virtual_currency_name: 'shards', value: amt, source: 'daily', streak: s.streak });
    PAudio.reward(); toast(t('tGift', { d: day + 1, n: fmt(amt) })); refreshWallet();
  }

  // ---------- ad pacing ----------
  async function maybeInterstitial() {
    const s = S(), c = C.interstitial, now = Date.now();
    if (s.noAds || s.runs <= c.freeRuns || s.sinceAd < c.everyNthGameOver || now - s.lastAd < c.minGapMs) return;
    A.log('ad_impression_popup');
    await PMoney.showInterstitial();
    s.sinceAd = 0; s.lastAd = Date.now(); PState.save();
  }
  async function watchRewarded(placement) {
    A.log('ad_reward_start', { placement });
    const ok = await PMoney.showRewarded();
    if (ok) { const s = S(); s.lastAd = Date.now(); PState.save(); A.log('ad_reward_earned', { placement }); }
    return ok;
  }

  // ---------- flows ----------
  async function play() {
    PAudio.click(); hide('menu'); hide('over'); hide('shop');
    await maybeInterstitial();
    doubled = false; lastCommit = null;
    const tutorial = !S().tutDone;
    show('hud'); PGame.start(tutorial);
    A.log('level_start', { level_name: 'endless', tutorial: tutorial ? 1 : 0 });
  }
  function toMenu() {
    PAudio.click(); hide('over'); hide('hud'); hide('shop'); show('menu'); PGame.setMode('menu'); refreshWallet();
    A.screen('menu');
  }

  // ---------- tutorial hint ----------
  function onTutorial(ev, g) {
    const box = $('tutHint'), done = 3 - g.tut;
    if (ev === 'red') {                       // explain the trap the first 2 times it appears
      const s = S(); if (s.redSeen >= 2) return;
      s.redSeen++; PState.save(); clearTimeout(tutHideT);
      box.classList.remove('good'); box.classList.add('danger');
      $('tutText').textContent = t('redHint'); $('tutStep').textContent = '';
      show('tutHint');
      tutHideT = setTimeout(() => { hide('tutHint'); box.classList.remove('danger'); }, 2600);
      return;
    }
    box.classList.remove('danger');
    clearTimeout(tutHideT);
    if (ev === 'start') { A.log('tutorial_begin'); }
    if (ev === 'done') {
      S().tutDone = 1; PState.save(); A.log('tutorial_complete');
      $('tutText').textContent = t('tutDone'); $('tutStep').textContent = '';
      show('tutHint'); box.classList.add('good');
      tutHideT = setTimeout(() => { hide('tutHint'); box.classList.remove('good'); }, 2800);
      return;
    }
    box.classList.remove('good');
    $('tutText').textContent = ev === 'early' ? t('tutEarly') : ev === 'late' ? t('tutLate') : t('tut1');
    $('tutStep').textContent = t('tutStep', { i: done, n: 3 });
    show('tutHint');
    if (ev === 'early' || ev === 'late') tutHideT = setTimeout(() => { $('tutText').textContent = t('tut1'); }, 1600);
  }

  // game.js loads after ui.js, so events are wired from bindUI() at boot.
  function bindGameEvents() {
    PGame.events.onScore = n => {
      const e = $('score'); e.textContent = n; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop');
    };
    PGame.events.onHud = g => {
      $('comboTxt').textContent = g.fever ? t('fever', { n: g.combo }) : (g.combo > 1 ? t('nPerfect', { n: g.combo }) : '');
      $('comboTxt').classList.toggle('fever', g.fever);
      $('shields').textContent = '◆'.repeat(g.shields);
    };
    PGame.events.onOver = onGameOver;
    PGame.events.onTutorial = onTutorial;
  }

  function onGameOver(r) {
    const s = S(), earned = PEcon.runReward(r.shards), prevBest = s.best, isBest = r.score > s.best;
    s.shards += earned; s.runs++; s.sinceAd++; s.perfects += r.perfects;
    if (isBest) s.best = r.score; PState.save();
    lastCommit = { earned, prevBest }; doubled = false;
    A.log('level_end', { level_name: 'endless', success: 0, score: r.score, run_number: s.runs, cause: r.cause, dodges: r.dodges });
    A.log('post_score', { score: r.score });
    A.log('earn_virtual_currency', { virtual_currency_name: 'shards', value: earned, source: 'run' });
    hide('hud'); hide('tutHint');
    $('overScore').textContent = r.score;
    $('overEarn').textContent = fmt(earned);
    const red = r.cause === 'red';   // say WHY the run ended when it was the trap
    $('overMsg').textContent = red ? t('redFail') : (isBest && r.score > 0 ? t('newBest') : t('gameOver'));
    $('overBest').textContent = isBest ? (red && r.score > 0 ? t('newBest') + ' · ' : '') + t('bestN', { n: fmt(s.best) })
                                       : t('awayFromBest', { d: fmt(s.best - r.score), b: fmt(s.best) });
    const g = PEcon.nextGoal();
    $('goal').textContent = g ? (g.need === 0 ? t('goalAfford', { name: g.name }) : t('goalNeed', { n: fmt(g.need), name: g.name })) : '';
    $('btnRevive').style.display = (!r.revived && r.score >= 4) ? '' : 'none';
    const d = $('btnDouble'); d.disabled = false; d.style.display = earned >= 3 ? '' : 'none';
    d.innerHTML = '▶ ' + t('doubleShards') + ' <small>+' + fmt(earned) + '</small>';
    show('over'); refreshWallet(); A.screen('game_over');
  }

  async function revive() {
    PAudio.click();
    if (!(await watchRewarded('continue'))) { toast(t('tWatchContinue')); return; }
    const s = S();
    if (lastCommit) { s.shards -= lastCommit.earned + (doubled ? lastCommit.earned : 0); s.runs--; s.sinceAd = Math.max(0, s.sinceAd - 1); s.best = lastCommit.prevBest; PState.save(); }
    hide('over'); show('hud'); PGame.revive(); refreshWallet();
  }
  async function doubleUp() {
    PAudio.click();
    if (!lastCommit || doubled) return;
    if (!(await watchRewarded('double'))) { toast(t('tWatchBonus')); return; }
    S().shards += lastCommit.earned; PState.save(); doubled = true;
    $('btnDouble').disabled = true; $('btnDouble').textContent = t('doubled');
    $('overEarn').textContent = fmt(lastCommit.earned * 2); PAudio.reward(); refreshWallet();
  }

  // ---------- shop ----------
  function openShop() { PAudio.click(); hide('menu'); hide('over'); show('shop'); renderShop(); A.log('shop_open', { tab }); A.screen('shop'); }
  function closeShop() { PAudio.click(); hide('shop'); if (PGame.state.mode === 'over' && lastCommit) show('over'); else show('menu'); refreshWallet(); }

  function skinOrb(k) {
    const cls = k.anim ? ' anim-' + k.anim : '';
    return '<span class="orb' + cls + '" style="--oh:' + k.hue + '"></span>';
  }
  function renderShop() {
    const s = S(), el = $('shopBody'); let h = '';
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.dataset.tab === tab));
    if (tab === 'skins') {
      h += '<div class="grid">';
      CAT.skins.forEach(k => {
        const own = s.owned[k.id], eq = s.skin === k.id;
        let label;
        if (eq) label = t('equipped'); else if (own) label = t('equip');
        else if (k.iap) { const p = CAT.products.find(x => x.id === k.iap); label = k.iap === 'starter_pack' ? t('starterPack') : PMoney.priceOf(p); }
        else label = '<i class="gem"></i>' + fmt(k.price);
        h += '<button class="card skin' + (eq ? ' eq' : '') + '" data-skin="' + k.id + '">' + skinOrb(k) +
             '<div class="nm">' + PEcon.skinName(k) + '</div><div class="pr">' + label + '</div></button>';
      });
      h += '</div>';
    } else if (tab === 'boosts') {
      CAT.upgrades.forEach(u => {
        const lv = s.up[u.id], c = PEcon.upCost(u), pips = Array.from({ length: u.max }, (_, i) => '<i class="pip' + (i < lv ? ' on' : '') + '"></i>').join('');
        h += '<div class="row2"><div class="info"><div class="nm">' + t('up.' + u.id) + ' <em>' + u.fmt(lv) + '</em></div><div class="ds">' + t('up.' + u.id + '.d') + '</div><div class="pips">' + pips + '</div></div>' +
             (c == null ? '<span class="maxed">' + t('max') + '</span>' : '<button class="btn buy' + (s.shards < c ? ' poor' : '') + '" data-up="' + u.id + '"><i class="gem"></i>' + fmt(c) + '</button>') + '</div>';
      });
      h += '<div class="hint">' + t('shortOnShards') + '</div>';
    } else {
      const cd = C.freeShardsAd.cooldownMs, left = Math.max(0, s.lastFree + cd - Date.now());
      h += '<div class="row2"><div class="info"><div class="nm">' + t('freeShards') + '</div><div class="ds">' + t('watchFor', { n: C.freeShardsAd.reward }) + '</div></div>' +
           '<button class="btn buy' + (left ? ' poor' : '') + '" data-free="1">' + (left ? t('min', { n: Math.ceil(left / 60000) }) : t('watch')) + '</button></div>';
      CAT.products.forEach(p => {
        if (p.id.startsWith('skin_')) return;
        const own = PEcon.isOwned(p), badge = p.badge === 'BEST VALUE' ? t('bestValue') : p.badge;
        h += '<div class="row2' + (p.badge ? ' hl' : '') + '"><div class="info"><div class="nm">' + t('p.' + p.id) + (badge ? ' <u>' + badge + '</u>' : '') + '</div>' +
             '<div class="ds">' + (p.shards ? t('nShards', { n: fmt(p.shards) }) : t('p.' + p.id + '.d')) + '</div></div>' +
             (own ? '<span class="maxed">' + t('owned') + '</span>' : '<button class="btn buy money" data-iap="' + p.id + '">' + PMoney.priceOf(p) + '</button>') + '</div>';
      });
      if (PMoney.simulated) h += '<div class="hint">' + t('testPurchases') + '</div>';
    }
    el.innerHTML = h;
  }

  async function purchase(id) {
    A.log('iap_attempt', { item_id: id });
    const r = await PMoney.buy(id);
    if (r.ok) { PEcon.onPurchased(id, r.info); PAudio.buy(); toast(t('tThanks')); A.log('iap_success', { item_id: id }); }
    else if (!r.cancelled) toast(t('tFailed'));
    else A.log('iap_cancel', { item_id: id });
    renderShop(); refreshWallet();
  }

  function onShopClick(e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.skin) {
      const id = b.dataset.skin, k = PEcon.skin(id);
      if (S().owned[id]) { PEcon.equip(id); PAudio.click(); }
      else if (k.iap) { if (k.iap === 'starter_pack') { tab = 'store'; } else { purchase(k.iap); return; } }
      else {
        const r = PEcon.buySkin(id);
        if (r === 'ok') { PAudio.buy(); toast(t('tUnlocked', { name: PEcon.skinName(k) })); A.log('spend_virtual_currency', { virtual_currency_name: 'shards', value: k.price, item_name: 'skin_' + id }); }
        else { PAudio.click(); tab = 'store'; toast(t('tNeed', { n: fmt(k.price - S().shards) })); }
      }
    } else if (b.dataset.up) {
      const u = CAT.upgrades.find(x => x.id === b.dataset.up), cost = PEcon.upCost(u), r = PEcon.buyUpgrade(u.id);
      if (r === 'ok') { PAudio.buy(); A.log('spend_virtual_currency', { virtual_currency_name: 'shards', value: cost, item_name: 'up_' + u.id }); }
      else { PAudio.click(); if (r === 'poor') toast(t('tPoor')); }
    } else if (b.dataset.free) {
      const s = S(); if (Date.now() < s.lastFree + C.freeShardsAd.cooldownMs) { toast(t('tFreeSoon')); return; }
      watchRewarded('free_shards').then(ok => {
        if (ok) { s.shards += C.freeShardsAd.reward; s.lastFree = Date.now(); PState.save(); PAudio.reward(); toast(t('tFree', { n: C.freeShardsAd.reward })); }
        renderShop(); refreshWallet();
      });
      return;
    } else if (b.dataset.iap) { purchase(b.dataset.iap); return; }
    renderShop(); refreshWallet();
  }

  // ---------- settings ----------
  function renderSettings() {
    const yn = v => t(v ? 'on' : 'off');
    $('setSound').textContent = t('sound', { v: yn(S().sound) });
    $('setHaptics').textContent = t('vibration', { v: yn(S().haptics) });
    $('setLang').textContent = t('language');
    $('setStats').textContent = t('stats', { v: yn(S().stats === 1) });
    $('setStats').style.display = A.available() ? '' : 'none';
    $('setPrivacy').style.display = PMoney.native ? '' : 'none';
    $('setPolicy').href = C.privacyUrl;
  }
  // Re-render everything that holds text after a language change.
  function relabel() {
    PI18n.apply(); renderSettings(); refreshWallet();
    if (visible('shop')) renderShop();
  }

  // ---------- analytics consent ----------
  function maybeAskConsent() {
    if (A.needsConsent()) show('consent');
  }

  // ---------- Android back button ----------
  // Registering a listener replaces Android's default (which closes the app), so
  // every screen is handled here; from the main menu we send the app to background.
  function onBack() {
    if (visible('adModal')) return;                       // never skip an ad with back
    if (visible('consent')) { A.setConsent(false); hide('consent'); return; }
    if (visible('settings')) { hide('settings'); return; }
    if (visible('shop')) { closeShop(); return; }
    if (visible('over')) { toMenu(); return; }
    if (PGame.state.mode === 'play') { PGame.quit(); return; }
    const App = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App;
    if (App && App.minimizeApp) App.minimizeApp();
  }

  function bindUI() {
    $('btnPlay').onclick = () => { PAudio.unlock(); play(); };
    $('btnAgain').onclick = () => { PAudio.unlock(); play(); };
    $('btnShop').onclick = openShop; $('btnShop2').onclick = openShop; $('shopClose').onclick = closeShop;
    $('btnHome').onclick = toMenu; $('btnDaily').onclick = () => { PAudio.unlock(); claimDaily(); };
    $('btnRevive').onclick = revive; $('btnDouble').onclick = doubleUp;
    $('shopBody').onclick = onShopClick;
    document.querySelectorAll('.tab').forEach(x => { x.onclick = () => { tab = x.dataset.tab; PAudio.click(); renderShop(); }; });
    $('btnSettings').onclick = () => { PAudio.click(); renderSettings(); show('settings'); };
    $('setClose').onclick = () => hide('settings');
    $('setSound').onclick = () => { S().sound = S().sound ? 0 : 1; PState.save(); renderSettings(); PAudio.click(); };
    $('setHaptics').onclick = () => { S().haptics = S().haptics ? 0 : 1; PState.save(); renderSettings(); buzz(20); };
    $('setLang').onclick = () => { PI18n.next(); relabel(); PAudio.click(); };
    $('setStats').onclick = async () => { await A.setConsent(S().stats !== 1); renderSettings(); PAudio.click(); };
    $('setRestore').onclick = async () => { const r = await PMoney.restorePurchases(); toast(t(r.ok ? 'tRestored' : 'tNothing')); refreshWallet(); };
    $('setPrivacy').onclick = () => PMoney.privacyOptions();
    $('consentYes').onclick = () => { A.setConsent(true); hide('consent'); };
    $('consentNo').onclick = () => { A.setConsent(false); hide('consent'); };
    const App = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App;
    if (App && App.addListener) { try { App.addListener('backButton', onBack); } catch (e) {} }
    bindGameEvents();
    PI18n.apply();
    refreshWallet();
  }

  return { buzz, toast, mockAd, bindUI, refreshWallet, maybeAskConsent, onBack };
})();
