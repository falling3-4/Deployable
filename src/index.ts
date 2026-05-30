import "./styles/main.css";
import { BASE, DEFAULT_WISP } from "./app/constants";
import { getWispServer, setWispServer } from "./app/utils";
import { homeDataURL } from "./components/StartPage";
import { initUI } from "./components/UI";
import { createTab, getActiveTab, loadTab } from "./app/TabManager";
// import { loadGames, getGamesState } from "./games/GamesManager";
import { exportData, importData } from "./app/SettingsManager";
import { openDB } from 'idb';

export let sj: any = null;

let bareMuxConnection: any = null;

async function applyTransport(wispUrl: string) {
  if (!bareMuxConnection) return; 
  await bareMuxConnection.setTransport(
    "https://unpkg.com/@mercuryworkshop/libcurl-transport@1.5.2/dist/index.mjs",
    [
      {
        websocket: wispUrl,
        wasm: "https://unpkg.com/libcurl.js/libcurl.wasm",
      },
    ],
  );
}

async function init() {
  await navigator.serviceWorker.register("pingas.js", {scope: "/"}); // change *this* 
  await navigator.serviceWorker.ready;

  bareMuxConnection = new (window as any).BareMux.BareMuxConnection(
    BASE + "bare-mux-worker.js",
  );

  await applyTransport(getWispServer());
  const { ScramjetController } = $scramjetLoadController();

  sj = new ScramjetController({
    prefix: BASE + "scramjet/",
    files: { 
      wasm: "https://unpkg.com/@mercuryworkshop/scramjet@1.1.0/dist/scramjet.wasm.wasm",
      all: "https://unpkg.com/@mercuryworkshop/scramjet@1.1.0/dist/scramjet.all.js",
      sync: "https://unpkg.com/@mercuryworkshop/scramjet@1.1.0/dist/scramjet.sync.js"
    },
    codec: {
      encode: (url: any) => encodeURIComponent(url),
      decode: (url: any) => decodeURIComponent(url),
    }
  });
  sj.init();
}

const dbPromise = openDB('SettingsDB', 1, {
  upgrade(db) {
    db.createObjectStore('settings');
  },
});

async function loadProxyChoice() {
  const db = await dbPromise;
  const savedProxy = await db.get('settings', 'deployable.proxy');
  
  if (savedProxy) {
    const btn = document.getElementById(savedProxy);
    if (btn) btn.classList.add('selected');
  }
}

loadProxyChoice();

const app = document.getElementById("app");

if (app) {
  initUI(app);

  // await (window as any).Lumin.init({ headless: true });

  init()
    .then(() => {
      const urlBar = document.getElementById("url-bar") as HTMLInputElement;
      const goBtn = document.getElementById("go-btn") as HTMLButtonElement;
      const newTabBtn = document.getElementById(
        "new-tab-btn",
      ) as HTMLButtonElement;
      const backBtn = document.getElementById("back-btn") as HTMLButtonElement;
      const forwardBtn = document.getElementById(
        "forward-btn",
      ) as HTMLButtonElement;
      const homeBtn = document.getElementById("home-btn") as HTMLButtonElement;

      const gamesSearch = document.getElementById(
        "games-search",
      ) as HTMLInputElement;
      const prevPageBtn = document.getElementById(
        "prev-page",
      ) as HTMLButtonElement;
      const nextPageBtn = document.getElementById(
        "next-page",
      ) as HTMLButtonElement;

      function navigate(input: string) {
        const activeTab = getActiveTab();
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
        const activeTab = getActiveTab();
        if (activeTab && activeTab.historyIndex > 0) {
          activeTab.historyIndex--;
          const target = activeTab.history[activeTab.historyIndex];
          loadTab(activeTab, target, target === homeDataURL, false);
        }
      };

      forwardBtn.onclick = () => {
        const activeTab = getActiveTab();
        if (
          activeTab &&
          activeTab.historyIndex < activeTab.history.length - 1
        ) {
          activeTab.historyIndex++;
          const target = activeTab.history[activeTab.historyIndex];
          loadTab(activeTab, target, target === homeDataURL, false);
        }
      };

      homeBtn.onclick = () => {
        const activeTab = getActiveTab();
        if (activeTab && activeTab.url !== homeDataURL)
          loadTab(activeTab, homeDataURL, true, true);
      };

      window.addEventListener("message", (event) => {
        if (event.data?.type === "navigate")
          navigate(String(event.data.value || ""));
      });

      let searchTimeout: any;
      gamesSearch.oninput = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          // loadGames(gamesSearch.value);
          return;
        }, 400);
      };

      prevPageBtn.onclick = () => {
        // const { currentPage, selectedCategory } = getGamesState();
        // if (currentPage > 1)
          // loadGames(gamesSearch.value, selectedCategory, currentPage - 1);
        return;
      };

      nextPageBtn.onclick = () => {
        // const { currentPage, totalPages, selectedCategory } = getGamesState();
        // if (currentPage < totalPages)
          // loadGames(gamesSearch.value, selectedCategory, currentPage + 1);
        return;
      };

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
      const settingsBtn = document.getElementById(
        "settings-btn",
      ) as HTMLButtonElement;
      const arrow = document.getElementById(
        "arrow",
      ) as HTMLButtonElement;
      const nav = document.getElementById(
        "main-nav",
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
      const settingsOverlay = document.getElementById(
        "settings-overlay",
      ) as HTMLDivElement;
      const choiceScram = document.getElementById(
        "choice-scram"
      ) as HTMLButtonElement;
      const choiceUv = document.getElementById(
        "choice-uv"
      ) as HTMLButtonElement;
      const choiceBtns = document.querySelectorAll(
        '.choice-actions button'
      ) as NodeListOf<HTMLButtonElement>;

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
        const activeBtn = document.querySelector('.choice-actions button.selected') as HTMLButtonElement | null;
        if (activeBtn) {
          const db = await dbPromise;
          await db.put('settings', activeBtn.id, 'deployable.proxy');
          console.log('Settings saved to IndexedDB: deployable.proxy:' + activeBtn.id);
        }
        window.location.reload();
      };
      settingsReset.onclick = () => (wispInput.value = DEFAULT_WISP);
      settingsOverlay.onclick = (e) => {
        if (e.target === settingsOverlay)
          settingsOverlay.style.display = "none";
      };
      // I know nothing about TypeScript so I'm gonna treat it like JavaScript... And copy the code above me.
      var open = true;
      arrow.onclick = () => {
        if (open === true) {
          open = false;
          nav.style.right = "-198px";
          arrow.innerHTML = "<";
        } else {
          open = true;
          nav.style.right = "10px";
          arrow.innerHTML = ">";
        }
      };

      async function initProxySelection() {
        const db = await dbPromise;
        const storedProxyId = await db.get('settings', 'deployable.proxy');

        choiceBtns.forEach((btn) => {
          if (btn.id === storedProxyId) {
            btn.classList.add('selected');
          }

          btn.addEventListener('click', () => {
            choiceBtns.forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
          });
        });
      }
      initProxySelection();

      exportBtn.onclick = exportData;
      importBtn.onclick = () => importInput.click();
      importInput.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) importData(file);
      };

      createTab();
    })
    .catch(console.error);
}
