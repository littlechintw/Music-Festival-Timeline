<template>
  <div
    v-if="invalidShows.length > 0"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="dismiss"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full text-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invalid-shows-title"
      @click.stop
    >
      <div class="text-4xl mb-4" aria-hidden="true">⚠️</div>
      <h3 id="invalid-shows-title" class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        行程更新通知
      </h3>
      <p class="text-gray-600 dark:text-gray-300 mb-4 text-left leading-relaxed">
        音樂祭的時間表可能有更新，您原本排入的以下行程由於時間異動或已取消，將會自動從您的行程中移除：
      </p>
      <div
        class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 max-h-48 overflow-y-auto mb-6 text-left border border-gray-200 dark:border-gray-700"
      >
        <ul class="space-y-2">
          <li
            v-for="(perf, idx) in invalidShows"
            :key="idx"
            class="text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0"
          >
            <div class="font-bold text-gray-800 dark:text-gray-100 text-base mb-1">{{ perf.artist }}</div>
            <div class="flex items-center text-gray-500 dark:text-gray-400 gap-2 mb-1">
              <span class="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded text-xs font-medium">
                {{ perf.festivalName || '未知音樂祭' }}
              </span>
              <span class="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded text-xs">
                {{ perf.stage }} 舞台
              </span>
            </div>
            <div class="text-gray-400 dark:text-gray-500 text-xs mt-1">
              原定時間: {{ formatRange(perf.start, perf.end) }}
            </div>
          </li>
        </ul>
      </div>
      <p class="text-sm text-red-500 dark:text-red-400 mb-6 text-left">
        請記得重新前往列表，將您想看的演出重新加入行程。
      </p>
      <button
        class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
        @click="dismiss"
      >
        我知道了
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';
import { useEscapeKey } from '../composables/useEscapeKey';
import { formatTime } from '../utils/format';

const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const { invalidShows } = storeToRefs(planStore);

const isOpen = computed(() => invalidShows.value.length > 0);
useEscapeKey(isOpen, () => planStore.dismissInvalidShows());

function formatRange(start, end) {
  const startStr = new Date(start).toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
  });
  const startTime = formatTime(start, settingsStore.is24Hour);
  if (!end) return `${startStr} ${startTime}`;
  return `${startStr} ${startTime} - ${formatTime(end, settingsStore.is24Hour)}`;
}

function dismiss() {
  planStore.dismissInvalidShows();
}
</script>
