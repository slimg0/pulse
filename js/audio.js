// Zero-asset sound: everything is synthesised, so the app stays tiny.
window.PAudio = (function () {
  let ctx = null;
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function tone(f, dur, type, vol, slide, delay) {
    if (!PState.get().sound) return;
    const c = ensure(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  const note = (base, i) => base * Math.pow(2, SCALE[Math.min(i, SCALE.length - 1)] / 12);

  return {
    unlock: ensure,
    hit(combo)     { tone(note(440, combo), 0.14, 'sine', 0.17); },
    perfect(combo) { const f = note(440, combo); tone(f, 0.16, 'triangle', 0.2); tone(f * 2, 0.22, 'sine', 0.09, 0, 0.05); },
    miss()         { tone(190, 0.38, 'sawtooth', 0.12, -130); },
    shield()       { tone(320, 0.2, 'square', 0.07, 220); },
    click()        { tone(720, 0.05, 'sine', 0.07); },
    fever()        { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.2, 'sine', 0.11, 0, i * 0.05)); },
    buy()          { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', 0.13, 0, i * 0.07)); },
    dodge()        { tone(523, 0.1, 'triangle', 0.1); tone(392, 0.16, 'sine', 0.08, 0, 0.06); },
    reward()       { [659, 880].forEach((f, i) => tone(f, 0.18, 'triangle', 0.13, 0, i * 0.08)); }
  };
})();
