<template>
  <div class="p-4 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">音樂祭列表</h1>
    <input v-model="search" placeholder="搜尋名稱或地址" class="border p-2 mb-4 w-full rounded" />
    <div class="mb-4 flex gap-2">
      <button @click="sortBy = 'date'" :class="btnClass('date')">依日期排序</button>
      <button @click="sortBy = 'name'" :class="btnClass('name')">依名稱排序</button>
    </div>
    <div v-if="loading">載入中...</div>
    <div v-else>
      <div v-for="festival in filteredFestivals" :key="festival.eventid"
        class="border rounded p-4 mb-4 cursor-pointer transition-colors"
        :class="festival.isFar ? 'opacity-50 bg-gray-100 grayscale hover:bg-gray-200' : 'hover:bg-gray-50'"
        @click="goDetail(festival.eventid)">
        <div class="flex items-center gap-2 mb-1">
          <div class="font-bold text-lg">{{ festival.name }}</div>
          <span v-if="store.isAvailableOffline(festival.eventid)"
            class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">離線可用</span>
        </div>
        <div class="text-sm text-gray-500">{{ formatDate(festival.startTime) }} ~ {{ formatDate(festival.endTime) }}
        </div>
        <div class="text-sm">{{ festival.location.name }}｜{{ festival.location.address }}</div>
      </div>
      <div v-if="filteredFestivals.length === 0" class="text-gray-400">查無資料</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFestivalStore } from '../stores/festival';
import { useSettingsStore } from '../stores/settings';
import { useRouter } from 'vue-router';

const store = useFestivalStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const search = ref('');
const sortBy = ref('date');

const loading = computed(() => store.loading && store.festivalIndex.length === 0);

function formatDate(str) {
  return new Date(str).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short', hour12: !settingsStore.is24Hour });
}

function btnClass(type) {
  return [
    'px-3 py-1 rounded border',
    sortBy.value === type ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600',
  ].join(' ');
}

function goDetail(id) {
  router.push({ name: 'FestivalDetail', params: { id } });
}

const filteredFestivals = computed(() => {
  let arr = store.getFestivalIndex || [];
  const now = new Date();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  arr = arr.map(f => {
    const startTime = new Date(f.startTime);
    const endTime = f.endTime ? new Date(f.endTime) : startTime;
    const isFar = endTime < now || (startTime - now) > thirtyDays;
    return { ...f, isFar };
  });

  if (search.value) {
    const s = search.value.toLowerCase();
    arr = arr.filter(f =>
      f.name.toLowerCase().includes(s) ||
      f.location.address.toLowerCase().includes(s)
    );
  }

  arr = arr.slice().sort((a, b) => {
    if (a.isFar !== b.isFar) {
      return a.isFar ? 1 : -1;
    }
    const aStart = new Date(a.startTime);
    const bStart = new Date(b.startTime);
    if (sortBy.value === 'date') {
      return Math.abs(aStart - now) - Math.abs(bStart - now);
    } else if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name, 'zh-Hant');
    }
    return 0;
  });

  return arr;
});
</script>

<style scoped>
/* Add any custom styles here */
</style>

