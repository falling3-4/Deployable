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

interface Tab {
  id: string;
  url: string;
  history: string[];
  historyIndex: number;
  frame: HTMLIFrameElement;
  tabElement: HTMLElement;
}

let tabs: Tab[] = [];
let activeTab: Tab | null = null;
let bareMuxConnection: any = null;

await (window as any).Lumin.init({ headless: true });

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
    .discord-link {
      margin-top: 20px;
      font-size: 14px;
      color: #888;
    }
    .discord-link a {
      color: #5865F2;
      text-decoration: none;
      font-weight: 600;
    }
    .discord-link a:hover {
      text-decoration: underline;
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
    <p class="discord-link">Feedback? <a href="https://discord.gg/VWh8UmD2gv" target="_blank" rel="noopener noreferrer">Join our Discord!</a></p>
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

const normalizeUrl = (u: string) => {
  try {
    return new URL(u).href;
  } catch {
    return u;
  }
};

if (app) {
  app.innerHTML = `
    <div id="main-nav">
      <div class="nav-center">
        <button id="nav-web" class="nav-item active">Web</button>
        <button id="nav-games" class="nav-item">Games</button>
      </div>
      <div class="nav-right">
        <button id="settings-btn" title="Settings">&#9881;</button>
      </div>
    </div>
    <div id="view-stack">
      <div id="web-view" class="view-container">
        <div id="tab-bar">
          <button id="new-tab-btn" title="New Tab">+</button>
        </div>
        <div id="topbar">
          <button id="back-btn" title="Back">&#8592;</button>
          <button id="forward-btn" title="Forward">&#8594;</button>
          <button id="home-btn" title="Home">&#8962;</button>
          <input id="url-bar" placeholder="Enter URL or search..." autocomplete="off" />
          <button id="go-btn">Go</button>
        </div>
        <div id="frames-container"></div>
      </div>
      <div id="games-view" class="view-container" style="display: none;">
        <div class="games-header">
          <h1>Games</h1>
          <div class="games-search-container">
            <input id="games-search" type="text" placeholder="Search games..." autocomplete="off" />
          </div>
        </div>
        <div id="games-categories" class="categories-bar"></div>
        <div id="games-grid" class="games-grid"></div>
        <div id="games-loader" class="loader">Loading...</div>
        <div id="games-pagination" class="pagination-bar">
          <button id="prev-page" class="page-btn">Previous</button>
          <span id="page-info">Page 1</span>
          <button id="next-page" class="page-btn">Next</button>
        </div>
      </div>
    </div>
    <div id="settings-overlay" style="display: none;">
      <div id="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <h2 id="settings-title">Settings</h2>
        
        <div class="settings-section">
          <label for="wisp-input">Wisp server</label>
          <input id="wisp-input" type="text" spellcheck="false" autocomplete="off" placeholder="wss://example.com/" />
          <p class="settings-hint">WebSocket URL used for the proxy transport.</p>
        </div>

        <div class="settings-section">
          <label>Data Management</label>
          <div class="data-actions">
            <button id="export-data" type="button">Export Data</button>
            <button id="import-data" type="button">Import Data</button>
            <input type="file" id="import-input" accept=".json" style="display: none;" />
          </div>
          <p class="settings-hint">Backup or restore your settings and site data.</p>
        </div>

        <div class="settings-actions">
          <button id="settings-reset" type="button">Reset</button>
          <div class="settings-actions-right">
            <button id="settings-cancel" type="button">Cancel</button>
            <button id="settings-save" type="button" class="primary-btn">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

const webView = document.getElementById("web-view") as HTMLDivElement;
const gamesView = document.getElementById("games-view") as HTMLDivElement;
const navWeb = document.getElementById("nav-web") as HTMLButtonElement;
const navGames = document.getElementById("nav-games") as HTMLButtonElement;
const framesContainer = document.getElementById(
  "frames-container",
) as HTMLDivElement;
const tabBar = document.getElementById("tab-bar") as HTMLDivElement;
const urlBar = document.getElementById("url-bar") as HTMLInputElement;
const newTabBtn = document.getElementById("new-tab-btn") as HTMLButtonElement;

const gamesSearch = document.getElementById("games-search") as HTMLInputElement;
const gamesGrid = document.getElementById("games-grid") as HTMLDivElement;
const gamesCategories = document.getElementById(
  "games-categories",
) as HTMLDivElement;
const gamesLoader = document.getElementById("games-loader") as HTMLDivElement;
const pageInfo = document.getElementById("page-info") as HTMLSpanElement;
const prevPageBtn = document.getElementById("prev-page") as HTMLButtonElement;
const nextPageBtn = document.getElementById("next-page") as HTMLButtonElement;

const settingsOverlay = document.getElementById(
  "settings-overlay",
) as HTMLDivElement;

function switchView(view: "web" | "games") {
  if (view === "web") {
    webView.style.display = "flex";
    gamesView.style.display = "none";
    navWeb.classList.add("active");
    navGames.classList.remove("active");
  } else {
    webView.style.display = "none";
    gamesView.style.display = "flex";
    navWeb.classList.remove("active");
    navGames.classList.add("active");
    loadGames(gamesSearch.value, selectedCategory, currentPage);
  }
}

navWeb.onclick = () => switchView("web");
navGames.onclick = () => switchView("games");

function createTab(url: string = homeDataURL) {
  const id = Math.random().toString(36).substring(2, 11);
  const frame = document.createElement("iframe");
  frame.className = "proxy-frame";
  frame.id = `frame-${id}`;
  framesContainer.appendChild(frame);

  const tabElement = document.createElement("div");
  tabElement.className = "tab";
  tabElement.id = `tab-${id}`;
  tabElement.innerHTML = `
    <img class="tab-favicon" src="${logo}" alt="" />
    <span class="tab-title">New Tab</span>
    <span class="tab-close" title="Close Tab">&times;</span>
  `;

  tabBar.insertBefore(tabElement, newTabBtn);

  const tab: Tab = {
    id,
    url: "",
    history: [],
    historyIndex: -1,
    frame,
    tabElement,
  };

  tabs.push(tab);

  tabElement.onclick = (e) => {
    if ((e.target as HTMLElement).classList.contains("tab-close")) {
      closeTab(id);
    } else {
      switchTab(id);
    }
  };

  const syncMetadata = () => {
    try {
      const win = frame.contentWindow as any;
      if (!win) return;
      const doc = win.document;
      if (!doc) return;
      const title = doc.title;
      const favicon = doc.querySelector("link[rel*='icon']")?.href;
      updateTabMetadata(tab, title, favicon);
    } catch (err) {}
  };

  frame.addEventListener("load", () => {
    syncMetadata();
    try {
      const frameHref = frame.contentWindow?.location.href;
      if (frameHref && frameHref.includes(PREFIX)) {
        const encodedUrl = frameHref.substring(
          frameHref.indexOf(PREFIX) + PREFIX.length,
        );
        const decodedUrl = (window as any).Ultraviolet.codec.xor.decode(
          encodedUrl,
        );
        if (decodedUrl && normalizeUrl(decodedUrl) !== normalizeUrl(tab.url)) {
          tab.url = decodedUrl;
          if (activeTab === tab) urlBar.value = decodedUrl;
          tab.history = tab.history.slice(0, tab.historyIndex + 1);
          tab.history.push(decodedUrl);
          tab.historyIndex++;
        }
      }
    } catch (err) {}
  });

  const metadataInterval = setInterval(() => {
    if (tabs.includes(tab)) syncMetadata();
    else clearInterval(metadataInterval);
  }, 1000);

  loadTab(tab, url, url === homeDataURL);
  switchTab(id);
  return tab;
}

function updateTabMetadata(tab: Tab, title?: string, favicon?: string) {
  const titleEl = tab.tabElement.querySelector(".tab-title");
  const faviconEl = tab.tabElement.querySelector(
    ".tab-favicon",
  ) as HTMLImageElement;
  if (titleEl)
    titleEl.textContent = tab.url === homeDataURL || !title ? "Home" : title;
  if (faviconEl)
    faviconEl.src = tab.url === homeDataURL || !favicon ? logo : favicon;
}

function switchTab(id: string) {
  const tab = tabs.find((t) => t.id === id);
  if (!tab) return;
  activeTab = tab;
  document
    .querySelectorAll(".tab")
    .forEach((el) => el.classList.remove("active"));
  tab.tabElement.classList.add("active");
  document
    .querySelectorAll(".proxy-frame")
    .forEach((el) => el.classList.remove("active"));
  tab.frame.classList.add("active");
  urlBar.value = tab.url === homeDataURL ? "" : tab.url;
}

function closeTab(id: string) {
  const index = tabs.findIndex((t) => t.id === id);
  if (index === -1) return;
  const tab = tabs[index];
  tab.frame.remove();
  tab.tabElement.remove();
  tabs.splice(index, 1);
  if (tabs.length === 0) createTab();
  else if (activeTab === tab) {
    const nextTab = tabs[index] || tabs[index - 1];
    switchTab(nextTab.id);
  }
}

function loadTab(
  tab: Tab,
  url: string,
  isHome: boolean = false,
  push: boolean = true,
) {
  if (push) {
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(url);
    tab.historyIndex++;
  }
  tab.url = url;
  if (isHome) {
    if (activeTab === tab) urlBar.value = "";
    tab.frame.src = homeDataURL;
  } else {
    if (activeTab === tab) urlBar.value = url;
    const encodedUrl = (window as any).Ultraviolet.codec.xor.encode(url);
    tab.frame.src = PREFIX + encodedUrl;
  }
  updateTabMetadata(tab, isHome ? "Home" : url);
}

let selectedCategory = "";
let currentPage = 1;
let totalPages = 1;

async function renderCategories(categories: string[]) {
  gamesCategories.innerHTML = `
    <button class="category-btn ${selectedCategory === "" ? "active" : ""}" data-category="">All</button>
    ${categories.map((cat) => `<button class="category-btn ${selectedCategory === cat ? "active" : ""}" data-category="${cat}">${cat}</button>`).join("")}
  `;
  gamesCategories.querySelectorAll(".category-btn").forEach((btn) => {
    (btn as HTMLElement).onclick = () => {
      selectedCategory = (btn as HTMLButtonElement).dataset.category || "";
      currentPage = 1;
      loadGames(gamesSearch.value, selectedCategory, currentPage);
    };
  });
}

async function loadGames(query = "", category = "", page = 1) {
  gamesLoader.style.display = "block";
  gamesGrid.innerHTML = "";

  try {
    const opts: any = {
      page: page,
      limit: 30,
    };

    if (query.trim()) opts.q = query.trim();
    if (category) opts.category = category;

    const { games, pages } = await (window as any).Lumin.getGames(opts);

    totalPages = pages || 1;
    currentPage = page;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    const { categories } = await (window as any).Lumin.getCategories();
    renderCategories(categories);

    const images = await Promise.all(
      games.map((g: any) => (window as any).Lumin.getImageUrl(g.image_token)),
    );

    gamesGrid.innerHTML = games
      .map(
        (game: any, i: number) => `
      <div class="game-card" data-id="${game.id}">
        <div class="game-img-container">
          <img src="${images[i]}" alt="${game.name}" loading="lazy" />
        </div>
        <div class="game-info">
          <span class="game-name">${game.name}</span>
          <span class="game-category">${game.category || ""}</span>
        </div>
      </div>
    `,
      )
      .join("");

    gamesGrid.querySelectorAll(".game-card").forEach((card) => {
      (card as HTMLElement).onclick = () => {
        const id = (card as HTMLElement).dataset.id;
        if (id) (window as any).Lumin.loadGame(id);
      };
    });
  } catch (err) {
    gamesGrid.innerHTML = `<div class="error">No games found or failed to load.</div>`;
    totalPages = 1;
    currentPage = 1;
    pageInfo.textContent = `Page 1 of 1`;
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
  } finally {
    gamesLoader.style.display = "none";
  }
}

prevPageBtn.onclick = () => {
  if (currentPage > 1)
    loadGames(gamesSearch.value, selectedCategory, currentPage - 1);
};

nextPageBtn.onclick = () => {
  if (currentPage < totalPages)
    loadGames(gamesSearch.value, selectedCategory, currentPage + 1);
};

let searchTimeout: any;
gamesSearch.oninput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage = 1;
    loadGames(gamesSearch.value, selectedCategory, currentPage);
  }, 400);
};

function exportData() {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) data[key] = localStorage.getItem(key) || "";
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `deployable-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (
        confirm("This will overwrite your current settings and data. Continue?")
      ) {
        localStorage.clear();
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value as string);
        }
        alert("Data imported successfully! Reloading...");
        location.reload();
      }
    } catch (err) {
      alert("Invalid backup file.");
    }
  };
  reader.readAsText(file);
}

init()
  .then(() => {
    const goBtn = document.getElementById("go-btn") as HTMLButtonElement;
    const backBtn = document.getElementById("back-btn") as HTMLButtonElement;
    const forwardBtn = document.getElementById(
      "forward-btn",
    ) as HTMLButtonElement;
    const homeBtn = document.getElementById("home-btn") as HTMLButtonElement;

    function navigate(input: string) {
      if (!activeTab) return;
      input = input.trim();
      if (!input) return;
      const isUrl =
        /^https?:\/\//.test(input) ||
        (/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/.*)?$/.test(input) &&
          !input.includes(" "));
      let targetUrl = isUrl
        ? /^https?:\/\//.test(input)
          ? input
          : "https://" + input
        : "https://duckduckgo.com/?q=" + encodeURIComponent(input);
      loadTab(activeTab, targetUrl, false, true);
    }

    goBtn.onclick = () => navigate(urlBar.value);
    newTabBtn.onclick = () => createTab();
    urlBar.onkeydown = (e) => {
      if (e.key === "Enter") navigate(urlBar.value);
    };
    backBtn.onclick = () => {
      if (activeTab && activeTab.historyIndex > 0) {
        activeTab.historyIndex--;
        const target = activeTab.history[activeTab.historyIndex];
        loadTab(activeTab, target, target === homeDataURL, false);
      }
    };
    forwardBtn.onclick = () => {
      if (activeTab && activeTab.historyIndex < activeTab.history.length - 1) {
        activeTab.historyIndex++;
        const target = activeTab.history[activeTab.historyIndex];
        loadTab(activeTab, target, target === homeDataURL, false);
      }
    };
    homeBtn.onclick = () => {
      if (activeTab && activeTab.url !== homeDataURL)
        loadTab(activeTab, homeDataURL, true, true);
    };

    window.addEventListener("message", (event) => {
      if (event.data?.type === "navigate")
        navigate(String(event.data.value || ""));
    });

    const wispInput = document.getElementById("wisp-input") as HTMLInputElement;
    const settingsSave = document.getElementById(
      "settings-save",
    ) as HTMLButtonElement;
    const settingsCancel = document.getElementById(
      "settings-cancel",
    ) as HTMLButtonElement;
    const settingsReset = document.getElementById(
      "settings-reset",
    ) as HTMLButtonElement;
    const settingsBtn = document.getElementById(
      "settings-btn",
    ) as HTMLButtonElement;
    const exportBtn = document.getElementById(
      "export-data",
    ) as HTMLButtonElement;
    const importBtn = document.getElementById(
      "import-data",
    ) as HTMLButtonElement;
    const importInput = document.getElementById(
      "import-input",
    ) as HTMLInputElement;

    settingsBtn.onclick = () => {
      wispInput.value = getWispServer();
      settingsOverlay.style.display = "flex";
      wispInput.focus();
    };
    settingsCancel.onclick = () => (settingsOverlay.style.display = "none");
    settingsSave.onclick = async () => {
      const value = wispInput.value.trim();
      if (!value) return;
      setWispServer(value);
      await applyTransport(value);
      settingsOverlay.style.display = "none";
    };
    settingsReset.onclick = () => (wispInput.value = DEFAULT_WISP);
    settingsOverlay.onclick = (e) => {
      if (e.target === settingsOverlay) settingsOverlay.style.display = "none";
    };

    exportBtn.onclick = exportData;
    importBtn.onclick = () => importInput.click();
    importInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) importData(file);
    };

    createTab();
  })
  .catch(console.error);
