const CACHE_NAME = "ishop-tools-v8";
const ASSETS = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./datos/tradein.json",
  "./datos/precios_iphone.json",
  "./datos/applecare.json",
  "./datos/switchup_modelos.json",
  "./datos/financiamiento.json",
  "./datos/cobertura.json",
  "./datos/applecare_info.json",
  "./datos/escaner.json",
  "./datos/codigos_cajas.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Red primero: si hay internet, siempre trae la versión más nueva
  // (precios, modelos, etc.) y actualiza la copia guardada en el celular.
  // Si no hay internet, usa esa copia guardada como respaldo.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
