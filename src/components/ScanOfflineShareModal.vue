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
import { decodePlanFromText, peekFestivalId } from '../utils/url';
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

let resolving = false;

async function handleDetected(text) {
  if (resolving) return;
  resolving = true;
  try {
    // 朋友分享的活動可能不在我的裝置上：先按需下載（有網路才會成功），再解碼
    const festId = peekFestivalId(text);
    if (festId && !festivalStore.getById(festId)) {
      scanFeedback.value = '正在載入這場音樂祭的資料…';
      await festivalStore.ensureFestival(festId);
    }
    const result = decodePlanFromText(text, festivalStore.getFestivals);
    if (!result.festival) {
      scanFeedback.value = festivalStore.getEntry(festId)
        ? '這場音樂祭還沒下載到手機，需要連上網路一次才能讀取'
        : '無法辨識這個 QR Code，請確認是本 App 產生的離線分享行程';
      return; // 繼續掃描，不要卡住
    }
    if (result.plan.length === 0) {
      scanFeedback.value = '這份分享裡沒有可用的演出';
      return;
    }
    scanFeedback.value = '';
    scanner.stop();
    decoded.value = result;
  } finally {
    resolving = false;
  }
}

function retry() {
  scanner.start(handleDetected);
}

onMounted(async () => {
  await festivalStore.ensureLoaded();
  scanner.start(handleDetected);
});
</script>
