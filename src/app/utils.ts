import { DEFAULT_WISP, WISP_STORAGE_KEY } from "./constants";
import { openDB } from "idb";

export const getWispServer = () =>
  localStorage.getItem(WISP_STORAGE_KEY) || DEFAULT_WISP;

export const setWispServer = (url: string) =>
  localStorage.setItem(WISP_STORAGE_KEY, url);

export const normalizeUrl = (u: string) => {
  try {
    return new URL(u).href;
  } catch {
    return u;
  }
};

export const proxyFind = async () => {
  const dbPromise = openDB('SettingsDB', 1, {
    upgrade(db) {
      db.createObjectStore('settings');
    },
  });
  const db = await dbPromise;
  return await db.get('settings', 'deployable.proxy');
}
