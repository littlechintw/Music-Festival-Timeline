// @ts-check
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const DEFAULT_REMINDERS = [3, 10];

/**
 * @param {string} key
 * @param {string | null} fallback
 */
function read(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    return val === null ? fallback : val;
  } catch {
    return fallback;
  }
}

function loadReminderTimes() {
  try {
    const raw = read('performanceReminderTimes');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((n) => Number.isFinite(n))) return parsed;
    }
    // 從舊版單一整數欄位遷移
    const legacy = Number.parseInt(read('performanceReminderTime') ?? '', 10);
    if (Number.isFinite(legacy) && legacy > 0) {
      return Array.from(new Set([3, legacy])).sort((a, b) => a - b);
    }
  } catch {
    /* fall back to defaults */
  }
  return DEFAULT_REMINDERS;
}

export const useSettingsStore = defineStore('settings', () => {
  const is24Hour = ref(read('is24Hour') !== 'false');
  const enableFestivalReminders = ref(read('enableFestivalReminders') !== 'false');
  const enableAnalytics = ref(read('enableAnalytics') !== 'false');
  /** @type {import('vue').Ref<number[]>} */
  const performanceReminderTimes = ref(loadReminderTimes());

  watch(is24Hour, (v) => localStorage.setItem('is24Hour', String(v)));
  watch(enableFestivalReminders, (v) => localStorage.setItem('enableFestivalReminders', String(v)));
  watch(enableAnalytics, (v) => localStorage.setItem('enableAnalytics', String(v)));
  watch(
    performanceReminderTimes,
    (v) => {
      const sortedUnique = Array.from(new Set(v)).sort((a, b) => a - b);
      localStorage.setItem('performanceReminderTimes', JSON.stringify(sortedUnique));
    },
    { deep: true }
  );

  /** @param {boolean} val */
  function set24Hour(val) {
    is24Hour.value = val;
  }
  function toggle24Hour() {
    is24Hour.value = !is24Hour.value;
  }
  /** @param {boolean} val */
  function setEnableFestivalReminders(val) {
    enableFestivalReminders.value = val;
  }
  /** @param {boolean} val */
  function setEnableAnalytics(val) {
    enableAnalytics.value = val;
  }
  /** @param {number[]} valArray */
  function setPerformanceReminderTimes(valArray) {
    performanceReminderTimes.value = Array.from(new Set(valArray)).sort((a, b) => a - b);
  }

  return {
    is24Hour,
    enableFestivalReminders,
    enableAnalytics,
    performanceReminderTimes,
    set24Hour,
    toggle24Hour,
    setEnableFestivalReminders,
    setEnableAnalytics,
    setPerformanceReminderTimes,
  };
});
