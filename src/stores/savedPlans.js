// @ts-check
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'saved-shared-plans-v1';

/** @typedef {import('./plan').PlanEntry} PlanEntry */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   festivalId: string,
 *   festivalName: string,
 *   performances: PlanEntry[],
 *   savedAt: string,
 * }} SavedPlan
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

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 收到朋友分享的行程時，除了「取代目前行程」，也可以另存成一份獨立命名的行程，
// 之後在「我的行程」頁面查看、套用或刪除。這些資料只存在這台裝置的 localStorage，不會同步。
export const useSavedPlansStore = defineStore('savedPlans', () => {
  /** @type {import('vue').Ref<SavedPlan[]>} */
  const savedPlans = ref([]);
  const loaded = ref(false);

  function loadFromStorage() {
    savedPlans.value = readJson(STORAGE_KEY, '[]');
    loaded.value = true;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlans.value));
    } catch {}
  }

  watch(savedPlans, () => loaded.value && persist(), { deep: true });

  /**
   * @param {{ name: string, festivalId: string, festivalName: string, performances: PlanEntry[] }} input
   * @returns {SavedPlan}
   */
  function addSavedPlan(input) {
    /** @type {SavedPlan} */
    const entry = {
      id: makeId(),
      name: input.name,
      festivalId: input.festivalId,
      festivalName: input.festivalName,
      performances: input.performances,
      savedAt: new Date().toISOString(),
    };
    // 新的放最前面，最近儲存的排在最上面。
    savedPlans.value = [entry, ...savedPlans.value];
    return entry;
  }

  /** @param {string} id */
  function removeSavedPlan(id) {
    savedPlans.value = savedPlans.value.filter((p) => p.id !== id);
  }

  return {
    savedPlans,
    loaded,
    loadFromStorage,
    addSavedPlan,
    removeSavedPlan,
  };
});
