// 神谕占卜台 - Service Worker
const CACHE_NAME = 'divination-v3.0';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/theme.js',
  './js/animation.js',
  './js/i-ching.js',
  './js/tarot.js',
  './js/ziwei.js',
  './js/ziwei-ui.js',
  './js/astrology.js',
  './js/bazi.js',
  './js/share.js',
  './js/ai-reader.js',
  './data/i-ching-64.json',
  './data/tarot-78.json',
  './data/ziwei-data.json',
  './data/astrology-data.json',
  './manifest.json'
];

// 安装：缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清除旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 请求策略：缓存优先，网络回退
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});
