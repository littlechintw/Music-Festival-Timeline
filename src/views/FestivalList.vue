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
      <div v-for="festival in filteredFestivals" :key="festival.festivalId" class="border rounded p-4 mb-4 hover:bg-gray-50 cursor-pointer" @click="goDetail(festival.festivalId)">
        <div class="flex items-center gap-4">
          <img v-if="festival.logo" :src="festival.logo" alt="logo" class="w-16 h-16 object-contain rounded" />
          <div>
            <div class="font-bold text-lg">{{ festival.name }}</div>
            <div class="text-sm text-gray-500">{{ formatDate(festival.startTime) }} ~ {{ formatDate(festival.endTime) }}</div>
            <div class="text-sm">{{ festival.location.name }}｜{{ festival.location.address }}</div>
          </div>
        </div>
      </div>
      <div v-if="filteredFestivals.length === 0" class="text-gray-400">查無資料</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFestivalStore } from '../stores/festival';
import { useRouter } from 'vue-router';

const store = useFestivalStore();
const router = useRouter();
const search = ref('');
const sortBy = ref('date');
const loading = ref(false);

function formatDate(str) {
  return new Date(str).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' });
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
  let arr = store.getFestivals || [];
  if (search.value) {
    const s = search.value.toLowerCase();
    arr = arr.filter(f =>
      f.name.toLowerCase().includes(s) ||
      f.location.address.toLowerCase().includes(s)
    );
  }
  if (sortBy.value === 'date') {
    arr = arr.slice().sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  } else if (sortBy.value === 'name') {
    arr = arr.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
  }
  return arr;
});

onMounted(async () => {
  if (!Array.isArray(store.getFestivals) || store.getFestivals.length === 0) {
    loading.value = true;
    // Dynamically import all JSON files in /festivals
    const files = import.meta.glob('../../festivals/*.json');
    const loaded = [];
    for (const path in files) {
      try {
        const mod = await files[path]();
        loaded.push(mod.default);
      } catch (e) {}
    }
    store.$patch({ festivals: loaded });
    loading.value = false;
  }
});
</script>

<style scoped>
/* Add any custom styles here */
</style>
