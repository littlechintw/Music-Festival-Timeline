<template>
  <div
    v-if="needsRefresh"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-[90vw]"
  >
    <span>有新版本可用</span>
    <button
      class="px-3 py-1 bg-white text-blue-700 rounded font-medium hover:bg-blue-50"
      @click="refresh"
    >
      立即更新
    </button>
    <button class="text-blue-200 hover:text-white" @click="dismiss">稍後</button>
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
