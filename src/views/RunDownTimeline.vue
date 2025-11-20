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
      <div class="timeline-scroll-container">
        <div class="timeline-container" :style="timelineStyle">
          <!-- 表頭 - 舞台名稱 -->
          <div class="timeline-header">
            <div class="time-column-header">時間</div>
            <div v-for="stage in festival.stages" :key="stage.id" class="stage-column-header">
              {{ stage.name }}
            </div>
          </div>

          <!-- 時間行 -->
          <div v-for="timeSlot in currentDayTimeSlots" :key="timeSlot.time" class="timeline-row">
            <div class="time-cell">{{ timeSlot.time }}</div>
            <div v-for="stage in festival.stages" :key="stage.id" class="performance-cell">
              <div v-for="perf in getPerformanceAt(stage, timeSlot.timestamp)" :key="perf.artist + perf.start"
                class="performance-block" :style="getPerformanceStyle(perf, timeSlot.timestamp)"
                @click="togglePlan(stage, perf)"
                :class="isInPlan(stage, perf) ? 'performance-selected' : 'performance-available'">
                <div class="performance-artist">{{ perf.artist }}</div>
                <div class="performance-time">{{ formatTimeRange(perf.start, perf.end) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { usePlanStore } from '../stores/plan';

const route = useRoute();
const store = useFestivalStore();
const planStore = usePlanStore();
const selectedDay = ref('');
const loading = ref(false);

const festival = computed(() => {
  const id = route.params.id;
  return (store.getFestivals || []).find(f => f.festivalId === id);
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

// 生成當前選中日期的時間槽
const currentDayTimeSlots = computed(() => {
  if (!festival.value || !selectedDay.value) return [];

  const selectedDate = new Date(selectedDay.value);
  const timeSlots = [];

  // 找出當天所有表演的開始和結束時間
  const allTimes = new Set();
  festival.value.stages.forEach(stage => {
    stage.performances.forEach(perf => {
      const perfDate = new Date(perf.start);
      if (perfDate.toDateString() === selectedDate.toDateString()) {
        const start = new Date(perf.start);
        const end = new Date(perf.end);

        // 以15分鐘為單位生成時間點
        const current = new Date(start);
        current.setMinutes(Math.floor(current.getMinutes() / 15) * 15, 0, 0);

        while (current <= end) {
          allTimes.add(current.getTime());
          current.setMinutes(current.getMinutes() + 15);
        }
      }
    });
  });

  // 轉換為排序的時間槽陣列
  return Array.from(allTimes)
    .sort((a, b) => a - b)
    .map(timestamp => ({
      timestamp,
      time: new Date(timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    }));
});

// 計算時間軸樣式
const timelineStyle = computed(() => {
  const stageCount = festival.value?.stages.length || 0;
  return {
    display: 'grid',
    gridTemplateColumns: `120px repeat(${stageCount}, 1fr)`,
    gap: '1px',
    backgroundColor: '#e5e7eb'
  };
});

function formatTimeRange(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return `${start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
}

function getPerformanceAt(stage, timestamp) {
  const time = new Date(timestamp);
  return stage.performances.filter(perf => {
    const start = new Date(perf.start);
    const end = new Date(perf.end);
    return time >= start && time < end;
  });
}

function getPerformanceStyle(perf, currentTimestamp) {
  const start = new Date(perf.start);
  const end = new Date(perf.end);
  const current = new Date(currentTimestamp);

  // 計算在當前時間槽中的位置和高度
  const durationMinutes = (end - start) / (1000 * 60);
  const slotsCount = Math.ceil(durationMinutes / 15);

  return {
    minHeight: `${Math.max(slotsCount * 20, 60)}px`,
    position: 'relative'
  };
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
  if (!Array.isArray(store.getFestivals) || store.getFestivals.length === 0) {
    loading.value = true;
    const files = import.meta.glob('../../festivals/*.json');
    const loaded = [];
    for (const path in files) {
      try {
        const mod = await files[path]();
        loaded.push(mod.default);
      } catch (e) {
        console.error('Failed to load festival file:', path, e);
      }
    }
    store.$patch({ festivals: loaded });
    loading.value = false;
  }
  planStore.loadPlan();
});
</script>

<style scoped>
.timeline-scroll-container {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  /* iOS 滑動優化 */
  scrollbar-width: thin;
  /* Firefox 滾動條樣式 */
  scrollbar-color: #d1d5db #f3f4f6;
}

/* Webkit 滾動條樣式 (Chrome, Safari) */
.timeline-scroll-container::-webkit-scrollbar {
  height: 8px;
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
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
  min-width: 800px;
  /* 確保在小螢幕上有最小寬度 */
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
  z-index: 10;
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
  z-index: 10;
}

.timeline-row {
  display: contents;
}

.time-cell {
  background: #f9fafb;
  padding: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  border-right: 1px solid #d1d5db;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  left: 0;
  z-index: 5;
}

.performance-cell {
  background: white;
  padding: 0.25rem;
  border-right: 1px solid #d1d5db;
  border-bottom: 1px solid #e5e7eb;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.performance-block {
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  flex: 1;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.performance-available {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-color: #3b82f6;
}

.performance-available:hover {
  background: linear-gradient(135deg, #bfdbfe, #93c5fd);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.performance-selected {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-color: #10b981;
}

.performance-selected:hover {
  background: linear-gradient(135deg, #bbf7d0, #86efac);
}

.performance-artist {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.2;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.performance-time {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: 'Courier New', monospace;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .timeline-container {
    font-size: 0.75rem;
    min-width: 1000px;
    /* 手機版增加最小寬度確保滑動空間 */
  }

  .stage-column-header,
  .time-column-header {
    min-width: 100px;
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }

  .time-cell {
    min-width: 80px;
    padding: 0.375rem 0.25rem;
    font-size: 0.75rem;
  }

  .performance-cell {
    min-width: 100px;
    padding: 0.125rem;
  }

  .performance-block {
    padding: 0.375rem;
    min-height: 45px;
  }

  .performance-artist {
    font-size: 0.75rem;
    line-height: 1.1;
  }

  .performance-time {
    font-size: 0.625rem;
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
    min-width: 1200px;
    /* 超小螢幕增加更多滑動空間 */
  }

  .stage-column-header,
  .time-column-header {
    min-width: 120px;
  }

  .time-cell {
    min-width: 100px;
  }

  .performance-cell {
    min-width: 120px;
  }
}
</style>
