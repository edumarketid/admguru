const CACHE_NAME = 'aplikasi-guru-v1.37';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './js/app.js',
  './js/config.js',
  './js/state.js',
  './js/api.js',
  './js/scanner.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. Saat Service Worker dipasang (Install)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Membuka dan menyimpan cache aplikasi...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Saat Service Worker diaktifkan (Activate - Membersihkan cache lama)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clientsClaim();
});

// 3. Strategi Fetch (Cache First, fallback to Network untuk file statis)
self.addEventListener('fetch', (event) => {
  // Abaikan permintaan POST atau request ke Google Apps Script (karena butuh jaringan live)
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Cache file baru secara dinamis jika diperlukan
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
        // Fallback opsional jika offline total dan aset tidak ada di cache
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
