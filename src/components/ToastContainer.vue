<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none"
    style="padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));"
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
      return 'bg-green-600 text-white';
    case 'error':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900';
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
