// import { loadGames } from "../games/GamesManager";

export function initUI(app: HTMLElement) {
  app.innerHTML = `
    <div id="main-nav">
      <div class="nav-right">
        <button class="small-btn" id="arrow" title="Expand/Hide">></button>
        <button id="nav-web" class="nav-item active">Web</button>
        <button id="nav-games" class="nav-item">Games</button>
        <button class="small-btn" id="settings-btn" title="Settings">&#9881;</button>
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
          <label for="proxy-choice">Proxy</label>
          <div class="choice-actions">
            <button id="choice-uv">Ultraviolet</button><button id="choice-scram">Scramjet</button>
          </div>
          <p class="settings-hint">Scramjet is newer and is still maintained. There are few reasons to choose Ultraviolet.</p>
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

  const webView = document.getElementById("web-view") as HTMLDivElement;
  const gamesView = document.getElementById("games-view") as HTMLDivElement;
  const navWeb = document.getElementById("nav-web") as HTMLButtonElement;
  const navGames = document.getElementById("nav-games") as HTMLButtonElement;
  const gamesSearch = document.getElementById("games-search") as HTMLInputElement;

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
      // loadGames(gamesSearch.value);
    }
  }

  navWeb.onclick = () => switchView("web");
  navGames.onclick = () => switchView("games");
}
