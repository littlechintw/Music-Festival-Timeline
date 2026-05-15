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
 * }} FestivalIndexEntry
 * @typedef {{ version: 2, generatedAt: string, indexHash: string, festivals: FestivalIndexEntry[] }} FestivalIndex
 */

const INDEX_URL = '/festivals/index.json';
const HASHES_KEY = 'festival_hashes_v1';

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
 * 對使用者的離線策略執行同步：
 *
 * - mode='auto':    列表上看得到的活動全部抓（包含 archived），讓使用者可以瀏覽過往活動。
 *                   SHA 一樣的不重抓，所以實際上只有第一次 + 更新時才下載。
 *                   離線時抓不到的就靜默跳過（仍會回傳已快取的版本）。
 *                   ※ 「auto 自動 precache」只在 SW install 時針對 upcoming 生效（vite.config.js 控制），
 *                     和這裡的「runtime 抓取」是兩件事。
 * - mode='manual':  只更新 pin 過的 + 已經有快取的，不會主動抓 archived。
 *
 * 不論 mode，**hash 一樣就完全不打網路**。
 *
 * @param {{
 *   mode: 'auto' | 'manual',
 *   pinnedIds: Set<string> | string[],
 *   getCached: (id: string) => Festival | undefined,
 * }} opts
 * @returns {Promise<{ index: FestivalIndex | null, festivals: Festival[], errors: string[] }>}
 */
export async function syncFestivals(opts) {
  const index = await fetchIndex();
  if (!index) return { index: null, festivals: [], errors: ['index-unavailable'] };

  const hashes = loadLocalHashes();
  const pinned = opts.pinnedIds instanceof Set ? opts.pinnedIds : new Set(opts.pinnedIds);
  /** @type {Festival[]} */
  const out = [];
  /** @type {string[]} */
  const errors = [];

  for (const entry of index.festivals) {
    const cached = opts.getCached(entry.festivalId);
    const hashOk = hashes[entry.festivalId] === entry.hash;

    if (cached && hashOk) {
      out.push(cached);
      continue;
    }

    const shouldFetch =
      opts.mode === 'auto' || pinned.has(entry.festivalId) || !!cached;

    if (!shouldFetch) {
      // manual mode：使用者沒 pin、也沒抓過 → 跳過。Settings UI 可以手動觸發。
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
  return { index, festivals: out, errors };
}

/**
 * 強制把一個 festival 抓下來並進 cache（手動離線管理用）。
 * @param {FestivalIndexEntry} entry
 */
export async function downloadFestivalToCache(entry) {
  const hashes = loadLocalHashes();
  const data = await fetchFestival(entry, hashes);
  saveLocalHashes(hashes);
  return data;
}

/**
 * 從 SW cache 與本地 hash 紀錄中移除一個 festival。
 * @param {FestivalIndexEntry} entry
 */
export async function removeFestivalFromCache(entry) {
  if ('caches' in self) {
    try {
      const cache = await caches.open('festival-data');
      await cache.delete(`/festivals/${entry.file}`);
    } catch (err) {
      console.warn('[festival] cache delete failed:', err);
    }
  }
  const hashes = loadLocalHashes();
  delete hashes[entry.festivalId];
  saveLocalHashes(hashes);
}

/**
 * 純載入：給第一次開 app、UI 還沒 mount 之前用。會走 syncFestivals。
 * @param {{
 *   mode?: 'auto' | 'manual',
 *   pinnedIds?: Set<string> | string[],
 * }} [opts]
 */
export async function loadAllFestivals(opts = {}) {
  const result = await syncFestivals({
    mode: opts.mode ?? 'auto',
    pinnedIds: opts.pinnedIds ?? new Set(),
    getCached: () => undefined,
  });
  return result.festivals;
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
