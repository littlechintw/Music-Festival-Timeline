<template>
  <div>
    <nav class="w-full bg-gray-900 text-white px-4 py-2 flex gap-4 items-center">
      <router-link to="/" class="font-bold hover:underline">音樂祭列表</router-link>
      <router-link to="/plan" class="hover:underline">我的行程</router-link>
      <router-link to="/settings" class="hover:underline">設定</router-link>
  <router-link to="/editor" class="hover:underline">新增音樂祭</router-link>
    </nav>
    <router-view />

    <!-- 異動通知 Modal -->
    <div v-if="planStore.invalidShows && planStore.invalidShows.length > 0" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click="planStore.invalidShows = []">
      <div class="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center" @click.stop>
        <div class="text-4xl mb-4">⚠️</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">行程更新通知</h3>
        <p class="text-gray-600 mb-4 text-left leading-relaxed">
          音樂祭的時間表可能有更新，您原本排入的以下行程由於時間異動或已取消，將會自動從您的行程中移除：
        </p>
        <div class="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto mb-6 text-left border border-gray-200">
          <ul class="space-y-2">
            <li v-for="(perf, idx) in planStore.invalidShows" :key="idx" class="text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
              <div class="font-bold text-gray-800 text-base mb-1">{{ perf.artist }}</div>
              <div class="flex items-center text-gray-500 gap-2 mb-1">
                <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{{ perf.festivalName || '未知音樂祭' }}</span>
                <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{{ perf.stage }} 舞台</span>
              </div>
              <div class="text-gray-400 text-xs mt-1">原定時間: {{ formatInvalidShowTime(perf.start, perf.end) }}</div>
            </li>
          </ul>
        </div>
        <p class="text-sm text-red-500 mb-6 text-left">請記得重新前往列表，將您想看的演出重新加入行程。</p>
        <button @click="planStore.invalidShows = []" class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
          我知道了
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useFestivalStore } from './stores/festival';
import { usePlanStore } from './stores/plan';
import { startReminderService } from './utils/reminders';

const festivalStore = useFestivalStore();
const planStore = usePlanStore();

onMounted(async () => {
  await festivalStore.initializeFestivals();
  planStore.loadPlan();

  // Preload full festival data for any festival the user has in their plan
  // (needed for plan validation and the reminder service)
  const plannedFestivalIds = [...new Set((planStore.myPlan || []).map(p => p.festivalId))];
  await Promise.all(plannedFestivalIds.map(id => festivalStore.loadFestivalDetail(id)));

  planStore.validatePlan(festivalStore.getFestivals);

  // 啟動提醒服務
  startReminderService();
});

function formatInvalidShowTime(startStr, endStr) {
  if (!startStr) return '未知時間';
  const start = new Date(startStr);
  const startFormat = start.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) + ' ' + 
                      start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  if (!endStr) return startFormat;
  const end = new Date(endStr);
  const endFormat = end.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  return `${startFormat} - ${endFormat}`;
}
</script>

<style>
body { background: var(--theme-bg, #fff); }
</style>
