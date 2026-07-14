<template>
  <BaseModal :model-value="isOpen" @update:model-value="dismiss">
    <template #headline>
      <div class="flex items-center gap-2">
        <MdIcon name="warning" class="text-[var(--md-sys-color-error)]" />
        行程更新通知
      </div>
    </template>

    <p class="text-gray-600 dark:text-gray-300 mb-4 text-left leading-relaxed">
      音樂祭的時間表可能有更新，您原本排入的以下行程由於時間異動或已取消，將會自動從您的行程中移除：
    </p>
    <div
      class="bg-[var(--md-sys-color-surface-container-low)] rounded-lg p-3 max-h-48 overflow-y-auto mb-6 text-left"
    >
      <ul class="space-y-2">
        <li
          v-for="(perf, idx) in invalidShows"
          :key="idx"
          class="text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0"
        >
          <div class="font-bold text-gray-800 dark:text-gray-100 text-base mb-1">
            {{ perf.artist }}
          </div>
          <div class="flex items-center text-gray-500 dark:text-gray-400 gap-2 mb-1">
            <span
              class="bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] px-2 py-0.5 rounded text-xs font-medium"
            >
              {{ perf.festivalName || '未知音樂祭' }}
            </span>
            <span
              class="bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] px-2 py-0.5 rounded text-xs"
            >
              {{ perf.stage }} 舞台
            </span>
          </div>
          <div class="text-gray-400 dark:text-gray-500 text-xs mt-1">
            原定時間: {{ formatRange(perf.start, perf.end) }}
          </div>
        </li>
      </ul>
    </div>
    <p class="text-sm text-[var(--md-sys-color-error)] text-left">
      請記得重新前往列表，將您想看的演出重新加入行程。
    </p>

    <template #actions>
      <md-filled-button type="button" @click="dismiss">我知道了</md-filled-button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';
import { formatTime } from '../utils/format';
import BaseModal from './BaseModal.vue';
import MdIcon from './MdIcon.vue';

const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const { invalidShows } = storeToRefs(planStore);

const isOpen = computed(() => invalidShows.value.length > 0);

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
