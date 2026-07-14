<template>
  <div class="p-4 max-w-full mx-auto">
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div
          class="w-12 h-12 border-4 border-[var(--md-sys-color-primary-container)] border-t-[var(--md-sys-color-primary)] rounded-full animate-spin mx-auto mb-4"
        />
        <h2 class="text-xl font-bold text-gray-700 dark:text-gray-200">正在取得行程資訊...</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">請稍候，我們正在載入您的行程</p>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-[50vh]">
      <div
        class="bg-[var(--md-sys-color-surface-container)] rounded-xl shadow-lg p-8 max-w-sm w-full text-center"
      >
        <MdIcon
          name="error"
          class="text-[var(--md-sys-color-error)] mb-4"
          style="--md-icon-size: 3rem"
        />
        <h2 class="text-xl font-bold text-[var(--md-sys-color-error)] mb-2">解析失敗</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">{{ error }}</p>
        <router-link to="/">
          <md-filled-button type="button">回到首頁</md-filled-button>
        </router-link>
      </div>
    </div>

    <div v-else-if="isAsking">
      <div class="text-center mb-4">
        <MdIcon name="festival" class="mb-2" style="--md-icon-size: 3rem" />
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">收到分享的行程！</h2>
        <p class="text-gray-600 dark:text-gray-300">
          來自「<span class="font-bold text-[var(--md-sys-color-primary)]">{{ festivalName }}</span
          >」的行程，共 {{ parsedPlan.length }} 場演出
        </p>
      </div>

      <div
        class="flex items-center justify-center gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3"
      >
        <span class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-sm bg-[var(--md-sys-color-primary)] inline-block"></span>
          朋友已選擇
        </span>
        <span class="flex items-center gap-1">
          <span
            class="w-3 h-3 rounded-sm bg-[var(--md-sys-color-surface-container-high)] inline-block"
          ></span>
          未選擇
        </span>
      </div>

      <div v-if="festivalDays.length > 1" class="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          v-for="day in festivalDays"
          :key="day.dateKey"
          type="button"
          class="px-3 py-1 rounded border text-sm whitespace-nowrap flex-shrink-0 transition-colors"
          :class="
            selectedDay === day.dateKey
              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)]'
              : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)]'
          "
          @click="selectedDay = day.dateKey"
        >
          {{ day.label }}
        </button>
      </div>

      <div
        class="mobile-scroll-hint md:hidden bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] text-sm px-3 py-2 rounded-lg mb-4 flex items-center gap-2"
      >
        <MdIcon name="arrow_forward" style="--md-icon-size: 16px" />
        左右滑動查看所有舞台
      </div>

      <TimelineGrid
        :stages="stagesForGrid"
        :performances="performancesForDay"
        :is24-hour="settingsStore.is24Hour"
        :perf-class-resolver="resolvePerfClass"
      />

      <div class="max-w-sm mx-auto mt-6">
        <div v-if="!showSaveForm" class="flex flex-col gap-3">
          <p class="text-[var(--md-sys-color-error)] text-sm font-medium text-center">
            注意：「取代目前行程」將會覆蓋您原本的行程！
          </p>
          <md-filled-button type="button" class="w-full" @click="handleReplace">
            <MdIcon name="sync" slot="icon" />
            取代目前行程
          </md-filled-button>
          <md-outlined-button type="button" class="w-full" @click="showSaveForm = true">
            <MdIcon name="bookmark_add" slot="icon" />
            另存為新行程
          </md-outlined-button>
          <router-link
            to="/"
            class="text-sm text-[var(--md-sys-color-on-surface-variant)] hover:underline text-center mt-1"
          >
            不要，回到首頁
          </router-link>
        </div>

        <div v-else class="flex flex-col gap-3 text-left">
          <label class="block font-bold text-sm text-gray-700 dark:text-gray-200">行程名稱</label>
          <md-outlined-text-field
            class="w-full"
            :value="saveName"
            @input="(e) => (saveName = e.target.value)"
          ></md-outlined-text-field>
          <p class="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
            <MdIcon name="info" style="--md-icon-size: 14px" />
            只會存在這台裝置的瀏覽器裡，不會同步到雲端或其他裝置。
          </p>
          <div class="flex gap-3">
            <md-outlined-button type="button" class="flex-1" @click="showSaveForm = false">
              取消
            </md-outlined-button>
            <md-filled-button type="button" class="flex-1" @click="handleSave">
              儲存
            </md-filled-button>
          </div>
        </div>
      </div>
    </div>

    <BaseModal :model-value="!!invalidMessage" @update:model-value="invalidMessage = ''">
      <template #headline>
        <div class="flex items-center gap-2">
          <MdIcon name="warning" class="text-[var(--md-sys-color-error)]" />
          部分行程失效
        </div>
      </template>
      <p class="text-gray-600 dark:text-gray-300 text-left leading-relaxed">
        {{ invalidMessage }}
      </p>
      <template #actions>
        <md-filled-button type="button" @click="invalidMessage = ''">我知道了</md-filled-button>
      </template>
    </BaseModal>

    <BaseModal :model-value="showSuccessModal" @update:model-value="finishSuccess">
      <template #headline>{{ successKind === 'save' ? '已儲存！' : '匯入成功！' }}</template>
      <div class="text-center">
        <MdIcon
          name="check_circle"
          class="text-[var(--md-sys-color-primary)] mb-2"
          style="--md-icon-size: 3rem"
        />
        <p class="text-gray-600 dark:text-gray-300">
          {{
            successKind === 'save'
              ? '行程已另存，可以在「行程」頁面的已儲存清單中查看。'
              : '您的行程已成功更新'
          }}
        </p>
      </div>
      <template #actions>
        <md-filled-button type="button" @click="finishSuccess">前往我的行程</md-filled-button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { usePlanStore } from '../stores/plan';
import { useSavedPlansStore } from '../stores/savedPlans';
import { useSettingsStore } from '../stores/settings';
import { decodePlanFromText } from '../utils/url';
import { getShortenerUrl } from '../utils/shortener';
import { makePerfId } from '../utils/perfId';
import { WEEKDAYS_ZH } from '../utils/format';
import BaseModal from '../components/BaseModal.vue';
import MdIcon from '../components/MdIcon.vue';
import TimelineGrid from '../components/TimelineGrid.vue';

const route = useRoute();
const router = useRouter();
const festivalStore = useFestivalStore();
const planStore = usePlanStore();
const savedPlansStore = useSavedPlansStore();
const settingsStore = useSettingsStore();

const loading = ref(true);
const error = ref('');
const isAsking = ref(false);
const festivalName = ref('');
const festival = ref(null);
const parsedPlan = ref([]);
const invalidMessage = ref('');
const showSuccessModal = ref(false);
const successKind = ref('replace');
const showSaveForm = ref(false);
const saveName = ref('');
const selectedDay = ref('');

const sharedIds = computed(() => new Set(parsedPlan.value.map((p) => p.id || '')));

const festivalDays = computed(() => {
  if (!festival.value) return [];
  const set = new Set();
  for (const stage of festival.value.stages) {
    for (const perf of stage.performances) {
      set.add(new Date(perf.start).toDateString());
    }
  }
  return Array.from(set)
    .map((dateKey) => {
      const date = new Date(dateKey);
      return {
        dateKey,
        label: `${date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} (${WEEKDAYS_ZH[date.getDay()]})`,
        date,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
});

const stagesForGrid = computed(() => {
  if (!festival.value) return [];
  return festival.value.stages.map((s) => ({ name: s.name, key: s.id }));
});

const performancesForDay = computed(() => {
  if (!festival.value || !selectedDay.value) return [];
  const result = [];
  for (const stage of festival.value.stages) {
    for (const perf of stage.performances) {
      if (new Date(perf.start).toDateString() !== selectedDay.value) continue;
      result.push({ ...perf, stage: stage.name, _stage: stage });
    }
  }
  return result;
});

function isShared(perf) {
  if (!festival.value) return false;
  const id = makePerfId(festival.value, perf._stage || { name: perf.stage }, perf);
  return sharedIds.value.has(id);
}

function resolvePerfClass(perf) {
  return isShared(perf)
    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium'
    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] opacity-60 pointer-events-none';
}

function formatDefaultSaveName(date, name) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}/${mo}/${d} ${h}:${mi}:${s} ${name}`;
}

function handleReplace() {
  planStore.replacePlan(parsedPlan.value);
  successKind.value = 'replace';
  showSuccessModal.value = true;
}

function handleSave() {
  const name = saveName.value.trim() || formatDefaultSaveName(new Date(), festivalName.value);
  savedPlansStore.addSavedPlan({
    name,
    festivalId: festival.value.festivalId,
    festivalName: festival.value.name,
    performances: parsedPlan.value,
  });
  showSaveForm.value = false;
  successKind.value = 'save';
  showSuccessModal.value = true;
}

function finishSuccess() {
  showSuccessModal.value = false;
  router.replace({ path: '/plan' });
}

onMounted(async () => {
  const shortId = route.params.shortId;
  const gasUrl = getShortenerUrl();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    error.value = '目前離線中，無法解析分享網址。請連線後重試。';
    loading.value = false;
    return;
  }

  try {
    await festivalStore.ensureLoaded();

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      mode: 'cors',
      body: JSON.stringify({ action: 'get', short_id: shortId }),
    });
    const data = await res.json();

    if (data.err || !data.t) {
      error.value = data.message || '找不到對應的短網址紀錄';
      return;
    }

    const decoded = decodeURIComponent(data.t);
    const result = decodePlanFromText(decoded, festivalStore.getFestivals);
    if (!result.festival) {
      error.value = '找不到對應的音樂祭資料，可能尚未上架';
      return;
    }
    if (result.plan.length === 0) {
      error.value = '行程內容為空或全部已失效';
      return;
    }
    festival.value = result.festival;
    festivalName.value = result.festival.name;
    parsedPlan.value = result.plan;
    selectedDay.value = new Date(result.plan[0].start).toDateString();
    saveName.value = result.name || formatDefaultSaveName(new Date(), result.festival.name);
    if (result.invalidCount > 0) {
      invalidMessage.value = `有 ${result.invalidCount} 個行程已經失效，僅會匯入部分有效行程`;
    }
    isAsking.value = true;
  } catch (err) {
    console.error('取得短網址失敗:', err);
    error.value = '連線服務發生錯誤';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
@media (max-width: 768px) {
  .mobile-scroll-hint {
    animation: slideIn 0.3s ease-out;
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
