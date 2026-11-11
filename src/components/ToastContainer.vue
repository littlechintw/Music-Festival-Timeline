<template>
  <div
    class="fixed left-0 right-0 z-200 flex flex-col items-center gap-2 pointer-events-none bottom-nav-offset md:bottom-0 pb-4 md:pb-safe"
    aria-live="polite"
  >
    <transition-group name="toast" tag="div" class="flex flex-col gap-2 items-center w-full px-4">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto max-w-sm w-fit px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2"
        :class="classFor(toast.kind)"
        role="status"
      >
        <span v-if="toast.icon" aria-hidden="true">{{ toast.icon }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast';

const { toasts } = useToast();

function classFor(kind) {
  switch (kind) {
    case 'success':
      return 'bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary)';
    case 'error':
      return 'bg-(--md-sys-color-error) text-(--md-sys-color-on-error)';
    default:
      return 'bg-(--md-sys-color-inverse-surface) text-(--md-sys-color-inverse-on-surface)';
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
