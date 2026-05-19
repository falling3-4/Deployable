const UV_CDN = "https://unpkg.com/@titaniumnetwork-dev/ultraviolet@3.2.8/dist/";

importScripts(UV_CDN + "uv.bundle.js");
importScripts(UV_CDN + "uv.sw.js");

const base = new URL("./", location.href).pathname;

self.__uv$config = {
  prefix: base + "uv/service/",
  // very placeholder, but needs to be in config so fuck it
  bare: "https://tomp.app/",
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: base + "uv.handler.js",
  client: base + "uv.client.js",
  bundle: base + "uv.bundle.js",
  config: base + "uv.config.js",
  sw: base + "uv.sw.js",
};

const uv = new UVServiceWorker();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // extremely fucked but uv wants bare mux so we fake it
  if (url.pathname === base + "bare-mux-worker.js") {
    event.respondWith(
      fetch("https://unpkg.com/@mercuryworkshop/bare-mux@2.1.9/dist/worker.js")
        .then((response) => response.text())
        .then(
          (text) =>
            new Response(text, {
              headers: { "Content-Type": "application/javascript" },
            }),
        ),
    );
    return;
  }

  if (url.pathname === base + "uv.config.js") {
    const configCode = `
        self.__uv$config = {
            prefix: '${base}uv/service/',
            bare: 'https://tomp.app/',
            encodeUrl: Ultraviolet.codec.xor.encode,
            decodeUrl: Ultraviolet.codec.xor.decode,
            handler: '${base}uv.handler.js',
            client: '${base}uv.client.js',
            bundle: '${base}uv.bundle.js',
            config: '${base}uv.config.js',
            sw: '${base}uv.sw.js',
        };`;

    event.respondWith(
      new Response(configCode, {
        headers: { "Content-Type": "application/javascript" },
      }),
    );
    return;
  }

  // when it tries to get the other files we fetch from cdn
  if (
    [
      base + "uv.handler.js",
      base + "uv.client.js",
      base + "uv.bundle.js",
    ].includes(url.pathname)
  ) {
    const relativePath = url.pathname.slice(base.length);
    event.respondWith(
      fetch(UV_CDN + relativePath)
        .then((response) => response.text())
        .then(
          (text) =>
            new Response(text, {
              headers: { "Content-Type": "application/javascript" },
            }),
        ),
    );
    return;
  }

  event.respondWith(
    (async () => {
      if (uv.route(event)) {
        return await uv.fetch(event);
      }
      return await fetch(event.request);
    })(),
  );
});
