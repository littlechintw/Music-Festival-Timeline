<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="export-image-title"
    @click.self="close"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
    >
      <h3 id="export-image-title" class="text-xl font-bold text-gray-900 dark:text-gray-100">
        匯出行程圖
      </h3>

      <p class="text-sm text-gray-600 dark:text-gray-300">
        會依照你目前的螢幕比例（{{ dims.width }} × {{ dims.height }} @{{ dims.dpr }}x）畫一張 PNG，可以下載或直接分享。
      </p>

      <div v-if="festivals.length > 1" class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">選擇音樂祭</label>
        <select
          v-model="selectedId"
          class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          <option v-for="f in festivals" :key="f.id" :value="f.id">
            {{ f.name }}（{{ f.count }} 場）
          </option>
        </select>
      </div>

      <div
        v-if="previewUrl"
        class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 flex justify-center"
      >
        <img
          :src="previewUrl"
          alt="行程圖預覽"
          class="max-h-[50vh] w-auto"
        />
      </div>
      <div v-else-if="generating" class="text-center py-8 text-gray-500 dark:text-gray-400">
        產生中…
      </div>

      <div class="flex gap-2 mt-2">
        <button
          class="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!previewUrl || sharing"
          @click="handleShare"
        >
          {{ shareLabel }}
        </button>
        <button
          class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          :disabled="!previewUrl"
          @click="handleDownload"
        >
          下載 PNG
        </button>
      </div>

      <button
        class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        @click="close"
      >
        關閉
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  detectExportDimensions,
  renderPlanToDataUrl,
  downloadDataUrl,
  shareOrDownload,
} from '../utils/exportImage';
import { useSettingsStore } from '../stores/settings';
import { useFestivalStore } from '../stores/festival';
import { useToast } from '../composables/useToast';
import { trackEvent } from '../utils/analytics';

const props = defineProps({
  open: { type: Boolean, required: true },
  // 全部行程（沒 filter 過）
  plan: { type: Array, required: true },
  // [{ id, name, count }]
  festivals: { type: Array, required: true },
});

const emit = defineEmits(['close']);

const settingsStore = useSettingsStore();
const festivalStore = useFestivalStore();
const { showToast } = useToast();

const dims = ref(detectExportDimensions());
const selectedId = ref('');
const previewUrl = ref('');
const generating = ref(false);
const sharing = ref(false);

const canShareFiles = computed(() => {
  if (typeof navigator === 'undefined') return false;
  return 'share' in navigator && 'canShare' in navigator;
});

const shareLabel = computed(() => {
  if (sharing.value) return '分享中…';
  return canShareFiles.value ? '分享圖片' : '下載 PNG';
});

const selectedFestivalMeta = computed(() => {
  if (!selectedId.value) return null;
  return festivalStore.getById(selectedId.value);
});

watch(
  () => props.open,
  (v) => {
    if (v) {
      dims.value = detectExportDimensions();
      if (!selectedId.value && props.festivals.length > 0) {
        selectedId.value = props.festivals[0].id;
      }
      generate();
    } else {
      previewUrl.value = '';
    }
  }
);

watch(selectedId, () => {
  if (props.open) generate();
});

async function generate() {
  if (!selectedId.value || !props.plan.length) return;
  generating.value = true;
  previewUrl.value = '';
  try {
    // 等下一個 tick 讓 modal 渲染出來再做重的事
    await new Promise((r) => setTimeout(r, 0));
    const perfs = props.plan.filter((p) => p.festivalId === selectedId.value);
    if (!perfs.length) return;
    const meta = selectedFestivalMeta.value;
    previewUrl.value = renderPlanToDataUrl({
      festivalName: meta?.name || perfs[0].festivalName || '我的行程',
      primaryColor: meta?.theme?.primary || '#2563eb',
      secondaryColor: meta?.theme?.secondary || '#7c3aed',
      perfs,
      is24Hour: settingsStore.is24Hour,
      dimensions: dims.value,
    });
  } catch (err) {
    console.error('[export-image] render failed', err);
    showToast({ message: '產生圖片失敗', kind: 'error' });
  } finally {
    generating.value = false;
  }
}

function filenameFor() {
  const idPart = selectedId.value || 'plan';
  const stamp = new Date().toISOString().slice(0, 10);
  return `${idPart}-plan-${stamp}.png`;
}

function handleDownload() {
  if (!previewUrl.value) return;
  downloadDataUrl(previewUrl.value, filenameFor());
  trackEvent('export_image', { mode: 'download', festival_id: selectedId.value });
  showToast({ message: '已下載行程圖' });
}

async function handleShare() {
  if (!previewUrl.value) return;
  sharing.value = true;
  try {
    const result = await shareOrDownload(previewUrl.value, filenameFor(), '我的音樂祭行程');
    trackEvent('export_image', { mode: result, festival_id: selectedId.value });
    if (result === 'shared') {
      showToast({ message: '已開啟分享' });
    } else {
      showToast({ message: '已下載行程圖' });
    }
  } finally {
    sharing.value = false;
  }
}

function close() {
  emit('close');
}

function handleKey(e) {
  if (e.key === 'Escape' && props.open) close();
}

onMounted(() => {
  window.addEventListener('keydown', handleKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
});
</script>
