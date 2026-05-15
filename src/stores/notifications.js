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

export const useNotificationStore = defineStore('notifications', () => {
  /** @type {import('vue').Ref<NotificationEntry[]>} */
  const history = ref(readJson(HISTORY_KEY, '[]'));
  /** @type {import('vue').Ref<Set<string>>} */
  const sent = ref(new Set(readJson(SENT_KEY, '[]')));

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
   * @param {string} key
   * @param {string} title
   * @param {string} body
   */
  function record(key, title, body) {
    sent.value.add(key);
    try {
      localStorage.setItem(SENT_KEY, JSON.stringify(Array.from(sent.value)));
    } catch {}

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

  return { history, hasSent, record, clearAll };
});
