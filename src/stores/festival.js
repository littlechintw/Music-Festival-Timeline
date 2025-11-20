import { defineStore } from 'pinia';

export const useFestivalStore = defineStore('festival', {
  state: () => ({
    festivals: [],
    selectedFestival: null,
    loading: false,
  }),
  getters: {
    getFestivals: (state) => state.festivals || [],
  },
  actions: {
    async loadFestivals() {
      this.loading = true;
      // TODO: fetch from /festivals/ or remote branch
      this.loading = false;
    },
    selectFestival(id) {
      this.selectedFestival = this.festivals.find(f => f.festivalId === id) || null;
    },
  },
});