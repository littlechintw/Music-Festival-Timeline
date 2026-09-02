// @ts-check
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  syncFestivals,
  fetchIndex,
  downloadFestivalToCache,
  removeFestivalFromCache,
  isInAutoWindow,
  loadLocalHashes,
} from '../composables/useFestivals';
import { useOfflineStore } from './offline';

/**
 * @typedef {import('../pwa/schema').Festival} Festival
 * @typedef {import('../composables/useFestivals').FestivalIndex} FestivalIndex
 * @typedef {import('../composables/useFestivals').FestivalIndexEntry} FestivalIndexEntry
 */

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const useFestivalStore = defineStore('festival', () => {
  /** @type {import('vue').Ref<Festival[]>} 已下載到裝置的完整資料 */
  const festivals = ref([]);
  /** @type {import('vue').Ref<FestivalIndex | null>} 全部活動的索引（列表頁用這個，不需要下載完整資料） */
  const index = ref(null);
  /** @type {import('vue').Ref<string | null>} */
  const selectedFestivalId = ref(null);
  const loading = ref(false);
  const lastSyncedAt = ref(0);
  /** @type {import('vue').Ref<string[]>} */
  const lastErrors = ref([]);
  /** @type {Promise<Festival[]> | null} 同一時間多個呼叫者共用同一個進行中的請求，避免後來者拿到還沒填好的空陣列 */
  let inFlight = null;
  /** @type {Map<string, Promise<Festival | null>>} 按需下載去重 */
  const downloading = new Map();

  const getFestivals = computed(() => festivals.value);
  const indexEntries = computed(() => index.value?.festivals || []);

  /** @param {string} id */
  const getById = (id) => festivals.value.find((f) => f.festivalId === id) ?? null;
  /** @param {string} id */
  const getEntry = (id) => indexEntries.value.find((f) => f.festivalId === id) ?? null;

  const selectedFestival = computed(() =>
    selectedFestivalId.value ? getById(selectedFestivalId.value) : null
  );

  /**
   * 這場活動該不該留在裝置上：近期活動一律留；其他看最近 30 天有沒有用過。
   * @param {FestivalIndexEntry} entry
   */
  function shouldKeep(entry) {
    const offlineStore = useOfflineStore();
    return isInAutoWindow(entry) || offlineStore.isRecentlyUsed(entry.festivalId);
  }

  /**
   * 同步節慶資料：抓索引 → 下載近期／最近用過的 → 清掉過期的。hash 一樣就完全不打網路。
   *
   * @param {{ force?: boolean }} [options]
   */
  async function ensureLoaded(options = {}) {
    const stale = Date.now() - lastSyncedAt.value > REFRESH_INTERVAL_MS;
    if (!options.force && index.value && !stale) {
      return festivals.value;
    }
    if (inFlight) return inFlight;

    const offlineStore = useOfflineStore();
    loading.value = true;
    inFlight = (async () => {
      try {
        const result = await syncFestivals({
          shouldKeep,
          getCached: (id) => festivals.value.find((f) => f.festivalId === id),
        });

        if (result.index) {
          index.value = result.index;
          festivals.value = result.festivals;
          lastSyncedAt.value = Date.now();
          for (const f of result.festivals) offlineStore.touchIfMissing(f.festivalId);
          for (const id of result.evicted) offlineStore.forget(id);
          prefetchMaps(result.festivals, result.index);
        }
        lastErrors.value = result.errors;
      } finally {
        loading.value = false;
        inFlight = null;
      }
      return festivals.value;
    })();
    return inFlight;
  }

  /**
   * 使用者點開某場活動：記錄使用時間，沒下載過就現在抓（離線且沒快取時回 null）。
   * @param {string} id
   * @returns {Promise<Festival | null>}
   */
  async function ensureFestival(id) {
    if (!id) return null;
    const offlineStore = useOfflineStore();
    const existing = getById(id);
    if (existing) {
      offlineStore.touch(id);
      return existing;
    }

    const pending = downloading.get(id);
    if (pending) return pending;

    const task = (async () => {
      let entry = getEntry(id);
      if (!entry) {
        await refreshIndex();
        entry = getEntry(id);
      }
      if (!entry) return null;
      try {
        const data = await downloadFestivalToCache(entry);
        // 只有真的拿到資料才算「使用過」；離線點開失敗不該讓它在回到線上時被自動補下載
        if (data) {
          upsert(data);
          offlineStore.touch(id);
        }
        return data;
      } catch (err) {
        console.warn('[festival] on-demand download failed:', id, err);
        return null;
      } finally {
        downloading.delete(id);
      }
    })();
    downloading.set(id, task);
    return task;
  }

  /**
   * 重新下載一場活動（設定頁「更新」）。
   * @param {string} id
   */
  async function refreshFestival(id) {
    const entry = getEntry(id);
    if (!entry) return null;
    const data = await downloadFestivalToCache(entry);
    if (data) {
      upsert(data);
      useOfflineStore().touchIfMissing(id);
    }
    return data;
  }

  /**
   * 從裝置移除一場活動的離線資料。近期活動下次同步仍會自動下載（規則如此），Settings 不對它們顯示這個動作。
   * @param {string} id
   */
  async function removeFestival(id) {
    const entry = getEntry(id);
    if (entry) await removeFestivalFromCache(entry);
    festivals.value = festivals.value.filter((f) => f.festivalId !== id);
    useOfflineStore().forget(id);
  }

  /** @param {Festival} data */
  function upsert(data) {
    const rest = festivals.value.filter((f) => f.festivalId !== data.festivalId);
    festivals.value = [...rest, data];
  }

  /** @param {string} id */
  function isCached(id) {
    const entry = getEntry(id);
    if (!entry) return false;
    return loadLocalHashes()[id] === entry.hash || !!getById(id);
  }

  /**
   * @param {Festival[]} list
   * @param {FestivalIndex | null | undefined} idx
   */
  function prefetchMaps(list, idx) {
    if (typeof navigator === 'undefined' || !navigator.onLine) return;
    const autoIds = new Set((idx?.festivals || []).filter((f) => isInAutoWindow(f)).map((f) => f.festivalId));
    for (const fest of list) {
      if (!autoIds.has(fest.festivalId)) continue;
      const url = fest.map?.image;
      if (!url || url.startsWith('data:')) continue;
      // 故意不 await：背景靜默 fetch，CacheFirst 規則會把回應放進 festival-images cache
      fetch(url, { mode: 'no-cors' }).catch(() => {});
    }
  }

  /**
   * 只重抓 index.json，不重抓 festival 內容。
   */
  async function refreshIndex() {
    const next = await fetchIndex();
    if (next) index.value = next;
    return next;
  }

  /** @param {string} id */
  function selectFestival(id) {
    selectedFestivalId.value = id;
  }

  return {
    festivals,
    index,
    indexEntries,
    selectedFestivalId,
    loading,
    lastSyncedAt,
    lastErrors,
    getFestivals,
    selectedFestival,
    getById,
    getEntry,
    isCached,
    shouldKeep,
    ensureLoaded,
    ensureFestival,
    refreshFestival,
    removeFestival,
    refreshIndex,
    selectFestival,
    REFRESH_INTERVAL_MS,
  };
});
