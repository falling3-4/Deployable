import "./styles.css";
import logo from "./logo.png";

const app = document.getElementById("app");
const base = new URL("./", location.href).pathname;
const PREFIX = base + "uv/service/";

const DEFAULT_WISP = "wss://anura.pro/";
const WISP_STORAGE_KEY = "deployable.wispServer";

const getWispServer = () =>
  localStorage.getItem(WISP_STORAGE_KEY) || DEFAULT_WISP;
const setWispServer = (url: string) =>
  localStorage.setItem(WISP_STORAGE_KEY, url);

let currentUrl = "";
let history: string[] = [];
let index = -1;
let bareMuxConnection: any = null;

async function applyTransport(wispUrl: string) {
  if (!bareMuxConnection) return;
  await bareMuxConnection.setTransport(
    "https://unpkg.com/@mercuryworkshop/libcurl-transport@1/dist/index.mjs",
    [
      {
        websocket: wispUrl,
        wasm: "https://unpkg.com/libcurl.js/libcurl.wasm",
      },
    ],
  );
}

async function init() {
  await navigator.serviceWorker.register("pingas.js");
  await navigator.serviceWorker.ready;

  bareMuxConnection = new (window as any).BareMux.BareMuxConnection(
    base + "bare-mux-worker.js",
  );

  await applyTransport(getWispServer());
}

const startPageHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      font-family: "Nunito", sans-serif;
      background: #111;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .container {
      width: 90%;
      max-width: 680px;
      text-align: center;
    }
    .logo-container {
      margin-bottom: 24px;
    }
    .logo {
      width: 400px;
      max-width: 80%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    h1 {
      font-size: 34px;
      margin: 0 0 18px;
      font-weight: 600;
    }
    form {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    input {
      flex: 1;
      padding: 14px 16px;
      font-size: 16px;
      border: 1px solid #333;
      border-radius: 8px;
      background: #1a1a1a;
      color: #fff;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: #555;
    }
    button {
      padding: 14px 20px;
      font-size: 16px;
      border: 1px solid #333;
      border-radius: 8px;
      background: #1a1a1a;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #222;
    }
    button:active {
      background: #2a2a2a;
    }
    p {
      margin-top: 14px;
      font-size: 13px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${logo}" class="logo" alt="Logo" />
    </div>
    <h1>Search</h1>
    <form id="search-form">
      <input id="search-input" type="text" placeholder="Enter URL or search query" autocomplete="off" autofocus />
      <button type="submit">Go</button>
    </form>
    <p>Type a URL or a search query</p>
  </div>
  <script>
    const form = document.getElementById("search-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = document.getElementById("search-input").value.trim();
      if (!value) return;
      parent.postMessage({ type: "navigate", value }, "*");
    });
  </script>
</body>
</html>
`;

const homeDataURL =
  "data:text/html;charset=utf-8," + encodeURIComponent(startPageHTML);

if (app) {
  app.innerHTML = `
    <div id="topbar">
      <button id="back-btn" title="Back">&#8592;</button>
      <button id="forward-btn" title="Forward">&#8594;</button>
      <button id="home-btn" title="Home">&#8962;</button>
      <input id="url-bar" placeholder="Enter URL or search..." autocomplete="off" />
      <button id="go-btn">Go</button>
      <button id="settings-btn" title="Settings" aria-label="Settings">&#9881;</button>
    </div>
    <iframe id="proxy-frame"></iframe>
    <div id="settings-overlay" hidden>
      <div id="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <h2 id="settings-title">Settings</h2>
        <label for="wisp-input">Wisp server</label>
        <input id="wisp-input" type="text" spellcheck="false" autocomplete="off" placeholder="wss://example.com/" />
        <p class="settings-hint">WebSocket URL used for the proxy transport.</p>
        <div class="settings-actions">
          <button id="settings-reset" type="button">Reset</button>
          <div class="settings-actions-right">
            <button id="settings-cancel" type="button">Cancel</button>
            <button id="settings-save" type="button">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

const normalizeUrl = (u: string) => {
  try {
    return new URL(u).href;
  } catch {
    return u;
  }
};

function load(
  frame: HTMLIFrameElement,
  urlBar: HTMLInputElement,
  url: string,
  isHome: boolean = false,
  push: boolean = true,
) {
  if (push) {
    history = history.slice(0, index + 1);
    history.push(url);
    index++;
  }

  currentUrl = url;

  if (isHome) {
    urlBar.value = "";
    frame.src = homeDataURL;
  } else {
    urlBar.value = url;
    const encodedUrl = (window as any).Ultraviolet.codec.xor.encode(url);
    frame.src = PREFIX + encodedUrl;
  }
}

init()
  .then(() => {
    const frame = document.getElementById("proxy-frame") as HTMLIFrameElement;
    const urlBar = document.getElementById("url-bar") as HTMLInputElement;
    const goBtn = document.getElementById("go-btn") as HTMLButtonElement;
    const backBtn = document.getElementById("back-btn") as HTMLButtonElement;
    const forwardBtn = document.getElementById(
      "forward-btn",
    ) as HTMLButtonElement;
    const homeBtn = document.getElementById("home-btn") as HTMLButtonElement;

    frame.addEventListener("load", () => {
      try {
        const frameHref = frame.contentWindow?.location.href;

        if (frameHref && frameHref.includes(PREFIX)) {
          const encodedUrl = frameHref.substring(
            frameHref.indexOf(PREFIX) + PREFIX.length,
          );
          const decodedUrl = (window as any).Ultraviolet.codec.xor.decode(
            encodedUrl,
          );

          if (
            decodedUrl &&
            normalizeUrl(decodedUrl) !== normalizeUrl(currentUrl)
          ) {
            currentUrl = decodedUrl;
            urlBar.value = decodedUrl;

            history = history.slice(0, index + 1);
            history.push(decodedUrl);
            index++;
          }
        }
      } catch (err) {
        console.warn("Could not sync iframe URL:", err);
      }
    });

    function navigate(input: string) {
      input = input.trim();
      if (!input) return;

      const isUrl =
        /^https?:\/\//.test(input) ||
        (/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/.*)?$/.test(input) &&
          !input.includes(" "));

      let targetUrl: string;

      if (isUrl) {
        targetUrl = /^https?:\/\//.test(input) ? input : "https://" + input;
      } else {
        targetUrl = "https://duckduckgo.com/?q=" + encodeURIComponent(input);
      }

      load(frame, urlBar, targetUrl, false, true);
    }

    goBtn.onclick = () => navigate(urlBar.value);

    urlBar.addEventListener("keydown", (e) => {
      if (e.key === "Enter") navigate(urlBar.value);
    });

    backBtn.onclick = () => {
      if (index > 0) {
        index--;
        const target = history[index];
        load(frame, urlBar, target, target === homeDataURL, false);
      }
    };

    forwardBtn.onclick = () => {
      if (index < history.length - 1) {
        index++;
        const target = history[index];
        load(frame, urlBar, target, target === homeDataURL, false);
      }
    };

    homeBtn.onclick = () => {
      if (currentUrl !== homeDataURL) {
        load(frame, urlBar, homeDataURL, true, true);
      }
    };

    window.addEventListener("message", (event) => {
      if (event.data?.type !== "navigate") return;
      navigate(String(event.data.value || ""));
    });

    const settingsBtn = document.getElementById(
      "settings-btn",
    ) as HTMLButtonElement;
    const settingsOverlay = document.getElementById(
      "settings-overlay",
    ) as HTMLDivElement;
    const settingsModal = document.getElementById(
      "settings-modal",
    ) as HTMLDivElement;
    const wispInput = document.getElementById(
      "wisp-input",
    ) as HTMLInputElement;
    const settingsSave = document.getElementById(
      "settings-save",
    ) as HTMLButtonElement;
    const settingsCancel = document.getElementById(
      "settings-cancel",
    ) as HTMLButtonElement;
    const settingsReset = document.getElementById(
      "settings-reset",
    ) as HTMLButtonElement;

    const openSettings = () => {
      wispInput.value = getWispServer();
      settingsOverlay.hidden = false;
      wispInput.focus();
      wispInput.select();
    };

    const closeSettings = () => {
      settingsOverlay.hidden = true;
    };

    const saveSettings = async () => {
      const value = wispInput.value.trim();
      if (!value) return;
      try {
        const parsed = new URL(value);
        if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
          wispInput.focus();
          return;
        }
      } catch {
        wispInput.focus();
        return;
      }
      setWispServer(value);
      await applyTransport(value);
      closeSettings();
    };

    settingsBtn.onclick = openSettings;
    settingsCancel.onclick = closeSettings;
    settingsSave.onclick = saveSettings;
    settingsReset.onclick = () => {
      wispInput.value = DEFAULT_WISP;
      wispInput.focus();
    };

    settingsOverlay.addEventListener("click", (e) => {
      if (e.target === settingsOverlay) closeSettings();
    });

    settingsModal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSettings();
      if (e.key === "Enter" && document.activeElement === wispInput) {
        e.preventDefault();
        saveSettings();
      }
    });

    load(frame, urlBar, homeDataURL, true, true);
  })
  .catch(console.error);
