// Офлайн-кэш для PWA-версии
const CACHE = 'codelearn-v3-embedded';
const FILES = ['./', './index.html', './css/style.css', './data/content.js', './js/highlight.js',
  './js/store.js', './js/exercises.js', './js/app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys =>
  Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
