// @ts-check
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

const MODE_KEY = 'offline_mode';
const PINNED_KEY = 'offline_pinned';

/** @typedef {'auto' | 'manual'} OfflineMode */

function readMode() {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return v === 'manual' ? 'manual' : 'auto';
  } catch {
    return 'auto';
  }
}

function readPinned() {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export const useOfflineStore = defineStore('offline', () => {
  /** @type {import('vue').Ref<OfflineMode>} */
  const mode = ref(readMode());
  /** @type {import('vue').Ref<Set<string>>} */
  const pinned = ref(readPinned());

  watch(mode, (v) => {
    try {
      localStorage.setItem(MODE_KEY, v);
    } catch {}
  });

  watch(
    pinned,
    (v) => {
      try {
        localStorage.setItem(PINNED_KEY, JSON.stringify([...v]));
      } catch {}
    },
    { deep: true }
  );

  const pinnedList = computed(() => [...pinned.value]);

  /** @param {string} id */
  function pin(id) {
    pinned.value.add(id);
    // 觸發 deep watcher（Set 內部變動 Vue 偵測不到）
    pinned.value = new Set(pinned.value);
  }

  /** @param {string} id */
  function unpin(id) {
    pinned.value.delete(id);
    pinned.value = new Set(pinned.value);
  }

  /** @param {OfflineMode} m */
  function setMode(m) {
    mode.value = m;
  }

  /** @param {string} id */
  function isPinned(id) {
    return pinned.value.has(id);
  }

  return { mode, pinned, pinnedList, pin, unpin, setMode, isPinned };
});
