<template>
  <span
    class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
    :class="toneClass"
  >
    <span v-if="tone === 'live'" class="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden="true" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  // live: 進行中；soon: 一週內；upcoming: 更遠的未來；past: 已結束
  tone: { type: String, default: 'upcoming' },
});

const toneClass = computed(() => {
  switch (props.tone) {
    case 'live':
      return 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]';
    case 'soon':
      return 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]';
    case 'past':
      return 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]';
    default:
      return 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]';
  }
});
</script>
