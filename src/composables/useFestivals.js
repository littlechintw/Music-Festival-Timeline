// @ts-check
import { festivalSchema } from '../pwa/schema';

/**
 * @typedef {import('../pwa/schema').Festival} Festival
 * @typedef {{
 *   festivalId: string,
 *   name: string,
 *   startTime: string,
 *   endTime: string,
 *   file: string,
 *   hash: string,
 *   bytes: number,
 *   status: 'upcoming' | 'archived',
 *   location?: { name: string, address: string },
 *   stageCount?: number,
 *   performanceCount?: number,
 *   themePrimary?: string,
 * }} FestivalIndexEntry
 * @typedef {{ version: 2, generatedAt: string, indexHash: string, festivals: FestivalIndexEntry[] }} FestivalIndex
 */

const INDEX_URL = '/festivals/index.json';
const HASHES_KEY = 'festival_hashes_v1';
// 跟 src/pwa/sw.js 的 runtime cache 名稱對齊
export const FESTIVAL_DATA_CACHE = 'festival-data';

// ---- 離線保留規則（單一來源，Settings 文案與 store 都從這裡拿）----
// 開始時間在未來 AUTO_FUTURE_DAYS 天內、或結束時間在過去 AUTO_PAST_DAYS 天內的活動 = 「近期活動」，
// 開 App 時自動下載；其他活動只有使用者點開時才下載。
export const AUTO_FUTURE_DAYS = 30;
export const AUTO_PAST_DAYS = 14;
// 已下載的資料最多保留 RETENTION_DAYS 天；期間有再打開就從那天重算。
export const RETENTION_DAYS = 30;
const DAY_MS = 86400000;

/**
 * 這場活動是否落在「自動下載」的時間窗內。
 * @param {{ startTime: string, endTime: string }} entry
 * @param {number} [now]
 */
export function isInAutoWindow(entry, now = Date.now()) {
  const start = new Date(entry.startTime).getTime();
  const end = new Date(entry.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= now + AUTO_FUTURE_DAYS * DAY_MS && end >= now - AUTO_PAST_DAYS * DAY_MS;
}

/** @returns {Record<string, string>} */
export function loadLocalHashes() {
  try {
    const raw = localStorage.getItem(HASHES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** @param {Record<string, string>} map */
function saveLocalHashes(map) {
  try {
    localStorage.setItem(HASHES_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

/**
 * 取得索引：先試線上拿最新（cache: 'no-cache'），失敗就退回 SW cache。
 *
 * @returns {Promise<FestivalIndex | null>}
 */
export async function fetchIndex() {
  try {
    const res = await fetch(INDEX_URL, { cache: 'no-cache' });
    if (res.ok) return await res.json();
  } catch {
    /* offline */
  }
  // 退路：吃 SW cache
  try {
    const res = await fetch(INDEX_URL);
    if (res.ok) return await res.json();
  } catch {
    /* totally offline + no cache */
  }
  return null;
}

/**
 * 真正去抓一個 festival JSON 並驗 schema。會更新 localStorage hash。
 * 線上時 SW 的 StaleWhileRevalidate route 會順便把回應存進 festival-data cache。
 *
 * @param {FestivalIndexEntry} entry
 * @param {Record<string, string>} hashMap
 */
async function fetchFestival(entry, hashMap) {
  const res = await fetch(`/festivals/${entry.file}`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to fetch ${entry.file}: ${res.status}`);
  const data = await res.json();
  const parsed = safeParse(data, entry.file);
  if (parsed) {
    hashMap[entry.festivalId] = entry.hash;
  }
  return parsed;
}

/**
 * 依「該不該留在裝置上」同步節慶資料：
 *
 * - shouldKeep(entry) 為 true：需要的資料。hash 一樣且記憶體有就直接用（0 網路）；
 *   否則抓一份（離線時由 SW cache 供應；完全沒有就跳過並回報錯誤）。
 * - shouldKeep(entry) 為 false：不需要。之前若有下載過就從 SW cache 與 hash 紀錄移除。
 *
 * @param {{
 *   shouldKeep: (entry: FestivalIndexEntry) => boolean,
 *   getCached: (id: string) => Festival | undefined,
 * }} opts
 * @returns {Promise<{ index: FestivalIndex | null, festivals: Festival[], errors: string[], evicted: string[] }>}
 */
export async function syncFestivals(opts) {
  const index = await fetchIndex();
  if (!index) return { index: null, festivals: [], errors: ['index-unavailable'], evicted: [] };

  const hashes = loadLocalHashes();
  /** @type {Festival[]} */
  const out = [];
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const evicted = [];

  for (const entry of index.festivals) {
    const cached = opts.getCached(entry.festivalId);
    const hashOk = hashes[entry.festivalId] === entry.hash;

    if (!opts.shouldKeep(entry)) {
      if (entry.festivalId in hashes) {
        await deleteFromCache(entry);
        delete hashes[entry.festivalId];
        evicted.push(entry.festivalId);
      }
      continue;
    }

    if (cached && hashOk) {
      out.push(cached);
      continue;
    }

    try {
      const data = await fetchFestival(entry, hashes);
      if (data) out.push(data);
      else errors.push(`schema:${entry.file}`);
    } catch (err) {
      console.warn('[festival] fetch failed:', entry.file, err);
      errors.push(`fetch:${entry.file}`);
      if (cached) out.push(cached); // 保留舊版本
    }
  }

  saveLocalHashes(hashes);
  return { index, festivals: out, errors, evicted };
}

/**
 * 使用者點開某場活動時的按需下載（也用於「更新」）。
 * @param {FestivalIndexEntry} entry
 */
export async function downloadFestivalToCache(entry) {
  const hashes = loadLocalHashes();
  const data = await fetchFestival(entry, hashes);
  saveLocalHashes(hashes);
  return data;
}

/** @param {FestivalIndexEntry} entry */
async function deleteFromCache(entry) {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(FESTIVAL_DATA_CACHE);
    await cache.delete(`/festivals/${entry.file}`, { ignoreSearch: true });
  } catch (err) {
    console.warn('[festival] cache delete failed:', err);
  }
}

/**
 * 從 SW cache 與本地 hash 紀錄中移除一個 festival。
 * @param {FestivalIndexEntry} entry
 */
export async function removeFestivalFromCache(entry) {
  await deleteFromCache(entry);
  const hashes = loadLocalHashes();
  delete hashes[entry.festivalId];
  saveLocalHashes(hashes);
}

/**
 * @param {unknown} data
 * @param {string} sourceHint
 */
function safeParse(data, sourceHint) {
  const result = festivalSchema.safeParse(data);
  if (!result.success) {
    console.warn('[festival] schema validation failed:', sourceHint, result.error.format());
    return null;
  }
  return result.data;
}
