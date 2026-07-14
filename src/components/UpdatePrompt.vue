<template>
  <div
    v-if="needsRefresh"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] rounded-lg px-4 py-3 flex items-center gap-3 max-w-[90vw]"
  >
    <md-elevation style="--md-elevation-level: 3"></md-elevation>
    <span>有新版本可用</span>
    <md-text-button
      type="button"
      style="--md-sys-color-primary: var(--md-sys-color-inverse-primary)"
      @click="refresh"
    >
      立即更新
    </md-text-button>
    <md-text-button
      type="button"
      style="--md-sys-color-primary: var(--md-sys-color-inverse-on-surface); opacity: 0.7"
      @click="dismiss"
    >
      稍後
    </md-text-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { registerPwa } from '../pwa/registerSW';
import { useToast } from '../composables/useToast';

const needsRefresh = ref(false);
let updateSW = null;
const { showToast } = useToast();

onMounted(() => {
  updateSW = registerPwa({
    onNeedRefresh() {
      needsRefresh.value = true;
    },
    onOfflineReady() {
      showToast({
        message: '離線就緒：現場沒網路也能查行程',
        kind: 'success',
        icon: '📡',
        timeout: 4000,
      });
    },
  });
});

async function refresh() {
  needsRefresh.value = false;
  if (updateSW) await updateSW(true);
}

function dismiss() {
  needsRefresh.value = false;
}
</script>
