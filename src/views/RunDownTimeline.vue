<template>
  <div class="p-4 max-w-full mx-auto">
    <h2 class="text-xl font-bold mb-4">{{ festival?.name }} - 全日時間軸</h2>
    <div v-if="loading">載入中...</div>
    <div v-else-if="!festival">找不到此音樂祭</div>
    <div v-else>
      <!-- 日期分頁 -->
      <div v-if="festivalDays.length > 1" class="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button v-for="day in festivalDays" :key="day.dateKey" @click="selectedDay = day.dateKey"
          class="px-3 py-1 rounded border text-sm whitespace-nowrap flex-shrink-0"
          :class="selectedDay === day.dateKey ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'">
          {{ day.label }}
        </button>
      </div>

      <!-- 滑動提示 (僅在手機版顯示) -->
      <div
        class="mobile-scroll-hint md:hidden bg-blue-50 text-blue-700 text-sm px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"></path>
        </svg>
        左右滑動查看所有舞台
      </div>

      <!-- 時間軸容器 - 加強移動端滑動 -->
      <div class="timeline-scroll-container" ref="timelineScrollContainer">
        <div class="timeline-container" :style="timelineStyle">
          <!-- 表頭 - 舞台名稱 -->
          <div class="time-column-header" style="grid-column: 1; grid-row: 1;">時間</div>
          <div v-for="(stage, index) in festival.stages" :key="stage.id" class="stage-column-header" :style="{ gridColumn: index + 2, gridRow: 1 }">
            {{ stage.name }}
          </div>

          <!-- 時間行背景與標籤 -->
          <template v-for="(timeSlot, i) in currentDayTimeSlots" :key="timeSlot.time">
            <div class="time-cell" :style="{ gridColumn: 1, gridRow: i + 2 }">
              <span v-if="i > 0">{{ timeSlot.time }}</span>
            </div>
            <div v-for="(_, index) in festival.stages" :key="'bg-'+index+'-'+i" class="grid-bg-cell" :style="{ gridColumn: index + 2, gridRow: i + 2 }"></div>
          </template>

          <!-- 現在時間指示線 -->
          <div v-if="isToday && getCurrentTimeOffset() !== null"
               ref="currentTimeIndicatorEl"
               class="flex flex-row items-start z-30 pointer-events-none w-full"
               :style="getCurrentTimeLineStyle()">
            <div class="text-red-500 bg-red-50 px-1 text-[10px] sm:text-xs font-bold shrink-0 shadow-sm mr-1 rounded w-[var(--time-col-width,55px)] md:w-[var(--time-col-width,80px)] text-center transform -translate-y-1/2 ml-1">
              {{ formatTimeOnly(currentTime) }}
            </div>
            <div class="flex-1 border-t-[3px] border-red-500 relative transform -translate-y-1/2">
                <div class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500 absolute top-1/2 -left-1 transform -translate-y-1/2"></div>
            </div>
          </div>

          <!-- 演出區塊 (跨越 Grid 區域) -->
          <template v-for="(stage, stageIndex) in festival.stages" :key="'perf-col-'+stage.id">
            <div v-for="perf in getPerformancesForDay(stage, selectedDay)" :key="perf.artist + perf.start"
              class="performance-block relative m-1 rounded p-2 text-sm shadow cursor-pointer transition-transform hover:scale-[1.02]"
              :style="getPerformanceGridStyle(perf, stageIndex)"
              @click="togglePlan(stage, perf)"
              :class="isInPlan(stage, perf) ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 border-l-4 border-blue-600 hover:bg-blue-100'">
              <div class="font-bold">{{ perf.artist }}</div>
              <div class="text-xs opacity-80">{{ formatTimeRange(perf.start, perf.end) }}</div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';

const route = useRoute();
const store = useFestivalStore();
const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const selectedDay = ref('');
const loading = ref(false);
const timelineScrollContainer = ref(null);
const currentTimeIndicatorEl = ref(null);

const festival = computed(() => {
  const id = route.params.id;
  return store.festivals[id] || null;
});

// 獲取音樂祭的所有日期
const festivalDays = computed(() => {
  if (!festival.value) return [];

  const days = new Set();
  festival.value.stages.forEach(stage => {
    stage.performances.forEach(perf => {
      const date = new Date(perf.start);
      days.add(date.toDateString());
    });
  });

  return Array.from(days).map(dateKey => {
    const date = new Date(dateKey);
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return {
      dateKey,
      label: `${date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} (${weekdays[date.getDay()]})`
    };
  }).sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
});

// 設置預設選中的日期 - 使用 watch 來監聽 festivalDays 的變化
watch(festivalDays, (newDays) => {
  if (newDays.length > 0 && !selectedDay.value) {
    selectedDay.value = newDays[0].dateKey;
  }
}, { immediate: true });

// 生成當前選中日期的時間槽 (10分鐘區隔)
const currentDayTimeSlots = computed(() => {
  if (!festival.value || !selectedDay.value) return [];

  const selectedDate = new Date(selectedDay.value);
  let minTime = null;
  let maxTime = null;

  // 找出當天最早和最晚的表演時間
  festival.value.stages.forEach(stage => {
    stage.performances.forEach(perf => {
      const perfDate = new Date(perf.start);
      if (perfDate.toDateString() === selectedDate.toDateString()) {
        const start = new Date(perf.start).getTime();
        const end = new Date(perf.end).getTime();
        if (!minTime || start < minTime) minTime = start;
        if (!maxTime || end > maxTime) maxTime = end;
      }
    });
  });

  if (!minTime || !maxTime) return [];

  const timeSlots = [];
  // 基準化最早時間到整點或最近的 10 分鐘，並刻意提早 20 分鐘作為頂部緩衝
  const startTime = new Date(minTime);
  startTime.setMinutes(Math.floor(startTime.getMinutes() / 10) * 10 - 20, 0, 0);

  // 加上一些緩衝，刻意延後 20 分鐘作為底部緩衝
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

  return timeSlots;
});

// 計算時間軸樣式
const timelineStyle = computed(() => {
  const stageCount = festival.value?.stages.length || 0;
  const slotsCount = currentDayTimeSlots.value.length || 0;
  
  // 第一列為 Header，第二列為第一個時間網格，其他為剩餘時間網格
  // 我們讓第一個時間網格高度變矮 (例如 20px) 或甚至隱藏不佔空間，其餘每格 40px
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
});

function formatTimeRange(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return `${start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour })} - ${end.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour })}`;
}

function formatTimeOnly(dateObj) {
  if (!dateObj) return '';
  return dateObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour });
}

function getPerformancesForDay(stage, selectedDayStr) {
  const selectedDateStr = new Date(selectedDayStr).toDateString();
  return stage.performances.filter(perf => {
    return new Date(perf.start).toDateString() === selectedDateStr;
  });
}

function getPerformanceGridStyle(perf, stageIndex) {
  const start = new Date(perf.start).getTime();
  const end = new Date(perf.end).getTime();
  
  const slots = currentDayTimeSlots.value;
  if (!slots.length) return {};

  const baseTime = slots[0].timestamp;
  // 每個 row 是 10 分鐘，從 gridRow 2 開始
  const msPerSlot = 10 * 60 * 1000;
  
  // 計算開始落在第幾個 row (相對 baseTime)
  const offsetRows = (start - baseTime) / msPerSlot;
  const startRow = Math.round(offsetRows) + 2;
  
  const spanRows = Math.round((end - start) / msPerSlot);

  return {
    gridColumn: stageIndex + 2,
    gridRow: `${startRow} / span ${Math.max(1, spanRows)}`,
    zIndex: 10
  };
}

const isToday = computed(() => {
  if (!selectedDay.value) return false;
  return new Date(selectedDay.value).toDateString() === new Date().toDateString();
});

const currentTime = ref(new Date());
let timeInterval = null;

onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
});

function getCurrentTimeOffset() {
  const slots = currentDayTimeSlots.value || [];
  if (!slots.length) return null;
  
  const nowMs = currentTime.value.getTime();
  const baseTime = slots[0].timestamp;
  const lastTime = slots[slots.length - 1].timestamp;

  if (nowMs < baseTime || nowMs > lastTime + 10 * 60 * 1000) return null;

  const msPerSlot = 10 * 60 * 1000;
  return (nowMs - baseTime) / msPerSlot;
}

function getCurrentTimeLineStyle() {
  const offsetRows = getCurrentTimeOffset();
  if (offsetRows === null) return { display: 'none' };
  
  const startRow = Math.floor(offsetRows) + 2;
  const fraction = offsetRows - Math.floor(offsetRows);
  
  const rowHeight = startRow === 2 ? 20 : 40;
  const topOffset = fraction * rowHeight;
  
  return {
    gridColumn: '1 / -1',
    gridRow: startRow,
    position: 'relative',
    top: `${topOffset}px`
  };
}

function scrollToCurrentTime() {
  if (!isToday.value) return;
  nextTick(() => {
    const container = timelineScrollContainer.value;
    if (!container) return;
    const indicator = currentTimeIndicatorEl.value || container.querySelector('.border-red-500');
    if (!indicator) return;
    const containerRect = container.getBoundingClientRect();
    const indicatorRect = indicator.getBoundingClientRect();
    const scrollTop = container.scrollTop + indicatorRect.top - containerRect.top - container.clientHeight / 3;
    container.scrollTop = Math.max(0, scrollTop);
  });
}



// 行程管理功能
function perfKey(stage, perf) {
  return (
    (festival.value?.festivalId || '') + '_' +
    (stage?.name || '') + '_' +
    (perf?.artist || '') + '_' +
    (perf?.start || '')
  );
}

function isInPlan(stage, perf) {
  const key = perfKey(stage, perf);
  return (planStore.myPlan || []).some(
    p => perfKey({ name: p.stage }, p) === key && p.festivalId === festival.value.festivalId
  );
}

function togglePlan(stage, perf) {
  if (isInPlan(stage, perf)) {
    planStore.removePerformance(perfKey(stage, perf));
  } else {
    planStore.addPerformance({
      ...perf,
      stage: stage.name,
      festivalId: festival.value.festivalId,
      festivalName: festival.value.name,
      id: perfKey(stage, perf),
    });
  }
}

onMounted(async () => {
  loading.value = true;
  const id = route.params.id;
  await store.loadFestivalDetail(id);
  loading.value = false;
  planStore.loadPlan();
  // 如果今天就是活動日，等資料載入後滾動到現在時間
  await nextTick();
  scrollToCurrentTime();
});
</script>

<style scoped>
.timeline-scroll-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  -webkit-overflow-scrolling: touch;
  /* iOS 滑動優化 */
  scrollbar-width: thin;
  /* Firefox 滾動條樣式 */
  scrollbar-color: #d1d5db #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
}

/* Webkit 滾動條樣式 (Chrome, Safari) */
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
  z-index: 30; /* 必須高於 time-cell 與 stage-column-header */
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

/* 網格背景小撇步 */
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

  /* 手機版滑動提示動畫 */
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

@media (max-width: 480px) {
  .timeline-container {
    --stage-col-width: 80px;
    --time-col-width: 55px;
    min-width: 100%;
  }
}
</style>
