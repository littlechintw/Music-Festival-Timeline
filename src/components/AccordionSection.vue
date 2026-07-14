<template>
  <section class="border-b border-gray-200 dark:border-gray-700">
    <button
      type="button"
      class="w-full flex items-center justify-between py-4 text-left"
      :aria-expanded="open"
      :aria-controls="contentId"
      @click="toggle"
    >
      <span class="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <slot name="icon" />
        {{ title }}
      </span>
      <span
        class="text-gray-400 dark:text-gray-500 transition-transform"
        :class="open ? 'rotate-180' : ''"
      >
        <MdIcon name="keyboard_arrow_down" />
      </span>
    </button>
    <div
      v-show="open"
      :id="contentId"
      class="pb-5"
    >
      <slot />
    </div>
  </section>
</template>

<script setup>
import { ref, useId } from 'vue';
import MdIcon from './MdIcon.vue';

const props = defineProps({
  title: { type: String, required: true },
  defaultOpen: { type: Boolean, default: false },
});

const open = ref(props.defaultOpen);
const contentId = `acc-${useId()}`;

function toggle() {
  open.value = !open.value;
}
</script>
