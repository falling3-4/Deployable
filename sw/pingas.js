const UV_CDN = "https://unpkg.com/@titaniumnetwork-dev/ultraviolet@3.2.8/dist/";
const SJ_CDN = "https://unpkg.com/@mercuryworkshop/scramjet@1.1.0/dist/";

importScripts(UV_CDN + "uv.bundle.js");
importScripts(UV_CDN + "uv.sw.js");
importScripts(SJ_CDN + "scramjet.all.js");

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
let sjInitialized = false;
let sj = null;
async function getSJ() {
  if (!sj) {
    const { ScramjetServiceWorker } = $scramjetLoadWorker();
    sj = new ScramjetServiceWorker();
  }
  // console.log(sj);
  return sj;
}
let sjReady = false;

async function sjRequest(event) {
  try {
    const s = await getSJ();
    if (!sjInitialized) {
      try {
        await s.loadConfig();
        sjInitialized = true;
      } catch (e) {e
        return new Response(
          `<p>trying to initialize scramjet...</p>`,
          { status: 200, headers: { "Content-Type": "text/html" } }
        );
      }
    }
    if (s.route(event)) {
      return await s.fetch(event);
    }
  } catch (e) {
    return new Response("scramjet eror: " + e.message, { status: 500 });
  }
  return await fetch(event.request);
}

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
  if (uv.route(event)) {
      event.respondWith(uv.fetch(event));
      return;
  }
  if (url.pathname.startsWith("/scramjet/")) {
    event.respondWith(sjRequest(event));
    return;
  }
  return;
});
