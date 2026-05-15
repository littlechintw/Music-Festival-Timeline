<template>
  <transition name="slide">
    <div
      v-if="!isOnline"
      class="w-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border-b border-amber-300 dark:border-amber-700 px-4 py-2 pt-safe text-sm flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd"
        />
      </svg>
      <span>目前離線中 — 已快取的音樂祭資料、行程、地圖都還能用，分享網址功能會暫停。</span>
    </div>
  </transition>
</template>

<script setup>
import { useOnline } from '../composables/useOnline';

const { isOnline } = useOnline();
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
