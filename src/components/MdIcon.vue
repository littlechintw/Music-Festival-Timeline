<template>
  <!-- eslint-disable-next-line vue/no-v-html -- svg 內容來自建置期的 npm 套件，非使用者輸入 -->
  <md-icon aria-hidden="true" v-html="svg" />
</template>

<script setup>
import { computed } from 'vue';
import { icons } from '../utils/icons';

const props = defineProps({
  name: { type: String, required: true },
});

const svg = computed(() => icons[props.name] || '');
</script>
