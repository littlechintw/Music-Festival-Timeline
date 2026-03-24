import { defineStore } from 'pinia';
import {
  getStoredFestivalIndex,
  setStoredFestivalIndex,
  getOfflineHash,
  getOfflineFestival,
  setOfflineFestival,
  deleteOfflineFestival,
} from '../utils/offlineStorage';

export const useFestivalStore = defineStore('festival', {
  state: () => ({
    /** Basic info list from festival-index.json: [{ eventid, name, startTime, endTime, location, theme, filename, filehash }] */
    festivalIndex: [],
    /** Full festival data loaded on demand, keyed by eventid */
    festivals: {},
    selectedFestival: null,
    loading: false,
    /** Whether app is currently online */
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    /** Whether the currently displayed data comes from offline cache */
    usingOfflineData: false,
  }),

  getters: {
    /** Returns the list of festival index entries (basic info) */
    getFestivalIndex: (state) => state.festivalIndex,
    /** Returns all fully-loaded festival objects as an array */
    getFestivals: (state) => Object.values(state.festivals),
    /** Check whether a festival has been explicitly saved for offline use */
    isAvailableOffline: (state) => (id) => {
      const entry = state.festivalIndex.find(e => e.eventid === id);
      if (!entry) return false;
      const storedHash = getOfflineHash(id);
      return storedHash === entry.filehash;
    },
  },

  actions: {
    /** Called once at app startup. Loads the festival index and decides whether we are online/offline. */
    async initializeFestivals() {
      this.loading = true;
      this.isOnline = navigator.onLine;

      if (this.isOnline) {
        try {
          const res = await fetch('/festival-index.json', { cache: 'no-cache' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const freshIndex = await res.json();
          this.festivalIndex = freshIndex;
          setStoredFestivalIndex(freshIndex);
          this.usingOfflineData = false;
        } catch {
          // Network fetch failed — fall back to stored index
          const stored = getStoredFestivalIndex();
          if (stored) {
            this.festivalIndex = stored;
            this.usingOfflineData = true;
          }
        }
      } else {
        // Offline: use cached index
        const stored = getStoredFestivalIndex();
        if (stored) {
          this.festivalIndex = stored;
        }
        this.usingOfflineData = true;
      }

      // Keep track of online/offline changes at runtime
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.isOnline = true;
          this.initializeFestivals();
        });
        window.addEventListener('offline', () => {
          this.isOnline = false;
          this.usingOfflineData = true;
        });
      }

      this.loading = false;
    },

    /**
     * Load full festival data for a single festival by id.
     * Uses offline copy if hash matches; otherwise fetches from network.
     * Returns the festival object or null.
     */
    async loadFestivalDetail(id) {
      // Already in memory
      if (this.festivals[id]) return this.festivals[id];

      const entry = this.festivalIndex.find(e => e.eventid === id);

      // Try offline copy first if hash matches
      if (entry) {
        const storedHash = getOfflineHash(id);
        if (storedHash === entry.filehash) {
          const cached = getOfflineFestival(id);
          if (cached) {
            this.festivals[id] = cached;
            return cached;
          }
        }
      }

      // Fetch from network
      const filename = entry?.filename || `${id}.json`;
      try {
        const res = await fetch(`/festivals/${filename}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.festivals[id] = data;
        return data;
      } catch {
        // If network fails, try offline copy regardless of hash
        const cached = getOfflineFestival(id);
        if (cached) {
          this.festivals[id] = cached;
          this.usingOfflineData = true;
          return cached;
        }
        return null;
      }
    },

    /** Explicitly download and save a festival for offline use. */
    async downloadFestivalOffline(id) {
      const entry = this.festivalIndex.find(e => e.eventid === id);
      const filename = entry?.filename || `${id}.json`;
      const res = await fetch(`/festivals/${filename}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Attach filehash so we can compare later
      data._filehash = entry?.filehash || '';
      setOfflineFestival(id, data);
      this.festivals[id] = data;
    },

    /** Remove offline data for a festival. */
    deleteFestivalOffline(id) {
      deleteOfflineFestival(id);
    },

    /** Select a festival by id (sets selectedFestival). */
    selectFestival(id) {
      this.selectedFestival = this.festivals[id] || null;
    },
  },
});
