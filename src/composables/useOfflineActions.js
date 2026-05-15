// @ts-check
import { ref, onMounted } from 'vue';
import { downloadFestivalToCache, removeFestivalFromCache, loadLocalHashes } from './useFestivals';

/**
 * 提供 Settings 頁面操作離線快取的動作 + 用量估算。
 */
export function useOfflineActions() {
  const usage = ref(/** @type {{usage:number, quota:number} | null} */ (null));

  async function refreshUsage() {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
      usage.value = null;
      return;
    }
    try {
      const est = await navigator.storage.estimate();
      usage.value = {
        usage: est.usage ?? 0,
        quota: est.quota ?? 0,
      };
    } catch {
      usage.value = null;
    }
  }

  onMounted(refreshUsage);

  /** @param {import('./useFestivals').FestivalIndexEntry} entry */
  async function download(entry) {
    await downloadFestivalToCache(entry);
    await refreshUsage();
  }

  /** @param {import('./useFestivals').FestivalIndexEntry} entry */
  async function remove(entry) {
    await removeFestivalFromCache(entry);
    await refreshUsage();
  }

  function getCachedHashMap() {
    return loadLocalHashes();
  }

  return { usage, refreshUsage, download, remove, getCachedHashMap };
}

/**
 * @param {number | null | undefined} bytes
 */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIdx = 0;
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIdx]}`;
}
