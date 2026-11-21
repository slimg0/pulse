// Pulse core: one orb circles a ring. Tap when it's inside the glowing arc.
// Perfect taps build combos -> Fever (bonus shards). One miss ends the run.
window.PGame = (function () {
  const TAU = Math.PI * 2;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 0;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = H * 0.44; R = Math.min(W * 0.36, H * 0.26);
  }
  window.addEventListener('resize', resize); resize();

  const angDiff = (a, b) => ((a - b + Math.PI) % TAU + TAU) % TAU - Math.PI;
  const wrap = a => ((a % TAU) + TAU) % TAU;

  const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, p: Math.random() * 6, v: Math.random() * 0.012 + 0.003 }));
  let parts = [], ripples = [], floats = [], trail = [];

  const g = {
    mode: 'menu', t: 0, angle: -Math.PI / 2, dir: 1, speed: 1.1, ta: 0, tw: 0.3,
    score: 0, combo: 0, fever: false, runShards: 0, perfects: 0, shields: 0,
    revived: false, inside: false, grace: 0, lock: 0, shake: 0, flash: 0, pulse: 0, ringBeat: 0,
    tut: 0,   // > 0 = guided first run: hits left before normal rules apply
    red: false, redStreak: 0, dodges: 0   // red zone = trap: let the orb pass, don't tap
  };
  const TUT_HITS = 3;
  const t = (k, v) => PI18n.t(k, v);

  const events = { onScore() {}, onHud() {}, onOver() {}, onTutorial() {} };

  function targetHalf() {
    const wide = 1 + 0.04 * PState.get().up.wide;
    return Math.max(0.15, 0.34 - g.score * 0.0028) * wide * (g.tut > 0 ? 1.35 : 1);
  }
  // Red traps start after a few points, get a bit more frequent, never 3 in a row.
  function rollRed() {
    if (g.tut > 0 || g.score < 8 || g.redStreak >= 2) return false;
    return Math.random() < Math.min(0.28, 0.12 + g.score * 0.003);
  }
  function placeTarget(noRed) {
    g.ta = wrap(g.angle + g.dir * (1.5 + Math.random() * 2.6));
    g.red = !noRed && rollRed();
    g.redStreak = g.red ? g.redStreak + 1 : 0;
    g.tw = targetHalf() * (g.red ? 1.15 : 1); g.inside = false;
    if (g.red) events.onTutorial('red', g);
  }

  function start(tutorial) {
    g.tut = tutorial ? TUT_HITS : 0;
    g.mode = 'play'; g.angle = -Math.PI / 2; g.dir = 1; g.speed = tutorial ? 1.5 : 2.3;
    g.score = 0; g.combo = 0; g.fever = false; g.runShards = 0; g.perfects = 0;
    g.shields = PState.get().up.shield; g.revived = false;
    g.red = false; g.redStreak = 0; g.dodges = 0;
    g.grace = 0.7; g.lock = 0; trail = [];
    g.ta = wrap(g.angle + 2.4); g.tw = targetHalf(); g.inside = false;
    events.onHud(g); events.onScore(0, false);
    if (g.tut) events.onTutorial('start', g);
  }

  function revive() {
    g.mode = 'play'; g.revived = true; g.grace = 1.1; g.combo = 0; g.fever = false;
    placeTarget(true); events.onHud(g);
  }

  function pos(a, r) { return [cx + Math.cos(a) * (r || R), cy + Math.sin(a) * (r || R)]; }
  function burst(a, n, hue, sp) {
    const [x, y] = pos(a);
    for (let i = 0; i < n; i++) {
      const an = Math.random() * TAU, v = (Math.random() * 0.8 + 0.2) * (sp || 160);
      parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, life: 0, max: 0.5 + Math.random() * 0.4, s: Math.random() * 2.4 + 1, h: hue + (Math.random() * 40 - 20) });
    }
  }

  function tap() {
    if (g.mode !== 'play' || g.grace > 0 || g.lock > 0) return;
    const d = Math.abs(angDiff(g.angle, g.ta));
    if (d <= g.tw) { if (g.red) fail('red'); else hit(d); }
    else fail('tap');
  }

  // The orb crossed a red zone untouched: reward the restraint (combo is kept).
  function dodge() {
    const hue = 140;
    g.score += 1; g.runShards += 1; g.dodges++;
    g.speed = Math.min(5.4, g.speed + 0.05);
    const [x, y] = pos(g.angle);
    ripples.push({ x, y, r: 6, a: 0.7, h: hue });
    floats.push({ x, y: y - 18, t: t('dodged'), life: 0, h: hue, big: true });
    g.pulse = 0.6; PAudio.dodge(); PUI.buzz(10);
    placeTarget();
    events.onScore(g.score, false); events.onHud(g);
  }

  function hit(d) {
    const perfect = d <= g.tw * 0.32, hue = hueNow();
    const wasFever = g.fever;
    if (perfect) { g.combo++; g.perfects++; g.score += 2; } else { g.combo = 0; g.score += 1; }
    g.fever = g.combo >= 5;
    g.runShards += 1 + (perfect ? 1 : 0) + (g.fever ? 1 : 0);
    if (g.tut > 0) {
      g.tut--;
      if (g.tut === 0) { g.speed = 2.3; events.onTutorial('done', g); } else events.onTutorial('step', g);
    } else {
      g.speed = Math.min(5.4, g.speed + 0.05);
      if (g.score > 6 && Math.random() < 0.4) g.dir *= -1;
    }
    burst(g.angle, perfect ? 22 : 10, hue, perfect ? 220 : 140);
    const [x, y] = pos(g.angle);
    ripples.push({ x, y, r: 6, a: 0.8, h: hue });
    floats.push({ x, y: y - 18, t: perfect ? (g.fever ? t('fever', { n: g.combo }) : t('perfect')) : '+1', life: 0, h: hue, big: perfect });
    g.pulse = 1; g.ringBeat = 1;
    PAudio[perfect ? 'perfect' : 'hit'](g.combo);
    if (g.fever && !wasFever) PAudio.fever();
    PUI.buzz(perfect ? 18 : 8);
    placeTarget();
    events.onScore(g.score, perfect); events.onHud(g);
  }

  function fail(kind) {
    if (g.tut > 0) {          // guided run: explain instead of ending it
      g.lock = 0.35; g.shake = 4; PAudio.shield(); PUI.buzz(15);
      const [x, y] = pos(g.angle);
      floats.push({ x, y: y - 18, t: '✕', life: 0, h: 0, big: true });
      events.onTutorial(kind === 'late' ? 'late' : 'early', g); return;
    }
    if (g.shields > 0) {
      g.shields--; g.lock = 0.3; g.combo = 0; g.fever = false; g.shake = 6; g.flash = 0.25;
      burst(g.angle, 14, 200, 120); PAudio.shield(); PUI.buzz(30);
      if (kind === 'late' || kind === 'red') placeTarget(true);
      events.onHud(g); return;
    }
    die(kind);
  }

  function die(cause) {
    g.mode = 'over'; g.shake = 16; g.flash = 0.5; g.fever = false;
    burst(g.angle, 34, 350, 260); PAudio.miss(); PUI.buzz(70);
    events.onHud(g);
    setTimeout(() => events.onOver({ score: g.score, shards: g.runShards, perfects: g.perfects, revived: g.revived,
                                      dodges: g.dodges, cause: cause || 'quit' }), 520);
  }

  const hueNow = () => PEcon.skinHue(PEcon.currentSkin(), g.t);

  // ---------- update ----------
  function update(dt) {
    g.t += dt; g.shake *= Math.pow(0.001, dt); g.flash = Math.max(0, g.flash - dt);
    g.pulse = Math.max(0, g.pulse - dt * 4); g.ringBeat = Math.max(0, g.ringBeat - dt * 3);
    if (g.lock > 0) g.lock -= dt;

    if (g.mode === 'menu' || g.mode === 'over') {
      g.angle = wrap(g.angle + (g.mode === 'menu' ? 0.9 : 0.15) * dt);
    } else if (g.mode === 'play') {
      if (g.grace > 0) g.grace -= dt;
      else {
        g.angle = wrap(g.angle + g.dir * g.speed * dt);
        const inNow = Math.abs(angDiff(g.angle, g.ta)) <= g.tw;
        if (g.inside && !inNow) { g.inside = false; if (g.red) dodge(); else fail('late'); }   // left the arc
        else g.inside = inNow;
      }
    }
    trail.push(g.angle); if (trail.length > 26) trail.shift();

    parts.forEach(p => { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; });
    parts = parts.filter(p => p.life < p.max);
    ripples.forEach(r => { r.r += 260 * dt; r.a -= dt * 1.6; }); ripples = ripples.filter(r => r.a > 0);
    floats.forEach(f => { f.life += dt; f.y -= 40 * dt; }); floats = floats.filter(f => f.life < 0.8);
  }

  // ---------- draw ----------
  function draw() {
    const hue = hueNow();
    ctx.save();
    if (g.shake > 0.3) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);

    const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, H) * 0.85);
    bg.addColorStop(0, `hsl(${hue},50%,${g.fever ? 17 : 12}%)`); bg.addColorStop(1, '#04050d');
    ctx.fillStyle = bg; ctx.fillRect(-20, -20, W + 40, H + 40);

    for (const s of stars) {
      s.y = (s.y + s.v * 0.016) % 1;
      ctx.globalAlpha = 0.25 + 0.35 * Math.sin(g.t * 1.5 + s.p) ** 2;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ring
    ctx.lineCap = 'round';
    ctx.lineWidth = 16 + g.ringBeat * 5; ctx.strokeStyle = `hsla(${hue},70%,70%,${0.11 + g.ringBeat * 0.12})`;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = `hsla(${hue},70%,80%,0.10)`;
    ctx.beginPath(); ctx.arc(cx, cy, R - 30, 0, TAU); ctx.stroke();
    if (g.fever) {
      ctx.lineWidth = 3; ctx.strokeStyle = `hsla(${hue + 40},100%,70%,${0.4 + 0.3 * Math.sin(g.t * 9)})`;
      ctx.beginPath(); ctx.arc(cx, cy, R + 26, 0, TAU); ctx.stroke();
    }

    // red trap: dashed, blinking, no white center, ✕ marker (readable for colour-blind players too)
    if (g.mode === 'play' && g.red) {
      const bl = 0.6 + 0.4 * Math.sin(g.t * 14);
      ctx.save(); ctx.shadowColor = 'hsl(355,100%,55%)'; ctx.shadowBlur = 26;
      ctx.lineWidth = 16; ctx.setLineDash([10, 7]); ctx.lineCap = 'butt';
      ctx.strokeStyle = `hsla(355,95%,${g.inside ? 66 : 56}%,${0.55 + 0.4 * bl})`;
      ctx.beginPath(); ctx.arc(cx, cy, R, g.ta - g.tw, g.ta + g.tw); ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;
      const [mx, my] = pos(g.ta, R + 34), k = 8;
      ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = `hsla(355,100%,70%,${0.5 + 0.5 * bl})`;
      ctx.beginPath(); ctx.moveTo(mx - k, my - k); ctx.lineTo(mx + k, my + k); ctx.moveTo(mx + k, my - k); ctx.lineTo(mx - k, my + k); ctx.stroke();
      ctx.restore();
    }
    // target arc
    if (g.mode === 'play' && !g.red) {
      const pl = 0.75 + 0.25 * Math.sin(g.t * 7);
      ctx.save(); ctx.shadowColor = `hsl(${hue},100%,65%)`; ctx.shadowBlur = 22;
      ctx.lineWidth = 16; ctx.strokeStyle = `hsla(${hue},90%,${g.inside ? 85 : 72}%,${0.55 + 0.35 * pl})`;
      ctx.beginPath(); ctx.arc(cx, cy, R, g.ta - g.tw, g.ta + g.tw); ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = 16; ctx.strokeStyle = `rgba(255,255,255,${0.55 + 0.4 * pl})`;
      ctx.beginPath(); ctx.arc(cx, cy, R, g.ta - g.tw * 0.32, g.ta + g.tw * 0.32); ctx.stroke();
      ctx.restore();
    }

    // trail + orb
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < trail.length; i++) {
      const k = i / trail.length, [x, y] = pos(trail[i]);
      ctx.fillStyle = `hsla(${hue + (1 - k) * 25},100%,60%,${k * 0.45})`;
      ctx.beginPath(); ctx.arc(x, y, 3 + k * 9, 0, TAU); ctx.fill();
    }
    const [ox, oy] = pos(g.angle), os = 13 + g.pulse * 5;
    const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, os * 3.4);
    glow.addColorStop(0, `hsla(${hue},100%,70%,0.85)`); glow.addColorStop(1, `hsla(${hue},100%,60%,0)`);
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ox, oy, os * 3.4, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    if (g.mode !== 'over' || g.shake < 5) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox, oy, os * 0.62, 0, TAU); ctx.fill();
    }

    // effects
    ripples.forEach(r => { ctx.strokeStyle = `hsla(${r.h},100%,75%,${Math.max(0, r.a)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke(); });
    ctx.globalCompositeOperation = 'lighter';
    parts.forEach(p => { const k = 1 - p.life / p.max; ctx.fillStyle = `hsla(${p.h},100%,65%,${k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (0.4 + k), 0, TAU); ctx.fill(); });
    ctx.globalCompositeOperation = 'source-over';
    floats.forEach(f => {
      const a = 1 - f.life / 0.8; ctx.globalAlpha = a; ctx.fillStyle = `hsl(${f.h},100%,82%)`;
      ctx.font = `800 ${f.big ? 20 : 15}px ui-rounded, system-ui, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(f.t, f.x, f.y); ctx.globalAlpha = 1;
    });

    if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash * 0.35})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
    ctx.restore();
  }

  // ---------- loop & input ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw(); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  cv.addEventListener('pointerdown', e => { e.preventDefault(); PAudio.unlock(); tap(); });
  window.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); tap(); } });
  document.addEventListener('visibilitychange', () => { last = performance.now(); if (g.mode === 'play') g.grace = Math.max(g.grace, 1.2); });

  // Android back button during a run: end it normally (shards are kept).
  function quit() { if (g.mode === 'play') { g.tut = 0; g.shields = 0; die(); } }

  return { start, revive, quit, state: g, events, setMode(m) { g.mode = m; } };
})();
