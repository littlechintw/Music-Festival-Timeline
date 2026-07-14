<template>
  <div
    v-if="nextEntry"
    class="relative rounded-xl p-4 mb-4 bg-[var(--md-sys-color-surface-container)] flex items-center gap-3"
    role="region"
    aria-label="下一場演出"
  >
    <md-elevation style="--md-elevation-level: 1"></md-elevation>
    <div
      class="shrink-0 flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[64px]"
      :class="onStageNow ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]' : 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'"
    >
      <div class="text-xs font-medium">{{ onStageNow ? '進行中' : '下一場' }}</div>
      <div class="text-lg font-bold leading-tight">{{ countdownLabel }}</div>
    </div>

    <div class="min-w-0 flex-1">
      <div class="font-bold text-gray-900 dark:text-gray-100 truncate">{{ nextEntry.artist }}</div>
      <div class="text-sm text-gray-600 dark:text-gray-300 truncate">
        {{ formatTime(nextEntry.start, is24Hour) }}<span v-if="nextEntry.end">
          - {{ formatTime(nextEntry.end, is24Hour) }}</span>
        ｜ {{ nextEntry.stage }}
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
        {{ nextEntry.festivalName }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatTime } from '../utils/format';

const props = defineProps({
  plan: { type: Array, required: true },
  now: { type: Date, required: true },
  is24Hour: { type: Boolean, default: true },
});

const nextEntry = computed(() => {
  const nowMs = props.now.getTime();
  // 優先：正在進行中的（start <= now <= end）
  for (const p of props.plan) {
    const s = new Date(p.start).getTime();
    const e = p.end ? new Date(p.end).getTime() : s + 30 * 60000;
    if (s <= nowMs && nowMs <= e) return p;
  }
  // 否則：最近一場未來演出
  const future = props.plan
    .filter((p) => new Date(p.start).getTime() > nowMs)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return future[0] || null;
});

const onStageNow = computed(() => {
  if (!nextEntry.value) return false;
  const nowMs = props.now.getTime();
  const s = new Date(nextEntry.value.start).getTime();
  const e = nextEntry.value.end
    ? new Date(nextEntry.value.end).getTime()
    : s + 30 * 60000;
  return s <= nowMs && nowMs <= e;
});

const countdownLabel = computed(() => {
  if (!nextEntry.value) return '';
  const nowMs = props.now.getTime();
  if (onStageNow.value) {
    const e = nextEntry.value.end
      ? new Date(nextEntry.value.end).getTime()
      : new Date(nextEntry.value.start).getTime() + 30 * 60000;
    const remainMin = Math.max(0, Math.round((e - nowMs) / 60000));
    return remainMin > 0 ? `${remainMin} 分` : '即將結束';
  }
  const s = new Date(nextEntry.value.start).getTime();
  const diffMin = Math.round((s - nowMs) / 60000);
  if (diffMin < 60) return `${diffMin} 分`;
  if (diffMin < 60 * 24) return `${Math.round(diffMin / 60)} 小時`;
  return `${Math.round(diffMin / (60 * 24))} 天`;
});
</script>
