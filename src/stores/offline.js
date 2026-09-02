// @ts-check
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { RETENTION_DAYS } from '../composables/useFestivals';

const LAST_USED_KEY = 'offline_last_used_v1';
// 舊版（auto/manual + pin 清單）的 key，升級時把 pin 過的視為「剛用過」，然後清掉
const LEGACY_MODE_KEY = 'offline_mode';
const LEGACY_PINNED_KEY = 'offline_pinned';
const DAY_MS = 86400000;

/** @returns {Record<string, number>} festivalId → 最後使用時間（epoch ms） */
function readLastUsed() {
  /** @type {Record<string, number>} */
  let map = {};
  try {
    const raw = localStorage.getItem(LAST_USED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') map = parsed;
  } catch {
    map = {};
  }
  try {
    const legacy = localStorage.getItem(LEGACY_PINNED_KEY);
    if (legacy) {
      const ids = JSON.parse(legacy);
      if (Array.isArray(ids)) for (const id of ids) map[id] = map[id] || Date.now();
      localStorage.removeItem(LEGACY_PINNED_KEY);
      localStorage.removeItem(LEGACY_MODE_KEY);
    }
  } catch {}
  return map;
}

/**
 * 記錄每場活動「最後一次被使用」的時間，決定離線資料要不要繼續留著。
 * 「使用」= 打開該活動的詳情／時間軸／地圖，或第一次被下載進裝置。
 */
export const useOfflineStore = defineStore('offline', () => {
  /** @type {import('vue').Ref<Record<string, number>>} */
  const lastUsed = ref(readLastUsed());

  watch(
    lastUsed,
    (v) => {
      try {
        localStorage.setItem(LAST_USED_KEY, JSON.stringify(v));
      } catch {}
    },
    { deep: true }
  );

  /** @param {string} id */
  function touch(id) {
    if (!id) return;
    lastUsed.value = { ...lastUsed.value, [id]: Date.now() };
  }

  /** 第一次下載時補記錄，之後不覆蓋（保留真實的最後使用時間） @param {string} id */
  function touchIfMissing(id) {
    if (!id || lastUsed.value[id]) return;
    touch(id);
  }

  /** @param {string} id */
  function forget(id) {
    if (!(id in lastUsed.value)) return;
    const next = { ...lastUsed.value };
    delete next[id];
    lastUsed.value = next;
  }

  /** @param {string} id */
  function lastUsedAt(id) {
    return lastUsed.value[id] || 0;
  }

  /** @param {string} id */
  function expiresAt(id) {
    const at = lastUsedAt(id);
    return at ? at + RETENTION_DAYS * DAY_MS : 0;
  }

  /**
   * @param {string} id
   * @param {number} [now]
   */
  function isRecentlyUsed(id, now = Date.now()) {
    const exp = expiresAt(id);
    return exp > 0 && now < exp;
  }

  const usedIds = computed(() => Object.keys(lastUsed.value));

  return { lastUsed, usedIds, touch, touchIfMissing, forget, lastUsedAt, expiresAt, isRecentlyUsed };
});
