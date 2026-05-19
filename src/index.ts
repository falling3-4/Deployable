import "./styles.css";
import logo from "./logo.png";

const app = document.getElementById("app");
const base = new URL("./", location.href).pathname;
const PREFIX = base + "uv/service/";

async function init() {
  await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;

  const connection = new (window as any).BareMux.BareMuxConnection(
    base + "bare-mux-worker.js",
  );

  await connection.setTransport(
    "https://unpkg.com/@mercuryworkshop/libcurl-transport@1/dist/index.mjs",
    [
      {
        websocket: "wss://anura.pro/",
        wasm: "https://unpkg.com/libcurl.js/libcurl.wasm",
      },
    ],
  );
}

if (app) {
  app.innerHTML = `
    <img src="${logo}" alt="Logo" class="logo" />
    <h1>Welcome to Deployable!</h1>
    <iframe id="proxy-frame" style="width: 100vw; height: 50vh; border: none;"></iframe>
  `;
}

init()
  .then(() => {
    const frame = document.getElementById("proxy-frame") as HTMLIFrameElement;
    const targetUrl = "https://duckduckgo.com";
    const encodedUrl = (window as any).Ultraviolet.codec.xor.encode(targetUrl);
    frame.src = PREFIX + encodedUrl;
  })
  .catch(console.error);
