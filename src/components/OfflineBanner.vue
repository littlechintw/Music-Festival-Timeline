<template>
  <transition name="slide">
    <div
      v-if="!isOnline"
      class="w-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] px-4 py-2 pt-safe text-sm flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <MdIcon name="wifi_off" class="shrink-0" style="--md-icon-size: 18px" />
      <span>目前離線中 — 已快取的音樂祭資料、行程、地圖都還能用，分享網址功能會暫停。</span>
    </div>
  </transition>
</template>

<script setup>
import { useOnline } from '../composables/useOnline';
import MdIcon from './MdIcon.vue';

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
