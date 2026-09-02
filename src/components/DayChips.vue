<template>
  <!-- 多日活動的日期切換。單日活動不顯示，省下一行空間。 -->
  <div
    v-if="days.length > 1"
    class="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
    role="group"
    aria-label="選擇日期"
  >
    <button
      v-for="day in days"
      :key="day.key"
      type="button"
      :aria-pressed="modelValue === day.key"
      class="relative px-4 py-2 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors font-medium flex items-center gap-2 overflow-hidden"
      :class="
        modelValue === day.key
          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
          : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]'
      "
      @click="$emit('update:modelValue', day.key)"
    >
      <md-ripple></md-ripple>
      <span>{{ day.label }}</span>
      <span
        v-if="day.count != null"
        class="inline-flex items-center justify-center text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full"
        :class="
          modelValue === day.key
            ? 'bg-[var(--md-sys-color-on-primary)] text-[var(--md-sys-color-primary)]'
            : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]'
        "
      >
        {{ day.count }}
      </span>
      <span
        v-if="day.isToday"
        class="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-error)]"
        aria-label="今天"
      />
    </button>
  </div>
</template>

<script setup>
defineProps({
  // [{ key, label, count?, isToday? }]
  days: { type: Array, required: true },
  modelValue: { type: String, default: '' },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
