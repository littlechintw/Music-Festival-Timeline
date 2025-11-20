import { defineStore } from 'pinia';


const STORAGE_KEY = 'my-festival-plan';
const SCHEMA_VERSION = 1;
const META_KEY = 'my-festival-meta';

export const usePlanStore = defineStore('plan', {
  state: () => ({
    myPlan: [],
    notifications: {},
    lastOpenedFestival: null,
    schemaVersion: SCHEMA_VERSION,
    themeOverride: localStorage.getItem('theme-override') || null,
  }),
  actions: {
    addPerformance(perf) {
      this.myPlan.push(perf);
      this.savePlan();
    },
    removePerformance(perfId) {
      this.myPlan = this.myPlan.filter(p => (p.id || p.artist + p.start) !== perfId);
      this.savePlan();
    },
    setNotification(perfId, minutes) {
      this.notifications[perfId] = minutes;
      this.saveMeta();
    },

    async requestNotificationPermission() {
      if (!('Notification' in window)) return 'unsupported';
      if (Notification.permission === 'granted') return 'granted';
      if (Notification.permission === 'denied') return 'denied';
      return await Notification.requestPermission();
    },

    async sendNotification({ title, body, tag }) {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      try {
        new Notification(title, { body, tag });
      } catch {}
    },
    setLastOpenedFestival(festivalId) {
      this.lastOpenedFestival = festivalId;
      this.saveMeta();
    },
    setThemeOverride(color) {
      this.themeOverride = color;
      localStorage.setItem('theme-override', color);
      this.saveMeta();
    },
    savePlan() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.myPlan));
    },
    saveMeta() {
      const meta = {
        notifications: this.notifications,
        lastOpenedFestival: this.lastOpenedFestival,
        schemaVersion: SCHEMA_VERSION,
        themeOverride: this.themeOverride,
      };
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    },
    loadPlan() {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        try {
          this.myPlan = JSON.parse(data);
        } catch {}
      }
      // Load meta
      const meta = localStorage.getItem(META_KEY);
      if (meta) {
        try {
          const m = JSON.parse(meta);
          this.notifications = m.notifications || {};
          this.lastOpenedFestival = m.lastOpenedFestival || null;
          this.themeOverride = m.themeOverride || null;
          this.schemaVersion = m.schemaVersion || 1;
        } catch {}
      }
      // Migration logic (future-proof)
      if (this.schemaVersion < SCHEMA_VERSION) {
        // Example: migrate old data here
        this.schemaVersion = SCHEMA_VERSION;
        this.saveMeta();
      }
    },
  },
});