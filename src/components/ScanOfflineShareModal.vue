<template>
  <BaseModal :model-value="true" @update:model-value="$emit('close')">
    <template #headline>{{ decoded ? '掃描結果' : '掃描離線分享' }}</template>

    <div v-if="!decoded">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        將朋友的離線分享 QR Code 對準畫面，會自動辨識，不需要連網路。
      </p>
      <video
        ref="videoEl"
        class="w-full rounded-lg bg-black aspect-square object-cover"
        playsinline
        muted
      ></video>
      <p
        v-if="scanner.error"
        class="text-sm text-[var(--md-sys-color-error)] mt-3 flex items-center gap-1"
      >
        <MdIcon name="error" style="--md-icon-size: 16px" />
        {{ scanner.error }}
      </p>
      <p
        v-else-if="scanFeedback"
        class="text-sm text-[var(--md-sys-color-error)] mt-3 flex items-center gap-1"
      >
        <MdIcon name="warning" style="--md-icon-size: 16px" />
        {{ scanFeedback }}
      </p>
    </div>

    <SharedPlanReceiver
      v-else
      :festival="decoded.festival"
      :plan="decoded.plan"
      :invalid-count="decoded.invalidCount"
      @cancel="$emit('close')"
      @imported="$emit('close')"
    />

    <template v-if="!decoded" #actions>
      <md-outlined-button v-if="scanner.error" type="button" @click="retry">
        重試
      </md-outlined-button>
      <md-text-button type="button" @click="$emit('close')">取消</md-text-button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFestivalStore } from '../stores/festival';
import { decodePlanFromText } from '../utils/url';
import { useQrScanner } from '../composables/useQrScanner';
import BaseModal from './BaseModal.vue';
import MdIcon from './MdIcon.vue';
import SharedPlanReceiver from './SharedPlanReceiver.vue';

defineEmits(['close']);

const festivalStore = useFestivalStore();
const scanner = useQrScanner();
const { videoEl } = scanner;

const decoded = ref(null);
const scanFeedback = ref('');

function handleDetected(text) {
  const result = decodePlanFromText(text, festivalStore.getFestivals);
  if (!result.festival || result.plan.length === 0) {
    scanFeedback.value = '無法辨識這個 QR Code，請確認是本 App 產生的離線分享行程';
    return; // 繼續掃描，不要卡住
  }
  scanFeedback.value = '';
  scanner.stop();
  decoded.value = result;
}

function retry() {
  scanner.start(handleDetected);
}

onMounted(async () => {
  await festivalStore.ensureLoaded();
  scanner.start(handleDetected);
});
</script>
