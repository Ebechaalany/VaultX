const CACHE_NAME = 'vaultx-cache-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './db.js',
  './charts.js',
  './app.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=> cache.addAll(ASSETS)).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then(keys=> Promise.all(keys.filter(k=> k!==CACHE_NAME).map(k=> caches.delete(k))))
    .then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', (event)=>{
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached) return cached;
      return fetch(event.request).then(res=>{
        // cache same-origin assets as we go; leave cross-origin (fonts CDN) to the browser cache
        if(event.request.url.startsWith(self.location.origin)){
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache=> cache.put(event.request, clone));
        }
        return res;
      }).catch(()=> cached);
    })
  );
});
