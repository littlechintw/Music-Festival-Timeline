<template>
  <div class="p-4 max-w-3xl mx-auto relative">
    <h1 class="text-2xl font-bold mb-4">我的行程</h1>
    <!-- ...existing code... -->
    <div v-if="plan.length === 0" class="text-gray-400">尚未加入任何演出</div>
    <div v-else>
      <!-- 統計資訊 -->
  <div class="bg-white rounded-xl p-6 mb-6 shadow-lg text-gray-800 relative" style="box-shadow: 0 4px 24px 0 rgba(30,64,175,0.10), 0 0px 8px 0 rgba(30,64,175,0.10);">
        <!-- 桌面版：右上角浮動按鈕 -->
  <button v-if="plan.length" @click="openShareModal" :disabled="isSharing" class="absolute top-2 right-6 px-3 py-1 rounded border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm hidden md:inline-flex">
          <span v-if="isSharing" class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          {{ isSharing ? '產生網址中...' : '分享行程網址' }}
        </button>
        <!-- 手機版：區塊底部寬度 100% 按鈕 -->
  <button v-if="plan.length" @click="openShareModal" :disabled="isSharing" class="block w-full mt-2 mb-4 px-3 py-2 rounded border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm md:hidden">
          <span v-if="isSharing" class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          {{ isSharing ? '產生網址中...' : '分享行程網址' }}
        </button>
        <!-- <h2 class="text-2xl font-bold mb-2">我的音樂祭行程</h2> -->
  <div class="flex flex-wrap gap-6 text-sm mt-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd"></path>
            </svg>
            <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{{ plan.length }}</span>
            <span>場演出</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
                clip-rule="evenodd"></path>
            </svg>
            <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{{ planDays.length }}</span>
            <span>天行程</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clip-rule="evenodd"></path>
            </svg>
            <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{{ uniqueFestivals.length }}</span>
            <span>個音樂祭</span>
          </div>
        </div>
      </div>

      <!-- 日期選擇標籤 -->
      <div v-if="planDays.length > 1" class="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button v-for="day in planDays" :key="day.dateKey" @click="selectedPlanDay = day.dateKey"
          class="px-4 py-2 rounded-lg text-sm whitespace-nowrap flex-shrink-0 transition-all font-medium flex items-center gap-2"
          :class="selectedPlanDay === day.dateKey ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'">
          <span>{{ day.label }}</span>
          <span class="inline-flex items-center justify-center text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full"
                :class="selectedPlanDay === day.dateKey ? 'text-blue-600 bg-white' : 'text-white bg-blue-600'">
            {{ day.count }}
          </span>
        </button>
      </div>

      <!-- 單日時間軸 -->
      <div v-for="day in planDays" :key="day.dateKey" v-show="selectedPlanDay === day.dateKey"
  class="bg-white rounded-xl shadow-lg overflow-hidden">
  <div class="bg-blue-600 text-white px-6 py-6">
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
                <div class="text-yellow-100 text-xs">{{ getCurrentTimeString() }}</div>
              </div>
              <div v-if="day.festivalEntries && getDayFestivalsWithMap(day).length > 0" class="flex flex-wrap gap-1 justify-end">
                <button v-for="fest in getDayFestivalsWithMap(day)" :key="fest.id"
                  @click="goToMap(fest.id)"
                  class="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                  </svg>
                  {{ getDayFestivalsWithMap(day).length > 1 ? fest.name + ' ' : '' }}場地地圖
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 甘特圖式時間軸 - 網格版本 -->
        <div class="timeline-scroll-container" :ref="el => { if (day.isToday && el) todayScrollContainerEl = el }">
          <div class="timeline-container" :style="getTimelineStyle(day)">
            <!-- 表頭 - 舞台名稱 -->
            <div class="time-column-header" style="grid-column: 1; grid-row: 1;">時間</div>
            <div v-for="(stage, index) in day.stages" :key="stage" class="stage-column-header" :style="{ gridColumn: index + 2, gridRow: 1 }">
              {{ stage }}
            </div>

            <!-- 時間行背景與標籤 -->
            <template v-for="(timeSlot, i) in day.timeSlots" :key="timeSlot.time">
              <div class="time-cell" :style="{ gridColumn: 1, gridRow: i + 2 }">
                <span v-if="i > 0">{{ timeSlot.time }}</span>
              </div>
              <div v-for="(_, index) in day.stages" :key="'bg-'+index+'-'+i" class="grid-bg-cell" :style="{ gridColumn: index + 2, gridRow: i + 2 }"></div>
            </template>

            <!-- 現在時間指示線 -->
            <div v-if="day.isToday && getCurrentTimeOffset(day) !== null"
                 :ref="el => { if (el) todayCurrentTimeEl = el }"
                 class="flex flex-row items-start z-30 pointer-events-none w-full"
                 :style="getCurrentTimeLineStyle(day)">
              <div class="text-red-500 bg-red-50 px-1 text-[10px] sm:text-xs font-bold shrink-0 shadow-sm mr-1 rounded w-[var(--time-col-width,55px)] md:w-[var(--time-col-width,80px)] text-center transform -translate-y-1/2 ml-1">
                {{ formatTimeOnly(currentTime) }}
              </div>
              <div class="flex-1 border-t-[3px] border-red-500 relative transform -translate-y-1/2">
                  <div class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500 absolute top-1/2 -left-1 transform -translate-y-1/2"></div>
              </div>
            </div>

            <!-- 演出區塊 (跨越 Grid 區域) -->
            <template v-for="(stage, stageIndex) in day.stages" :key="'perf-col-'+stage">
              <div v-for="perf in getPerformancesForStage(day, stage)" :key="perf.id"
                class="performance-block relative m-1 rounded p-2 text-sm shadow transition-transform hover:scale-[1.02] bg-blue-600 text-white"
                :style="getPerformanceGridStyle(perf, stageIndex, day)">
                <div class="font-bold">{{ perf.artist }}</div>
                <div class="text-xs opacity-80">{{ formatTimeRange(perf.start, perf.end) }}</div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 分享選單 Modal -->
    <div v-if="showShareModal" class="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-[100] p-4" @click="!isSharing && (showShareModal = false)">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full mx-auto shadow-2xl relative" @click.stop>
        
        <!-- 當正在產生網址時，顯示蓋板遮罩 -->
        <div v-if="isSharing" class="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex flex-col items-center justify-center z-10">
          <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
          <h3 class="text-lg font-bold text-gray-800">請稍候...</h3>
          <p class="text-sm text-gray-500 mt-2">正在產生分享網址</p>
        </div>

        <template v-if="!generatedLink">
          <h3 class="text-xl font-bold mb-4 text-center">選擇要分享的音樂祭</h3>
          <div class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            <button v-for="fest in shareableFestivals" :key="fest.id" 
              @click="executeShare(fest.id)" 
              :disabled="isSharing"
              class="px-4 py-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-left flex justify-between items-center transition-colors disabled:opacity-50">
              <span class="truncate pr-2">{{ fest.name }}</span>
              <span class="text-sm bg-purple-200 text-purple-800 px-2 py-1 rounded-full whitespace-nowrap">{{ fest.count }} 場</span>
            </button>
          </div>
          <button @click="showShareModal = false" :disabled="isSharing" class="mt-6 w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors disabled:opacity-50">取消</button>
        </template>
        
        <template v-else>
          <div class="flex justify-center mb-4 text-green-500">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2 text-center text-gray-800">網址產生成功！</h3>
          <p class="text-sm text-gray-600 mb-4 text-center">可以複製以下連結分享給朋友</p>
          <div class="mb-6 relative">
            <input type="text" readonly :value="generatedLink" @click="$event.target.select()" class="w-full pr-10 pl-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors">
          </div>
          <div class="flex gap-3">
            <button @click="copyGeneratedLink" class="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium transition-colors shadow-sm">複製網址</button>
            <button @click="showShareModal = false" class="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors">關閉</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { usePlanStore } from '../stores/plan';
import { generateICS } from '../utils/ics';
import { googleCalendarLinks } from '../utils/calendar';
import { compressToUrl, decompressFromUrl } from '../utils/url';
import { useFestivalStore } from '../stores/festival';
import { useSettingsStore } from '../stores/settings';
import { trackEvent } from '../utils/analytics.js';
import { useRouter } from 'vue-router';

const planStore = usePlanStore();
const festivalStore = useFestivalStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const plan = ref([]);
const currentTime = ref(new Date()); // 響應式的當前時間
let timeUpdateInterval = null;
const todayScrollContainerEl = ref(null);
const todayCurrentTimeEl = ref(null);

onMounted(async () => {
  planStore.loadPlan();
  plan.value = planStore.myPlan || [];
  setInterval(() => plan.value = planStore.myPlan || [], 30 * 1000); // 自動刷新

  // 每秒更新當前時間，讓時間線動態移動
  timeUpdateInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);

  // 如果節慶資料尚未載入，則嘗試載入行程中使用的節慶資料
  const plannedIds = [...new Set((planStore.myPlan || []).map(p => p.festivalId).filter(Boolean))];
  await Promise.all(plannedIds.map(id => festivalStore.loadFestivalDetail(id)));

  // 等待 DOM 更新後滾動到今天的現在時間
  await nextTick();
  scrollToCurrentTime();

  // 檢查 URL 參數是否有分享的行程，此處已棄用改移至 RedirectShortUrl.vue 處理
  // checkSharedPlanInUrl();
});

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
});

const selectedPlanDay = ref('');

// 統計唯一音樂祭
const uniqueFestivals = computed(() => {
  const festivalNames = [...new Set(plan.value.map(p => p.festivalName).filter(Boolean))];
  return festivalNames;
});

// 音樂祭 Map，用於快速查詢（只在 festivals 更新時重建）
const festivalMap = computed(() =>
  new Map(Object.entries(festivalStore.festivals))
);

// 按日期分組行程
const planDays = computed(() => {
  if (!plan.value.length) return [];

  const grouped = {};
  const today = currentTime.value.toDateString();

  plan.value.forEach(perf => {
    const date = new Date(perf.start);
    const dateKey = date.toDateString();

    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        dateKey,
        date,
        isToday: dateKey === today,
        performances: [],
        festivalNames: new Set()
      };
    }

    grouped[dateKey].performances.push({
      ...perf,
      isPast: currentTime.value > new Date(perf.end || perf.start)
    });

    if (perf.festivalName) {
      grouped[dateKey].festivalNames.add(perf.festivalName);
    }
  });

  // 轉換為陣列並排序
  const days = Object.values(grouped).map(day => {
    // 按時間排序當天演出
    day.performances.sort((a, b) => new Date(a.start) - new Date(b.start));

    // 取得當天所有用到的舞台，按照音樂祭原本的舞台順序排列
    const festivalIds = [...new Set(day.performances.map(p => p.festivalId).filter(Boolean))];
    const stageOrderSet = new Set();
    festivalIds.forEach(festId => {
      const fest = festivalMap.value.get(festId);
      if (fest && fest.stages) {
        fest.stages.forEach(s => stageOrderSet.add(s.name));
      }
    });
    const stageIndexMap = new Map([...stageOrderSet].map((name, i) => [name, i]));
    const stages = [...new Set(day.performances.map(p => p.stage))].filter(Boolean)
      .sort((a, b) => {
        const aIdx = stageIndexMap.has(a) ? stageIndexMap.get(a) : Infinity;
        const bIdx = stageIndexMap.has(b) ? stageIndexMap.get(b) : Infinity;
        return aIdx - bIdx;
      });

    // 計算時間槽 (以 10 分鐘為一區間)
    let minTime = null;
    let maxTime = null;
    day.performances.forEach(perf => {
      const start = new Date(perf.start).getTime();
      const end = new Date(perf.end || perf.start).getTime();
      if (!minTime || start < minTime) minTime = start;
      if (!maxTime || end > maxTime) maxTime = end;
    });

    const timeSlots = [];
    if (minTime && maxTime) {
      // 提早20分鐘
      const startTime = new Date(minTime);
      startTime.setMinutes(Math.floor(startTime.getMinutes() / 10) * 10 - 20, 0, 0);

      // 延後20分鐘
      const endTime = new Date(maxTime);
      endTime.setMinutes(Math.ceil(endTime.getMinutes() / 10) * 10 + 20, 0, 0);

      let current = new Date(startTime);
      while (current <= endTime) {
        timeSlots.push({
          timestamp: current.getTime(),
          time: current.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour })
        });
        current.setMinutes(current.getMinutes() + 10);
      }
    }

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    
    // 格式化為 YYYY.MM.DD
    const yyyy = day.date.getFullYear();
    const mm = String(day.date.getMonth() + 1).padStart(2, '0');
    const dd = String(day.date.getDate()).padStart(2, '0');
    
    // 收集當天各音樂祭的 ID 與名稱
    const festivalIdSet = [...new Set(day.performances.map(p => p.festivalId).filter(Boolean))];
    const festivalEntries = festivalIdSet.map(id => ({
      id,
      name: day.performances.find(p => p.festivalId === id)?.festivalName || id
    }));

    return {
      ...day,
      label: `${yyyy}.${mm}.${dd} (${weekdays[day.date.getDay()]})`,
      count: day.performances.length,
      festivalNames: Array.from(day.festivalNames),
      festivalEntries,
      stages,
      timeSlots
    };
  }).sort((a, b) => a.date - b.date);

  // 設定預設選中的日期 - 優先選今天
  if (days.length > 0 && !selectedPlanDay.value) {
    const todayPlan = days.find(day => day.isToday);
    selectedPlanDay.value = todayPlan ? todayPlan.dateKey : days[0].dateKey;
  }

  return days;
});





function formatDate(str, timeOnly = false) {
  const d = new Date(str);
  if (timeOnly) return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour });
  return d.toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short', hour12: !settingsStore.is24Hour });
}

function formatTimeOnly(dateObj) {
  if (!dateObj) return '';
  return dateObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour });
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour });
}

function formatTimeRange(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr || startStr);
  return `${start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour })} - ${end.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour })}`;
}

function getTimelineStyle(day) {
  const stageCount = day.stages ? day.stages.length : 0;
  const slotsCount = day.timeSlots ? day.timeSlots.length : 0;
  
  const gridRows = slotsCount > 0 
    ? `auto 20px repeat(${Math.max(0, slotsCount - 1)}, 40px)`
    : 'auto';

  return {
    display: 'grid',
    gridTemplateColumns: `var(--time-col-width, 80px) repeat(${stageCount}, minmax(var(--stage-col-width, 0), 1fr))`,
    gridTemplateRows: gridRows,
    backgroundColor: '#e5e7eb',
    gap: '1px'
  };
}

function getPerformancesForStage(day, stageName) {
  return day.performances.filter(perf => perf.stage === stageName);
}

function getPerformanceGridStyle(perf, stageIndex, day) {
  const start = new Date(perf.start).getTime();
  const end = new Date(perf.end || perf.start).getTime();
  
  const slots = day.timeSlots || [];
  if (!slots.length) return {};

  const baseTime = slots[0].timestamp;
  const msPerSlot = 10 * 60 * 1000;
  
  const offsetRows = (start - baseTime) / msPerSlot;
  const startRow = Math.round(offsetRows) + 2;
  const spanRows = Math.round((end - start) / msPerSlot);

  return {
    gridColumn: stageIndex + 2,
    gridRow: `${startRow} / span ${Math.max(1, spanRows)}`,
    zIndex: perf.isPast ? 5 : 10,
    opacity: perf.isPast ? 0.6 : 1
  };
}

function getCurrentTimeString() {
  return currentTime.value.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour });
}

function scrollToCurrentTime() {
  nextTick(() => {
    const container = todayScrollContainerEl.value;
    if (!container) return;
    const indicator = todayCurrentTimeEl.value || container.querySelector('.border-red-500');
    if (!indicator) return;
    const containerRect = container.getBoundingClientRect();
    const indicatorRect = indicator.getBoundingClientRect();
    const scrollTop = container.scrollTop + indicatorRect.top - containerRect.top - container.clientHeight / 3;
    container.scrollTop = Math.max(0, scrollTop);
  });
}



function hasFestivalMap(festivalId) {
  const festival = festivalStore.festivals[festivalId];
  return !!(festival?.map?.image);
}

function getDayFestivalsWithMap(day) {
  return (day.festivalEntries || []).filter(f => hasFestivalMap(f.id));
}

function goToMap(festivalId) {
  router.push({ name: 'MapView', params: { id: festivalId } });
}

function getCurrentTimeOffset(day) {
  if (!day || !day.isToday) return null;
  const slots = day.timeSlots || [];
  if (!slots.length) return null;
  
  const nowMs = currentTime.value.getTime();
  const baseTime = slots[0].timestamp;
  const lastTime = slots[slots.length - 1].timestamp;

  // 加上一些寬限，不要超過最後一個時間槽太多
  if (nowMs < baseTime || nowMs > lastTime + 10 * 60 * 1000) return null;

  const msPerSlot = 10 * 60 * 1000;
  return (nowMs - baseTime) / msPerSlot;
}

function getCurrentTimeLineStyle(day) {
  const offsetRows = getCurrentTimeOffset(day);
  if (offsetRows === null) return { display: 'none' };
  
  const startRow = Math.floor(offsetRows) + 2;
  const fraction = offsetRows - Math.floor(offsetRows);
  
  // 第一列 (Header) 自適應，第二列 (第一個時間槽) 為 20px，之後均為 40px
  const rowHeight = startRow === 2 ? 20 : 40;
  const topOffset = fraction * rowHeight;
  
  return {
    gridColumn: '1 / -1',
    gridRow: startRow,
    position: 'relative',
    top: `${topOffset}px`
  };
}

function getPerformanceCardClass(perf) {
  const baseClasses = 'bg-white border-l-4';

  if (perf.isPast) {
    return baseClasses + ' border-l-gray-400 bg-gray-50';
  }

  return baseClasses + ' ' + getStageColor(perf.stage);
}

function getTimelineDotColor(stageName, festivalName) {
  const festivalColor = getFestivalColor(festivalName);
  const stageColor = getStageColorForFestival(stageName, festivalColor);
  return stageColor.dotClass;
}

// 音樂祭顏色配置
function getFestivalColor(festivalName) {
  const festivalColors = {
    '測試音樂祭 Test Music Festival 2025': {
      primary: 'orange',
      colors: ['orange-500', 'orange-400', 'orange-600', 'orange-300']
    },
    '火球祭 Fireball Festival 2025': {
      primary: 'red',
      colors: ['red-500', 'red-400', 'red-600', 'red-300']
    }
  };

  // 預設顏色系統
  const defaultColors = [
    { primary: 'blue', colors: ['blue-500', 'blue-400', 'blue-600', 'blue-300'] },
    { primary: 'purple', colors: ['purple-500', 'purple-400', 'purple-600', 'purple-300'] },
    { primary: 'green', colors: ['green-500', 'green-400', 'green-600', 'green-300'] },
    { primary: 'pink', colors: ['pink-500', 'pink-400', 'pink-600', 'pink-300'] },
    { primary: 'indigo', colors: ['indigo-500', 'indigo-400', 'indigo-600', 'indigo-300'] }
  ];

  if (festivalColors[festivalName]) {
    return festivalColors[festivalName];
  }

  // 根據音樂祭名稱hash選擇顏色
  const hash = Array.from(festivalName || '').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultColors[hash % defaultColors.length];
}

// 為特定音樂祭和舞台生成顏色
function getStageColorForFestival(stageName, festivalColor) {
  const stageIndex = Math.abs((stageName?.charCodeAt(0) || 0)) % festivalColor.colors.length;
  const colorName = festivalColor.colors[stageIndex];

  return {
    borderClass: `border-l-${colorName}`,
    bgClass: `bg-${colorName.replace('-500', '-50')}`, // 使用淺色背景
    dotClass: `bg-${colorName}`
  };
}

function getStageColor(stageName) {
  const colors = {
    'border-l-blue-500': ['火舞台', 'main', 'primary'],
    'border-l-purple-500': ['球舞台', 'second', 'secondary'],
    'border-l-green-500': ['祭舞台', 'third', 'stage3'],
    'border-l-orange-500': ['火球村', 'village', 'small'],
    'border-l-pink-500': ['其他', 'other'],
  };

  for (const [colorClass, keywords] of Object.entries(colors)) {
    if (keywords.some(keyword => stageName?.toLowerCase().includes(keyword))) {
      return colorClass;
    }
  }

  // 根據舞台名稱的第一個字符決定顏色
  const colorIndex = (stageName?.charCodeAt(0) || 0) % 5;
  return ['border-l-blue-500', 'border-l-purple-500', 'border-l-green-500', 'border-l-orange-500', 'border-l-pink-500'][colorIndex];
}

// 分享/匯入/匯出功能
function encodePlanToText(planArray) {
  if (!planArray.length) return '';
  const festId = planArray[0].festivalId;
  const stages = {};
  
  const pad = (n) => String(n).padStart(2, '0');
  
  planArray.forEach(p => {
    if (!stages[p.stage]) stages[p.stage] = [];
    const d = new Date(p.start);
    // 使用 MMDDHHmm 來代表這場演出
    const shortTime = `${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
    stages[p.stage].push(shortTime);
  });

  const stageStrings = Object.entries(stages).map(([stage, times]) => {
    return `${stage}:${times.join(',')}`;
  });

  // 例如：fireball-2025;火舞台:03211200,03211400;球舞台:03221530
  return `${festId};${stageStrings.join(';')}`;
}

const showShareModal = ref(false);

const shareableFestivals = computed(() => {
  const fests = {};
  plan.value.forEach(p => {
    if (!fests[p.festivalId]) {
      fests[p.festivalId] = { id: p.festivalId, name: p.festivalName, count: 0 };
    }
    fests[p.festivalId].count++;
  });
  return Object.values(fests);
});

function openShareModal() {
  if (!plan.value.length) {
    alert('目前沒有行程可以分享');
    return;
  }
  
  // 無論有幾個音樂祭，都跳出選單讓使用者選擇要分享哪一場
  generatedLink.value = '';
  showShareModal.value = true;
}

const isSharing = ref(false); // 控制按鈕讀取狀態
const isImporting = ref(false); // 控制讀取匯入行程的狀態
const generatedLink = ref(''); // 儲存產生的連結

async function executeShare(festivalId) {
  // 不立刻關閉 modal，讓使用者看到 loading 遮罩
  isSharing.value = true;
  generatedLink.value = '';
  
  // 只過濾出選中該音樂祭的行程
  const festivalPlan = plan.value.filter(p => p.festivalId === festivalId);

  try {
    const compressedData = encodePlanToText(festivalPlan);
    const originUrl = `${location.origin}${location.pathname}?plan=${encodeURIComponent(compressedData)}`;

    // 嘗試打 API 產生短網址
    let finalUrl = originUrl;
    const gasUrl = import.meta.env.VITE_GAS_URL;
    
    if (gasUrl) {
      try {
        const payload = {
          action: "create",
          content: compressedData // 只儲存行程資料字串
        };
        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          mode: 'cors',
          body: JSON.stringify(payload)
        });
        const resData = await response.json();
        
        if (resData.err === false) {
          // 短網址使用跟目前的 host 一樣，附帶短碼
          finalUrl = `${window.location.origin}/${resData.s}`;
        }
      } catch (e) {
        console.warn('短網址服務發生錯誤，改回原始長網址', e);
      }
    }

    generatedLink.value = finalUrl;
    trackEvent('generate_share_link', { festival_id: festivalId });
  } catch (error) {
    console.error('生成分享網址失敗:', error);
    alert('生成分享網址失敗，請稍後再試');
    showShareModal.value = false;
  } finally {
    isSharing.value = false;
  }
}

function copyGeneratedLink() {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(generatedLink.value).then(() => {
      alert('分享網址已複製到剪貼簿！');
    }).catch(error => {
      console.error('複製到剪貼簿失敗:', error);
      prompt('複製以下網址分享：', generatedLink.value);
    });
  } else {
    prompt('複製以下網址分享：', generatedLink.value);
  }
  trackEvent('copy_share_link');
}

function exportICS(perfs) {
  const ics = generateICS(perfs);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-festival-plan.ics';
  a.click();
  URL.revokeObjectURL(url);
  trackEvent('export_ics', { performance_count: perfs.length });
}

function exportGoogle(perfs) {
  if (perfs.length === 0) return;
  const links = googleCalendarLinks(perfs);
  for (const link of links) {
    window.open(link, '_blank');
  }
  trackEvent('export_google_calendar', { performance_count: perfs.length });
}
</script>

<style scoped>
.timeline-scroll-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
}

.timeline-scroll-container::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.timeline-scroll-container::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.timeline-scroll-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.timeline-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.timeline-container {
  background: white;
  min-width: 100%;
}

.timeline-header {
  display: contents;
}

.time-column-header {
  background: #f3f4f6;
  font-weight: 600;
  padding: 0.75rem;
  border-right: 1px solid #d1d5db;
  border-bottom: 2px solid #d1d5db;
  text-align: center;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 30;
}

.stage-column-header {
  background: #f3f4f6;
  font-weight: 600;
  padding: 0.75rem;
  border-right: 1px solid #d1d5db;
  border-bottom: 2px solid #d1d5db;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 20;
}

.time-cell {
  background: white;
  padding: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  font-weight: 500;
  border-right: 1px solid #e5e7eb;
  position: sticky;
  left: 0;
  z-index: 15;
}

.time-cell span {
  transform: translateY(-50%);
  background: white;
  padding: 0 4px;
}

.grid-bg-cell {
  background: white;
  border-right: 1px solid #f3f4f6;
  border-top: 1px dashed #e5e7eb;
}

.grid-bg-cell:nth-child(even) {
  background: #fafafa;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .timeline-container {
    --stage-col-width: 70px;
    --time-col-width: 55px;
    font-size: 0.75rem;
    min-width: 100%;
  }

  .stage-column-header,
  .time-column-header {
    padding: 0.5rem 0.25rem;
    font-size: 0.7rem;
  }

  .time-cell {
    padding: 0.375rem 0.25rem;
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .timeline-container {
    --stage-col-width: 80px;
    --time-col-width: 55px;
    min-width: 100%;
  }
}
</style>
