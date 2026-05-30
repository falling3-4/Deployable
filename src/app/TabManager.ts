import { Tab } from "./types";
import { homeDataURL } from "../components/StartPage";
import { PREFIX, CURRENT_PROXY } from "./constants";
import { normalizeUrl } from "./utils";
import { checkLarp } from "./EasterEgg";
import logo from "../assets/logo.png";
import { openDB } from "idb";
import { sj } from "../index";

const dbPromise = openDB('SettingsDB', 1, {
  upgrade(db) {
    db.createObjectStore('settings');
  },
});
const db = await dbPromise;
async function proxyFind() {
  return await db.get('settings', 'deployable.proxy');
}

let tabs: Tab[] = [];
let activeTab: Tab | null = null;
let sjFrame;
let frame;

export function getTabs() { return tabs; }
export function getActiveTab() { return activeTab; }
export function setActiveTab(tab: Tab | null) { activeTab = tab; }

export async function createTab(url: string = homeDataURL) {
  const framesContainer = document.getElementById("frames-container") as HTMLDivElement;
  const tabBar = document.getElementById("tab-bar") as HTMLDivElement;
  const newTabBtn = document.getElementById("new-tab-btn") as HTMLButtonElement;
  const urlBar = document.getElementById("url-bar") as HTMLInputElement;

  const id = Math.random().toString(36).substring(2, 11);
  const sjFrame = sj.createFrame();
  const frame = sjFrame.frame;
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
    sjFrame
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
        let decodedUrl;
        if (CURRENT_PROXY === "choice-scram") {
          const decodedUrl = decodeURIComponent(encodedUrl);
        }
        else {
          const decodedUrl = (window as any).Ultraviolet.codec.xor.decode(encodedUrl);
        }
        if (decodedUrl && normalizeUrl(decodedUrl) !== normalizeUrl(tab.url)) {
          tab.url = decodedUrl;
          if (activeTab === tab) urlBar.value = decodedUrl;
          tab.history = tab.history.slice(0, tab.historyIndex + 1);
          tab.history.push(decodedUrl);
          tab.historyIndex++;
          checkLarp(decodedUrl);
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

export function updateTabMetadata(tab: Tab, title?: string, favicon?: string) {
  const titleEl = tab.tabElement.querySelector(".tab-title");
  const faviconEl = tab.tabElement.querySelector(
    ".tab-favicon",
  ) as HTMLImageElement;
  if (titleEl)
    titleEl.textContent = tab.url === homeDataURL || !title ? "Home" : title;
  if (faviconEl)
    faviconEl.src = tab.url === homeDataURL || !favicon ? logo : favicon;
}

export function switchTab(id: string) {
  const urlBar = document.getElementById("url-bar") as HTMLInputElement;
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

export function closeTab(id: string) {
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

export function loadTab(
  tab: Tab,
  url: string,
  isHome: boolean = false,
  push: boolean = true,
) {
  const urlBar = document.getElementById("url-bar") as HTMLInputElement;
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
    let encodedUrl: string;
    // console.log(CURRENT_PROXY);
    if (CURRENT_PROXY === "choice-scram") {
      encodedUrl = encodeURIComponent(url);
    }
    else {
      encodedUrl = (window as any).Ultraviolet.codec.xor.encode(url);
    }
    // console.log(encodedUrl);
    tab.frame.src = PREFIX + encodedUrl;
    checkLarp(url);
  }
  updateTabMetadata(tab, isHome ? "Home" : url);
}
