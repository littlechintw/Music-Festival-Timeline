
<template>
  <div class="p-4 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">設定</h1>
    <div class="mb-6">
      <h2 class="font-bold mb-2">通知權限</h2>
      <div class="flex items-center gap-2">
        <span>目前狀態：</span>
        <span :class="notifStatusClass">{{ notifStatusText }}</span>
        <button v-if="notifStatus !== 'granted'" @click="requestNotif" class="px-3 py-1 rounded bg-green-600 text-white">請求權限</button>
      </div>
    </div>
    <div class="mb-6">
      <h2 class="font-bold mb-2">本地資料</h2>
      <button @click="resetPlan" class="px-3 py-1 rounded bg-red-500 text-white">重設我的行程</button>
    </div>
    <div class="mb-6">
      <h2 class="font-bold mb-2">離線快取</h2>
      <button @click="clearCache" class="px-3 py-1 rounded bg-yellow-500 text-white">清除快取</button>
    </div>
  </div>
</template>

<script setup>

import { ref, computed } from 'vue';
import { usePlanStore } from '../stores/plan';

const planStore = usePlanStore();

const notifStatus = ref(Notification?.permission || 'default');
const notifStatusText = computed(() => {
  if (notifStatus.value === 'granted') return '已允許';
  if (notifStatus.value === 'denied') return '已拒絕';
  return '尚未取得通知權限';
});
const notifStatusClass = computed(() => {
  if (notifStatus.value === 'granted') return 'text-green-600';
  if (notifStatus.value === 'denied') return 'text-red-600';
  return 'text-gray-500';
});


async function requestNotif() {
  const res = await planStore.requestNotificationPermission();
  notifStatus.value = res;
}

function resetPlan() {
  if (confirm('確定要重設我的行程？')) {
    planStore.myPlan = [];
    planStore.savePlan();
    location.reload();
  }
}

async function clearCache() {
  if ('caches' in window) {
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }
    alert('快取已清除');
  }
}


</script>

<style scoped>
</style>
