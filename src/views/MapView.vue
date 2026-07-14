<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">場地地圖</h1>
    <div v-if="!festival" class="text-gray-500 dark:text-gray-400">找不到音樂祭</div>
    <div v-else-if="!festival.map || !festival.map.image">
      <div class="text-gray-400 dark:text-gray-500">此音樂祭尚未提供地圖</div>
    </div>
    <div v-else>
      <div class="mb-4">
        <img
          :src="festival.map.image"
          alt="場地地圖"
          class="w-full max-w-md rounded border border-gray-200 dark:border-gray-700 bg-white"
          loading="lazy"
        />
      </div>
      <div class="mb-4 text-xs text-gray-500 dark:text-gray-400">
        地圖會由 Service Worker 自動快取，下次離線也能查看。
      </div>
      <md-outlined-button type="button" @click="clearMapCache">清除地圖快取</md-outlined-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useFestivalStore } from '../stores/festival';

const route = useRoute();
const festivalStore = useFestivalStore();
const festival = computed(() => festivalStore.getById(route.params.id));

async function clearMapCache() {
  if (!('caches' in window) || !festival.value?.map?.image) return;
  const url = festival.value.map.image;
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(async (name) => {
      const cache = await caches.open(name);
      await cache.delete(url);
    })
  );
  alert('地圖快取已清除');
}

onMounted(() => {
  festivalStore.ensureLoaded();
});
</script>
