const CACHE_NAME = "equirep-inventario-v2";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.json",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async function(cache) {
      for (const archivo of ARCHIVOS) {
        try {
          await cache.add(archivo);
        } catch (error) {
          console.warn("No se pudo guardar en caché:", archivo, error);
        }
      }
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
  const esFirebase = url.hostname === "www.gstatic.com" &&
                     url.pathname.startsWith("/firebasejs/");

  if (url.origin !== self.location.origin && !esFirebase) return;

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
          if (guardada) return guardada;

          if (url.origin === self.location.origin) {
            return caches.match("./index.html");
          }

          return Response.error();
        });
      })
  );
});
