<template>
  <div class="p-4 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">音樂祭列表</h1>
    <input
      v-model="search"
      placeholder="搜尋名稱或地址"
      class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2 mb-4 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <div class="mb-4 flex gap-2">
      <button :class="btnClass('date')" @click="sortBy = 'date'">依日期排序</button>
      <button :class="btnClass('name')" @click="sortBy = 'name'">依名稱排序</button>
    </div>

    <div
      v-if="festivalStore.loading && festivalStore.getFestivals.length === 0"
      class="text-gray-500 dark:text-gray-400"
    >
      載入中...
    </div>
    <div v-else>
      <div
        v-for="festival in filteredFestivals"
        :key="festival.festivalId"
        class="border border-gray-200 dark:border-gray-700 rounded p-4 mb-4 cursor-pointer transition-colors"
        :class="
          festival.isFar
            ? 'opacity-60 bg-gray-100 dark:bg-gray-800/50 grayscale hover:bg-gray-200 dark:hover:bg-gray-800'
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/60'
        "
        @click="goDetail(festival.festivalId)"
      >
        <div class="font-bold text-lg text-gray-900 dark:text-gray-100">{{ festival.name }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ formatDateTime(festival.startTime, settingsStore.is24Hour) }} ~
          {{ formatDateTime(festival.endTime, settingsStore.is24Hour) }}
        </div>
        <div class="text-sm text-gray-700 dark:text-gray-300">
          {{ festival.location.name }}｜{{ festival.location.address }}
        </div>
      </div>
      <div
        v-if="filteredFestivals.length === 0"
        class="text-gray-400 dark:text-gray-500"
      >
        查無資料
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { useSettingsStore } from '../stores/settings';
import { formatDateTime } from '../utils/format';

const festivalStore = useFestivalStore();
const settingsStore = useSettingsStore();
const router = useRouter();

const search = ref('');
const sortBy = ref('date');

function btnClass(type) {
  return [
    'px-3 py-1 rounded border transition-colors',
    sortBy.value === type
      ? 'bg-blue-600 text-white border-blue-600'
      : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700',
  ].join(' ');
}

function goDetail(id) {
  router.push({ name: 'FestivalDetail', params: { id } });
}

const filteredFestivals = computed(() => {
  const now = Date.now();
  const thirtyDays = 30 * 86400000;
  let arr = (festivalStore.getFestivals || []).map((f) => {
    const start = new Date(f.startTime).getTime();
    const end = new Date(f.endTime).getTime();
    return { ...f, isFar: end < now || start - now > thirtyDays };
  });

  if (search.value) {
    const q = search.value.toLowerCase();
    arr = arr.filter(
      (f) => f.name.toLowerCase().includes(q) || f.location.address.toLowerCase().includes(q)
    );
  }

  arr.sort((a, b) => {
    if (a.isFar !== b.isFar) return a.isFar ? 1 : -1;
    if (sortBy.value === 'name') return a.name.localeCompare(b.name, 'zh-Hant');
    return Math.abs(new Date(a.startTime).getTime() - now) - Math.abs(new Date(b.startTime).getTime() - now);
  });
  return arr;
});

onMounted(() => {
  festivalStore.ensureLoaded();
});
</script>
