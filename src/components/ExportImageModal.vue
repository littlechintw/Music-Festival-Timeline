<template>
  <BaseModal :model-value="open" @update:model-value="close">
    <template #headline>匯出行程圖</template>

    <div class="flex flex-col gap-4">
      <!-- 模式切換：列表 / 時間表 -->
      <div
        class="inline-flex p-1 rounded-lg bg-[var(--md-sys-color-surface-container-high)] self-start"
        role="tablist"
        aria-label="匯出版型"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'list'"
          class="px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5"
          :class="
            mode === 'list'
              ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] shadow-sm'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          "
          @click="mode = 'list'"
        >
          <MdIcon name="format_list_bulleted" /> 列表
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'timetable'"
          class="px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5"
          :class="
            mode === 'timetable'
              ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] shadow-sm'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
          "
          @click="mode = 'timetable'"
        >
          <MdIcon name="calendar_view_month" /> 時間表
        </button>
      </div>

      <p class="text-sm text-gray-600 dark:text-gray-300">
        <span v-if="mode === 'list'">
          會依照你目前的螢幕比例（{{ dims.width }} × {{ dims.height }} @{{ dims.dpr }}x）畫一張
          PNG，可以下載或直接分享。
        </span>
        <span v-else>
          以「時間表」呈現：每天一張
          PNG，已加入行程的場次會用主色凸顯，其他場次保留主色但降彩度＋透明度淡化。
        </span>
      </p>

      <!-- 音樂祭選擇 -->
      <md-outlined-select
        v-if="festivals.length > 1"
        label="選擇音樂祭"
        class="w-full"
        :value="selectedId"
        @change="(e) => (selectedId = e.target.value)"
      >
        <md-select-option v-for="f in festivals" :key="f.id" :value="f.id">
          {{ f.name }}（{{ f.count }} 場）
        </md-select-option>
      </md-outlined-select>

      <!-- 時間表模式：日期 tabs -->
      <div v-if="mode === 'timetable' && days.length > 0" class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">預覽哪一天</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="d in days"
            :key="d.key"
            type="button"
            class="px-3 py-1.5 rounded-md text-sm border transition"
            :class="
              selectedDayKey === d.key
                ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]'
                : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            "
            @click="selectedDayKey = d.key"
          >
            {{ d.label }}
            <span class="ml-1 text-xs opacity-80">({{ d.selectedCount }}/{{ d.totalCount }})</span>
          </button>
        </div>
      </div>

      <!-- 預覽 -->
      <div
        v-if="previewUrl"
        class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 flex justify-center"
      >
        <img :src="previewUrl" alt="行程圖預覽" class="max-h-[50vh] w-auto" />
      </div>
      <div v-else-if="generating" class="text-center py-8 text-gray-500 dark:text-gray-400">
        產生中…
      </div>
      <div
        v-else-if="mode === 'timetable' && days.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm"
      >
        這個音樂祭目前沒有可顯示的演出資料。
      </div>
    </div>

    <template #actions>
      <md-text-button type="button" @click="close">關閉</md-text-button>
      <md-outlined-button type="button" :disabled="!previewUrl" @click="handleDownload">
        <MdIcon name="download" slot="icon" />
        {{ downloadLabel }}
      </md-outlined-button>
      <md-filled-button type="button" :disabled="!previewUrl || sharing" @click="handleShare">
        <MdIcon name="ios_share" slot="icon" />
        {{ shareLabel }}
      </md-filled-button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  detectExportDimensions,
  renderPlanToDataUrl,
  renderTimetableToDataUrl,
  buildTimetableStagesForDay,
  listFestivalDays,
  downloadDataUrl,
  shareOrDownload,
} from '../utils/exportImage';
import { useSettingsStore } from '../stores/settings';
import { useFestivalStore } from '../stores/festival';
import { useToast } from '../composables/useToast';
import { trackEvent } from '../utils/analytics';
import BaseModal from './BaseModal.vue';
import MdIcon from './MdIcon.vue';

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
/** @type {'list' | 'timetable'} */
const mode = ref('list');
const selectedDayKey = ref('');
const previewUrl = ref('');
const generating = ref(false);
const sharing = ref(false);

const canShareFiles = computed(() => {
  if (typeof navigator === 'undefined') return false;
  return 'share' in navigator && 'canShare' in navigator;
});

const shareLabel = computed(() => {
  if (sharing.value) return '分享中…';
  if (mode.value === 'timetable') {
    return canShareFiles.value ? '分享這一天' : '下載這一天 PNG';
  }
  return canShareFiles.value ? '分享圖片' : '下載 PNG';
});

const downloadLabel = computed(() => {
  if (mode.value === 'timetable') return '下載這一天 PNG';
  return '下載 PNG';
});

const selectedFestivalMeta = computed(() => {
  if (!selectedId.value) return null;
  return festivalStore.getById(selectedId.value);
});

/**
 * 從 plan 算出 selectedKeys。key 必須跟 buildTimetableStagesForDay 內組出的一致：
 * `${festivalId}_${stage}_${artist}_${start}`
 */
const selectedKeys = computed(() => {
  const set = new Set();
  for (const p of props.plan) {
    if (!p.festivalId) continue;
    set.add(`${p.festivalId}_${p.stage}_${p.artist}_${p.start}`);
  }
  return set;
});

/**
 * 當前 festival + plan 對應出的每日資訊（含 selected/total 數）。
 */
const days = computed(() => {
  const fest = selectedFestivalMeta.value;
  if (!fest) return [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();
  const baseDays = listFestivalDays(fest);
  const mapped = baseDays.map((d) => {
    let selectedCount = 0;
    let totalCount = 0;
    for (const stage of fest.stages) {
      for (const perf of stage.performances) {
        if (new Date(perf.start).toDateString() !== d.key) continue;
        totalCount += 1;
        const key = `${fest.festivalId}_${stage.name}_${perf.artist}_${perf.start}`;
        if (selectedKeys.value.has(key)) selectedCount += 1;
      }
    }
    return { ...d, selectedCount, totalCount, isPast: d.date.getTime() < startOfTodayMs };
  });
  // 時間最靠近現在的排最前面：先列今天與之後的（由近到遠），再列已過的（最近的在前）。
  return mapped.sort((a, b) => {
    if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
    return a.isPast ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime();
  });
});

watch(
  () => props.open,
  (v) => {
    if (v) {
      dims.value = detectExportDimensions();
      if (!selectedId.value && props.festivals.length > 0) {
        selectedId.value = props.festivals[0].id;
      }
      ensureValidDay();
      generate();
    } else {
      previewUrl.value = '';
    }
  }
);

watch(selectedId, () => {
  if (!props.open) return;
  ensureValidDay();
  generate();
});

watch(mode, () => {
  if (!props.open) return;
  ensureValidDay();
  generate();
});

watch(selectedDayKey, () => {
  if (props.open && mode.value === 'timetable') generate();
});

function ensureValidDay() {
  if (mode.value !== 'timetable') return;
  const list = days.value;
  if (list.length === 0) {
    selectedDayKey.value = '';
    return;
  }
  if (!list.some((d) => d.key === selectedDayKey.value)) {
    selectedDayKey.value = list[0].key;
  }
}

async function generate() {
  if (!selectedId.value) return;
  generating.value = true;
  previewUrl.value = '';
  try {
    // 等下一個 tick 讓 modal 渲染出來再做重的事
    await new Promise((r) => setTimeout(r, 0));
    const meta = selectedFestivalMeta.value;
    const themePrimary = meta?.theme?.primary || '#2563eb';
    const themeSecondary = meta?.theme?.secondary || '#7c3aed';
    const festivalName = meta?.name || '我的行程';

    if (mode.value === 'list') {
      const perfs = props.plan.filter((p) => p.festivalId === selectedId.value);
      if (!perfs.length) return;
      previewUrl.value = renderPlanToDataUrl({
        festivalName,
        primaryColor: themePrimary,
        secondaryColor: themeSecondary,
        perfs,
        is24Hour: settingsStore.is24Hour,
        dimensions: dims.value,
      });
    } else {
      if (!meta || !selectedDayKey.value) return;
      const stages = buildTimetableStagesForDay({
        festival: meta,
        dayKey: selectedDayKey.value,
        selectedKeys: selectedKeys.value,
      });
      const dayMeta = days.value.find((d) => d.key === selectedDayKey.value);
      if (!dayMeta) return;
      previewUrl.value = renderTimetableToDataUrl({
        festivalName,
        dayLabel: dayMeta.label,
        primaryColor: themePrimary,
        secondaryColor: themeSecondary,
        stages,
        is24Hour: settingsStore.is24Hour,
        dpr: dims.value.dpr,
      });
    }
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
  if (mode.value === 'timetable' && selectedDayKey.value) {
    // 把 dayKey 轉成 YYYY-MM-DD 比較好辨識
    const d = new Date(selectedDayKey.value);
    const iso = Number.isFinite(d.getTime())
      ? `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      : stamp;
    return `${idPart}-timetable-${iso}.png`;
  }
  return `${idPart}-plan-${stamp}.png`;
}

function handleDownload() {
  if (!previewUrl.value) return;
  downloadDataUrl(previewUrl.value, filenameFor());
  trackEvent('export_image', {
    mode: 'download',
    layout: mode.value,
    festival_id: selectedId.value,
  });
  showToast({ message: mode.value === 'timetable' ? '已下載這一天的時間表' : '已下載行程圖' });
}

async function handleShare() {
  if (!previewUrl.value) return;
  sharing.value = true;
  try {
    const title = mode.value === 'timetable' ? '我的音樂祭時間表' : '我的音樂祭行程';
    const result = await shareOrDownload(previewUrl.value, filenameFor(), title);
    trackEvent('export_image', {
      mode: result,
      layout: mode.value,
      festival_id: selectedId.value,
    });
    if (result === 'shared') {
      showToast({ message: '已開啟分享' });
    } else {
      showToast({ message: mode.value === 'timetable' ? '已下載這一天的時間表' : '已下載行程圖' });
    }
  } finally {
    sharing.value = false;
  }
}

function close() {
  emit('close');
}
</script>
