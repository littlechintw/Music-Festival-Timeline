<template>
  <div class="p-4 max-w-3xl mx-auto relative">
    <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">我的行程</h1>

    <div
      v-if="plan.length === 0"
      class="flex flex-col items-center justify-center text-center py-12 px-4"
    >
      <div class="text-5xl mb-4" aria-hidden="true">🎵</div>
      <h2 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
        還沒有行程
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
        去音樂祭列表挑幾場喜歡的演出加入吧！你的行程會自動快取，現場沒網路也能查。
      </p>
      <router-link
        to="/"
        class="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium shadow-sm"
      >
        瀏覽音樂祭 →
      </router-link>
    </div>

    <div v-else>
      <NextUpCard :plan="plan" :now="now" :is24-hour="settingsStore.is24Hour" />
      <!-- 統計卡 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-lg text-gray-800 dark:text-gray-100 relative"
        style="box-shadow: 0 4px 24px 0 rgba(30, 64, 175, 0.1), 0 0px 8px 0 rgba(30, 64, 175, 0.1)"
      >
        <div class="absolute top-2 right-6 hidden md:flex gap-2">
          <button
            class="px-3 py-1 rounded border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
            :disabled="isSharing || !isOnline"
            :title="!isOnline ? '離線中，無法產生分享網址' : ''"
            @click="openShareModal"
          >
            <span
              v-if="isSharing"
              class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
            />
            {{ shareButtonLabel }}
          </button>
          <button
            class="px-3 py-1 rounded border border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-300 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 transition inline-flex items-center gap-1 shadow-sm"
            aria-label="匯出行程圖"
            @click="showExportImageModal = true"
          >
            <span aria-hidden="true">📸</span>
            <span>匯出行程圖</span>
          </button>
        </div>
        <div class="flex flex-col gap-2 md:hidden mt-2 mb-4">
          <button
            class="w-full px-3 py-2 rounded border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            :disabled="isSharing || !isOnline"
            @click="openShareModal"
          >
            <span
              v-if="isSharing"
              class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
            />
            {{ shareButtonLabel }}
          </button>
          <button
            class="w-full px-3 py-2 rounded border border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-300 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-1 shadow-sm"
            @click="showExportImageModal = true"
          >
            <span aria-hidden="true">📸</span>
            <span>匯出行程圖</span>
          </button>
        </div>
        <div class="flex flex-wrap gap-6 text-sm mt-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded font-bold">{{ plan.length }}</span>
            <span>場演出</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded font-bold">{{ planDays.length }}</span>
            <span>天行程</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded font-bold">
              {{ uniqueFestivals.length }}
            </span>
            <span>個音樂祭</span>
          </div>
        </div>
      </div>

      <!-- 日期 tabs -->
      <div v-if="planDays.length > 1" class="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          v-for="day in planDays"
          :key="day.dateKey"
          class="px-4 py-2 rounded-lg text-sm whitespace-nowrap flex-shrink-0 transition-all font-medium flex items-center gap-2"
          :class="
            selectedPlanDay === day.dateKey
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-300 border border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700'
          "
          @click="selectedPlanDay = day.dateKey"
        >
          <span>{{ day.label }}</span>
          <span
            class="inline-flex items-center justify-center text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full"
            :class="
              selectedPlanDay === day.dateKey
                ? 'text-blue-600 bg-white dark:text-blue-900 dark:bg-blue-200'
                : 'text-white bg-blue-600'
            "
          >
            {{ day.count }}
          </span>
        </button>
      </div>

      <!-- 單日時間軸 -->
      <div
        v-for="day in planDays"
        v-show="selectedPlanDay === day.dateKey"
        :key="day.dateKey"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      >
        <div class="bg-blue-600 dark:bg-blue-700 text-white px-6 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold">{{ day.label }}</h3>
              <p class="text-blue-100 mt-1">
                {{ day.count }} 場演出 • {{ day.festivalNames.join('、') }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <div v-if="day.isToday" class="text-right">
                <div class="text-yellow-300 text-sm font-medium">今天</div>
                <div class="text-yellow-100 text-xs">{{ formatTime(now, settingsStore.is24Hour) }}</div>
              </div>
              <div
                v-if="dayFestivalsWithMap(day).length > 0"
                class="flex flex-wrap gap-1 justify-end"
              >
                <button
                  v-for="fest in dayFestivalsWithMap(day)"
                  :key="fest.id"
                  class="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors flex items-center gap-1"
                  @click="goToMap(fest.id)"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {{ dayFestivalsWithMap(day).length > 1 ? fest.name + ' ' : '' }}場地地圖
                </button>
              </div>
            </div>
          </div>
        </div>

        <TimelineGrid
          :stages="day.stages.map((s) => ({ name: s }))"
          :performances="day.performances"
          :is24-hour="settingsStore.is24Hour"
          :show-current-time="day.isToday"
          :now="now"
          :detect-conflicts="true"
        />
      </div>
    </div>

    <!-- 分享 Modal -->
    <div
      v-if="showShareModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-[100] p-4"
      @click="!isSharing && (showShareModal = false)"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-auto shadow-2xl relative"
        @click.stop
      >
        <div
          v-if="isSharing"
          class="absolute inset-0 bg-white/90 dark:bg-gray-800/90 rounded-xl flex flex-col items-center justify-center z-10"
        >
          <div
            class="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 rounded-full animate-spin mb-4"
          />
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">請稍候...</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">正在產生分享網址</p>
        </div>

        <template v-if="!generatedLink">
          <h3 class="text-xl font-bold mb-4 text-center text-gray-900 dark:text-gray-100">
            選擇要分享的音樂祭
          </h3>
          <div class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            <button
              v-for="fest in shareableFestivals"
              :key="fest.id"
              class="px-4 py-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-200 font-medium text-left flex justify-between items-center transition-colors disabled:opacity-50"
              :disabled="isSharing"
              @click="executeShare(fest.id)"
            >
              <span class="truncate pr-2">{{ fest.name }}</span>
              <span
                class="text-sm bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-100 px-2 py-1 rounded-full whitespace-nowrap"
              >
                {{ fest.count }} 場
              </span>
            </button>
          </div>
          <button
            class="mt-6 w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors disabled:opacity-50"
            :disabled="isSharing"
            @click="showShareModal = false"
          >
            取消
          </button>
        </template>

        <template v-else>
          <div class="flex justify-center mb-4 text-green-500 dark:text-green-400">
            <svg
              class="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2 text-center text-gray-800 dark:text-gray-100">網址產生成功！</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">可以複製以下連結分享給朋友</p>
          <div class="mb-6 relative">
            <input
              type="text"
              readonly
              :value="generatedLink"
              class="w-full pr-10 pl-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              @click="$event.target.select()"
            />
          </div>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium transition-colors shadow-sm"
              @click="copyGeneratedLink"
            >
              複製網址
            </button>
            <button
              class="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
              @click="showShareModal = false"
            >
              關閉
            </button>
          </div>
        </template>
      </div>
    </div>

    <ExportImageModal
      :open="showExportImageModal"
      :plan="plan"
      :festivals="shareableFestivals"
      @close="showExportImageModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { usePlanStore } from '../stores/plan';
import { useFestivalStore } from '../stores/festival';
import { useSettingsStore } from '../stores/settings';
import { useNowTicker } from '../composables/useNowTicker';
import { useOnline } from '../composables/useOnline';
import { encodePlanToText } from '../utils/url';
import { formatTime, formatDayLabel } from '../utils/format';
import { trackEvent } from '../utils/analytics';
import TimelineGrid from '../components/TimelineGrid.vue';
import NextUpCard from '../components/NextUpCard.vue';
import ExportImageModal from '../components/ExportImageModal.vue';

const planStore = usePlanStore();
const festivalStore = useFestivalStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const { now } = useNowTicker(1000);
const { isOnline } = useOnline();

const { myPlan: plan } = storeToRefs(planStore);
const selectedPlanDay = ref('');

const uniqueFestivals = computed(() => [
  ...new Set(plan.value.map((p) => p.festivalName).filter(Boolean)),
]);

const festivalMap = computed(
  () => new Map((festivalStore.getFestivals || []).map((f) => [f.festivalId, f]))
);

const planDays = computed(() => {
  if (!plan.value.length) return [];

  const todayKey = now.value.toDateString();
  const grouped = new Map();

  for (const perf of plan.value) {
    const date = new Date(perf.start);
    const key = date.toDateString();
    if (!grouped.has(key)) {
      grouped.set(key, {
        dateKey: key,
        date,
        isToday: key === todayKey,
        performances: [],
        festivalNames: new Set(),
      });
    }
    const entry = grouped.get(key);
    entry.performances.push({
      ...perf,
      isPast: now.value > new Date(perf.end || perf.start),
    });
    if (perf.festivalName) entry.festivalNames.add(perf.festivalName);
  }

  const result = Array.from(grouped.values()).map((day) => {
    day.performances.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const festivalIds = [...new Set(day.performances.map((p) => p.festivalId).filter(Boolean))];
    const stageOrder = new Set();
    for (const id of festivalIds) {
      const fest = festivalMap.value.get(id);
      if (fest?.stages) for (const s of fest.stages) stageOrder.add(s.name);
    }
    const indexMap = new Map([...stageOrder].map((name, i) => [name, i]));
    const stages = [...new Set(day.performances.map((p) => p.stage).filter(Boolean))].sort(
      (a, b) => (indexMap.get(a) ?? Infinity) - (indexMap.get(b) ?? Infinity)
    );

    const entries = festivalIds.map((id) => ({
      id,
      name: day.performances.find((p) => p.festivalId === id)?.festivalName || id,
    }));

    return {
      ...day,
      label: formatDayLabel(day.date),
      count: day.performances.length,
      festivalNames: [...day.festivalNames],
      festivalEntries: entries,
      stages,
    };
  });

  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
});

// 把預設選擇日的副作用從 computed 拉出來，避免 vue/no-side-effects-in-computed-properties
watch(
  planDays,
  (days) => {
    if (days.length === 0) {
      selectedPlanDay.value = '';
      return;
    }
    if (!selectedPlanDay.value || !days.some((d) => d.dateKey === selectedPlanDay.value)) {
      const today = days.find((d) => d.isToday);
      selectedPlanDay.value = today ? today.dateKey : days[0].dateKey;
    }
  },
  { immediate: true }
);

function dayFestivalsWithMap(day) {
  return (day.festivalEntries || []).filter((f) => !!festivalMap.value.get(f.id)?.map?.image);
}

function goToMap(festivalId) {
  router.push({ name: 'MapView', params: { id: festivalId } });
}

// ---- 分享 ----
const showShareModal = ref(false);
const showExportImageModal = ref(false);
const isSharing = ref(false);
const generatedLink = ref('');

const shareButtonLabel = computed(() => {
  if (!isOnline.value) return '離線中無法分享';
  return isSharing.value ? '產生網址中...' : '分享行程網址';
});

const shareableFestivals = computed(() => {
  const fests = {};
  for (const p of plan.value) {
    if (!fests[p.festivalId]) {
      fests[p.festivalId] = { id: p.festivalId, name: p.festivalName, count: 0 };
    }
    fests[p.festivalId].count++;
  }
  return Object.values(fests);
});

function openShareModal() {
  if (!plan.value.length) {
    alert('目前沒有行程可以分享');
    return;
  }
  if (!isOnline.value) {
    alert('離線中無法產生分享網址，請連上網路後再試。');
    return;
  }
  generatedLink.value = '';
  showShareModal.value = true;
}

async function executeShare(festivalId) {
  isSharing.value = true;
  generatedLink.value = '';
  const subset = plan.value.filter((p) => p.festivalId === festivalId);

  try {
    const compressedData = encodePlanToText(subset);
    const originUrl = `${location.origin}${location.pathname}?plan=${encodeURIComponent(compressedData)}`;
    let finalUrl = originUrl;
    const gasUrl = import.meta.env.VITE_GAS_URL;
    if (gasUrl) {
      try {
        const res = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          mode: 'cors',
          body: JSON.stringify({ action: 'create', content: compressedData }),
        });
        const data = await res.json();
        if (data.err === false && typeof data.s === 'string') {
          finalUrl = `${window.location.origin}/${data.s}`;
        }
      } catch (err) {
        console.warn('短網址服務發生錯誤，改回原始長網址', err);
      }
    }
    generatedLink.value = finalUrl;
    trackEvent('generate_share_link', { festival_id: festivalId });
  } catch (err) {
    console.error('生成分享網址失敗:', err);
    alert('生成分享網址失敗，請稍後再試');
    showShareModal.value = false;
  } finally {
    isSharing.value = false;
  }
}

function copyGeneratedLink() {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(generatedLink.value)
      .then(() => alert('分享網址已複製到剪貼簿！'))
      .catch(() => prompt('複製以下網址分享：', generatedLink.value));
  } else {
    prompt('複製以下網址分享：', generatedLink.value);
  }
  trackEvent('copy_share_link');
}

onMounted(() => {
  festivalStore.ensureLoaded();
});
</script>
