<template>
  <md-dialog :open="modelValue" @closed="handleClosed">
    <div v-if="$slots.headline" slot="headline">
      <slot name="headline" />
    </div>
    <div slot="content">
      <slot />
    </div>
    <div v-if="$slots.actions" slot="actions">
      <slot name="actions" />
    </div>
  </md-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

// md-dialog 內建 focus trap、ESC 關閉、點背景關閉，
// 關閉時（不管是被哪種方式觸發）統一透過這個事件同步回 v-model。
function handleClosed() {
  emit('update:modelValue', false);
}
</script>
