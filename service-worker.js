
const CACHE_NAME = "equirep-inventario-v1";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.json"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ARCHIVOS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(nombres) {
      return Promise.all(
        nombres
          .filter(function(nombre) {
            return nombre.startsWith("equirep-inventario-") &&
                   nombre !== CACHE_NAME;
          })
          .map(function(nombre) {
            return caches.delete(nombre);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(function(respuesta) {
        if (respuesta && respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, copia);
          });
        }
        return respuesta;
      })
      .catch(function() {
        return caches.match(event.request).then(function(guardada) {
          return guardada || caches.match("./index.html");
        });
      })
  );
});
