// @ts-check
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const HISTORY_KEY = 'notification_history';
const SENT_KEY = 'sent_reminders';
const MAX_HISTORY = 100;

/**
 * @typedef {{ key: string, title: string, body: string, timestamp: number }} NotificationEntry
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

// 舊版曾經把「太久之前、故意跳過不推播」的內部標記也寫進使用者看得到的歷史紀錄
// （title 固定是 '[skipped]'）。這裡做一次性清理，把這些非真正通知的紀錄濾掉。
function pruneSkipped(list) {
  return Array.isArray(list) ? list.filter((entry) => entry?.title !== '[skipped]') : [];
}

export const useNotificationStore = defineStore('notifications', () => {
  /** @type {import('vue').Ref<NotificationEntry[]>} */
  const history = ref(pruneSkipped(readJson(HISTORY_KEY, '[]')));
  /** @type {import('vue').Ref<Set<string>>} */
  const sent = ref(new Set(readJson(SENT_KEY, '[]')));

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value));
  } catch {}

  watch(
    history,
    (v) => {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(v));
      } catch {}
    },
    { deep: true }
  );

  /**
   * @param {string} key
   */
  function hasSent(key) {
    return sent.value.has(key);
  }

  /**
   * 只標記「這個提醒已經處理過」，避免下次又被重新考慮——不會出現在使用者看得到的歷史紀錄裡。
   * 用在跳過過期提醒、或其他不該讓使用者看到的內部去重情境。
   * @param {string} key
   */
  function markSent(key) {
    sent.value.add(key);
    try {
      localStorage.setItem(SENT_KEY, JSON.stringify(Array.from(sent.value)));
    } catch {}
  }

  /**
   * 記錄一則「真的推播給使用者看」的通知，同時標記為已處理。
   * @param {string} key
   * @param {string} title
   * @param {string} body
   */
  function record(key, title, body) {
    markSent(key);
    const next = [{ key, title, body, timestamp: Date.now() }, ...history.value];
    history.value = next.slice(0, MAX_HISTORY);
  }

  function clearAll() {
    history.value = [];
    sent.value = new Set();
    try {
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(SENT_KEY);
    } catch {}
  }

  return { history, hasSent, markSent, record, clearAll };
});
