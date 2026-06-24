// @ts-check
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import {
  requestNotificationPermission as requestPermission,
  showAppNotification,
} from '../pwa/notifications';

const STORAGE_KEY = 'my-festival-plan';
const META_KEY = 'my-festival-meta';
const SCHEMA_VERSION = 1;

/**
 * @typedef {{
 *   id?: string,
 *   artist: string,
 *   start: string,
 *   end?: string,
 *   stage: string,
 *   festivalId: string,
 *   festivalName?: string,
 *   description?: string,
 * }} PlanEntry
 */

/**
 * @param {string} key
 * @param {string} fallback
 */
function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? fallback);
  } catch {
    return JSON.parse(fallback);
  }
}

export const usePlanStore = defineStore('plan', () => {
  /** @type {import('vue').Ref<PlanEntry[]>} */
  const myPlan = ref([]);
  /** @type {import('vue').Ref<PlanEntry[]>} */
  const invalidShows = ref([]);
  const schemaVersion = ref(SCHEMA_VERSION);
  const loaded = ref(false);

  function loadFromStorage() {
    myPlan.value = readJson(STORAGE_KEY, '[]');
    const meta = readJson(META_KEY, '{}');
    schemaVersion.value = meta.schemaVersion || 1;
    if (schemaVersion.value < SCHEMA_VERSION) {
      // 未來資料結構升級的 migration 點
      schemaVersion.value = SCHEMA_VERSION;
      persistMeta();
    }
    loaded.value = true;
  }

  function persistPlan() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(myPlan.value));
    } catch {}
  }

  function persistMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION }));
    } catch {}
  }

  watch(myPlan, () => loaded.value && persistPlan(), { deep: true });

  /** @param {PlanEntry} perf */
  function addPerformance(perf) {
    const id = perf.id;
    const exists = id ? myPlan.value.some((p) => p.id === id) : false;
    if (!exists) myPlan.value.push(perf);
  }

  /** @param {string} perfId */
  function removePerformance(perfId) {
    myPlan.value = myPlan.value.filter((p) => (p.id || `${p.artist}_${p.start}`) !== perfId);
  }

  function clearPlan() {
    myPlan.value = [];
  }

  /**
   * 整個取代計畫（分享匯入用），去重以避免和現有資料衝突。
   * @param {PlanEntry[]} next
   */
  function replacePlan(next) {
    const seen = new Set();
    const deduped = [];
    for (const p of next) {
      const id = p.id || `${p.festivalId}_${p.stage}_${p.artist}_${p.start}`;
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push({ ...p, id });
    }
    myPlan.value = deduped;
  }

  function dismissInvalidShows() {
    invalidShows.value = [];
  }

  // 通知功能委派給 pwa/notifications.js
  const requestNotificationPermission = requestPermission;

  /** @param {{title: string, body: string, tag: string, data?: Record<string, unknown>}} payload */
  async function sendNotification(payload) {
    return showAppNotification(payload);
  }

  /**
   * 比對 plan 是否與最新 festival 資料一致；不一致的搬到 invalidShows。
   *
   * @param {import('../pwa/schema').Festival[]} festivals
   */
  function validatePlan(festivals) {
    if (!festivals?.length) return;

    const invalid = [];
    const validPlan = [];

    for (const perf of myPlan.value) {
      const fest = festivals.find((f) => f.festivalId === perf.festivalId);
      if (!fest) {
        // 沒這個 festival 的資料就先留著（可能是還沒 sync）
        validPlan.push(perf);
        continue;
      }
      const stage = fest.stages.find((s) => s.name === perf.stage);
      if (!stage) {
        invalid.push(perf);
        continue;
      }
      const originalStart = new Date(perf.start).getTime();
      // 同名藝人可能跨天／多場（D1、D2），必須用「藝人 + 開始時間」鎖定那一場，
      // 否則只比對名稱會永遠對到第一場，害另一場每次都被誤判為時間異動。
      const match = stage.performances.find(
        (p) => p.artist === perf.artist && new Date(p.start).getTime() === originalStart
      );
      if (!match) {
        // 找不到同名同時間的場次：可能被刪除或時間已異動
        invalid.push(perf);
        continue;
      }
      if (perf.end) {
        const matchEnd = new Date(match.end).getTime();
        const originalEnd = new Date(perf.end).getTime();
        if (Number.isFinite(matchEnd) && Number.isFinite(originalEnd) && matchEnd !== originalEnd) {
          invalid.push(perf);
          continue;
        }
      }
      validPlan.push(perf);
    }

    if (invalid.length > 0) {
      myPlan.value = validPlan;
      invalidShows.value = invalid;
    }
  }

  const planCount = computed(() => myPlan.value.length);

  return {
    myPlan,
    invalidShows,
    schemaVersion,
    loaded,
    planCount,
    loadFromStorage,
    addPerformance,
    removePerformance,
    clearPlan,
    replacePlan,
    dismissInvalidShows,
    requestNotificationPermission,
    sendNotification,
    validatePlan,
  };
});
