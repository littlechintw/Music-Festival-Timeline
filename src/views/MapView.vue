<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">場地地圖</h1>
    <div v-if="!festival">找不到音樂祭</div>
    <div v-else-if="!festival.map || !festival.map.image">
      <div class="text-gray-400">此音樂祭尚未提供地圖</div>
    </div>
    <div v-else>
      <div class="mb-4">
        <img :src="festival.map.image" alt="map" class="w-full max-w-md rounded border" @load="cacheImage" />
      </div>
      <div class="mb-4 text-xs text-gray-500">地圖將自動快取以支援離線瀏覽。</div>
      <button @click="clearMapCache" class="px-3 py-1 rounded bg-yellow-500 text-white">清除地圖快取</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useFestivalStore } from '../stores/festival';

const route = useRoute();
const store = useFestivalStore();
const festival = computed(() => {
  const id = route.params.id;
  return (store.getFestivals || []).find(f => f.festivalId === id);
});

async function cacheImage(e) {
  // 觸發 Service Worker 快取
  if ('serviceWorker' in navigator && festival.value?.map?.image) {
    try {
      await fetch(festival.value.map.image, { cache: 'reload' });
    } catch {}
  }
}

async function clearMapCache() {
  if ('caches' in window && festival.value?.map?.image) {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      await cache.delete(festival.value.map.image);
    }
    alert('地圖快取已清除');
  }
}
</script>

<style scoped>
</style>
