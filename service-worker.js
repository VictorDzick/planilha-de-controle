const CACHE_NAME = 'app-cache-v4'; // MUDE SEMPRE O NÚMERO

self.addEventListener('install', event => {
  self.skipWaiting(); // força instalar o novo
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => caches.delete(key)) // apaga TODOS os caches antigos
      )
    )
  );
  self.clients.claim(); // assume controle imediato
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(() => caches.match(event.request))
  );
});
