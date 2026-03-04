<template>
  <div>
    <nav class="w-full bg-gray-900 text-white px-4 py-2 flex gap-4 items-center">
      <router-link to="/" class="font-bold hover:underline">音樂祭列表</router-link>
      <router-link to="/plan" class="hover:underline">我的行程</router-link>
      <router-link to="/settings" class="hover:underline">設定</router-link>
  <router-link to="/editor" class="hover:underline">新增音樂祭</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useFestivalStore } from './stores/festival';
import { startReminderService } from './utils/reminders';

const festivalStore = useFestivalStore();

onMounted(async () => {
  // 自動載入基本的音樂祭資料，這樣首頁外的地方也能通知
  if (!Array.isArray(festivalStore.getFestivals) || festivalStore.getFestivals.length === 0) {
    const files = import.meta.glob('../festivals/*.json');
    const loaded = [];
    for (const path in files) {
      try {
        const mod = await files[path]();
        loaded.push(mod.default);
      } catch (err) {}
    }
    festivalStore.festivals = loaded;
  }
  
  // 啟動提醒服務
  startReminderService();
});
</script>

<style>
body { background: var(--theme-bg, #fff); }
</style>
