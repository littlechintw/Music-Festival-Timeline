import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => {
    // 預設提醒時間：3 分鐘與 10 分鐘
    const defaultReminderTimes = [3, 10];
    let savedReminderTimes;
    try {
      const stored = localStorage.getItem('performanceReminderTimes');
      if (stored) {
        savedReminderTimes = JSON.parse(stored);
      } else {
        // Migration from old single integer performanceReminderTime
        const oldStored = localStorage.getItem('performanceReminderTime');
        const oldVal = parseInt(oldStored);
        if (!isNaN(oldVal) && oldVal > 0) {
            // Keep the old setting and always ensure 3 exists
            savedReminderTimes = Array.from(new Set([3, oldVal])).sort((a,b)=>a-b);
        } else {
           savedReminderTimes = defaultReminderTimes;
        }
      }
    } catch {
      savedReminderTimes = defaultReminderTimes;
    }

    return {
      is24Hour: localStorage.getItem('is24Hour') !== 'false', // default to true
      enableFestivalReminders: localStorage.getItem('enableFestivalReminders') !== 'false', // default true
      performanceReminderTimes: savedReminderTimes 
    };
  },
  actions: {
    toggle24Hour() {
      this.is24Hour = !this.is24Hour;
      localStorage.setItem('is24Hour', this.is24Hour);
    },
    set24Hour(val) {
      this.is24Hour = val;
      localStorage.setItem('is24Hour', val);
    },
    setEnableFestivalReminders(val) {
      this.enableFestivalReminders = val;
      localStorage.setItem('enableFestivalReminders', val);
    },
    setPerformanceReminderTimes(valArray) {
      // 確保排序由小到大並過濾重複
      const sortedUnique = Array.from(new Set(valArray)).sort((a, b) => a - b);
      this.performanceReminderTimes = sortedUnique;
      localStorage.setItem('performanceReminderTimes', JSON.stringify(sortedUnique));
    }
  }
});
