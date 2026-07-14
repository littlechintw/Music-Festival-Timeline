<template>
  <BaseModal :model-value="!!request" @update:model-value="resolve(false)">
    <template v-if="request" #headline>{{ request.title }}</template>
    <p v-if="request" class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
      {{ request.message }}
    </p>
    <template v-if="request" #actions>
      <md-text-button type="button" @click="resolve(false)">
        {{ request.cancelLabel }}
      </md-text-button>
      <md-filled-button
        type="button"
        :style="
          request.danger
            ? '--md-sys-color-primary: var(--md-sys-color-error); --md-sys-color-on-primary: var(--md-sys-color-on-error);'
            : ''
        "
        @click="resolve(true)"
      >
        {{ request.confirmLabel }}
      </md-filled-button>
    </template>
  </BaseModal>
</template>

<script setup>
import { useConfirm } from '../composables/useConfirm';
import BaseModal from './BaseModal.vue';

const { request, resolve } = useConfirm();
</script>
