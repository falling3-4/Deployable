import { proxyFind } from "./utils"
export const CURRENT_PROXY = await proxyFind();
export const BASE = new URL("./", location.href).pathname; 
export const PREFIX = CURRENT_PROXY === "choice-scram"
  ? BASE + "scramjet/"
  : BASE + "uv/service/";
export const DEFAULT_WISP = "wss://anura.pro/";
export const WISP_STORAGE_KEY = "deployable.wispServer";
