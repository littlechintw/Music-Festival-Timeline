// @ts-check
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { syncFestivals, fetchIndex } from '../composables/useFestivals';
import { useOfflineStore } from './offline';

/**
 * @typedef {import('../pwa/schema').Festival} Festival
 * @typedef {import('../composables/useFestivals').FestivalIndex} FestivalIndex
 */

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const useFestivalStore = defineStore('festival', () => {
  /** @type {import('vue').Ref<Festival[]>} */
  const festivals = ref([]);
  /** @type {import('vue').Ref<FestivalIndex | null>} */
  const index = ref(null);
  /** @type {import('vue').Ref<string | null>} */
  const selectedFestivalId = ref(null);
  const loading = ref(false);
  const lastSyncedAt = ref(0);
  /** @type {import('vue').Ref<string[]>} */
  const lastErrors = ref([]);

  const getFestivals = computed(() => festivals.value);

  /** @param {string} id */
  const getById = (id) => festivals.value.find((f) => f.festivalId === id) ?? null;

  const selectedFestival = computed(() =>
    selectedFestivalId.value ? getById(selectedFestivalId.value) : null
  );

  /**
   * 同步節慶資料。離線優先：hash 一樣就完全不打網路。
   *
   * @param {{ force?: boolean }} [options]
   */
  async function ensureLoaded(options = {}) {
    const offlineStore = useOfflineStore();
    const stale = Date.now() - lastSyncedAt.value > REFRESH_INTERVAL_MS;
    if (!options.force && festivals.value.length > 0 && !stale) {
      return festivals.value;
    }
    if (loading.value) return festivals.value;

    loading.value = true;
    try {
      const result = await syncFestivals({
        mode: offlineStore.mode,
        pinnedIds: offlineStore.pinned,
        getCached: (id) => festivals.value.find((f) => f.festivalId === id),
      });

      if (result.index) {
        index.value = result.index;
      }
      if (result.festivals.length > 0) {
        festivals.value = result.festivals;
        lastSyncedAt.value = Date.now();

        // 背景把 upcoming festival 的場地地圖預先抓進 SW 快取，
        // 現場切到地圖頁面才能瞬間顯示。
        prefetchMaps(result.festivals, result.index);
      }
      lastErrors.value = result.errors;
    } finally {
      loading.value = false;
    }
    return festivals.value;
  }

  /**
   * @param {Festival[]} list
   * @param {import('../composables/useFestivals').FestivalIndex | null | undefined} idx
   */
  function prefetchMaps(list, idx) {
    if (typeof navigator === 'undefined' || !navigator.onLine) return;
    const upcomingIds = new Set(
      (idx?.festivals || []).filter((f) => f.status === 'upcoming').map((f) => f.festivalId)
    );
    for (const fest of list) {
      if (!upcomingIds.has(fest.festivalId)) continue;
      const url = fest.map?.image;
      if (!url) continue;
      // base64 data URL 不用 prefetch（沒有 HTTP 請求可快取）
      if (url.startsWith('data:')) continue;
      // 故意不 await：背景靜默 fetch，CacheFirst 規則會把回應放進 festival-images cache
      fetch(url, { mode: 'no-cors' }).catch(() => {});
    }
  }

  /**
   * 只重抓 index.json，不重抓 festival 內容。用在「立即檢查更新」按鈕看是否有可更新。
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
    selectedFestivalId,
    loading,
    lastSyncedAt,
    lastErrors,
    getFestivals,
    selectedFestival,
    getById,
    ensureLoaded,
    refreshIndex,
    selectFestival,
    REFRESH_INTERVAL_MS,
  };
});
