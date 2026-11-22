// Pulse offline cache. Bump VERSION on every deploy so players get the new files.
const VERSION = 'pulse-v1';
const FILES = ['./', 'index.html', 'manifest.json', 'css/style.css',
  'js/config.js','js/state.js','js/i18n.js','js/catalog.js','js/economy.js','js/audio.js',
  'js/analytics.js','js/monetization.js','js/ui.js','js/game.js','js/boot.js',
  'icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request)));
});
